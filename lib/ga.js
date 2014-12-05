var https = require('https')
,querystring = require('querystring')
,emitter = require('events').EventEmitter

,inherits = function (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false
        }
    });
};;

function GA(config) {
    if (config) {
        if ('user' in config) {
            this.user = config.user;
            this.tokenType = 'GoogleLogin';
        }
        if ('password' in config) {
            this.password = config.password;
        }
        this.token = ('token' in config) ? config.token : null;
        if ('token' in config) {
            this.tokenType = config.tokenType || 'Bearer';
        }
        if ('token' in config && ('user' in config || 'password' in config)) {
            throw Error("Invalid config.");
        }
    } else {
        throw Error("No config given.");
    }
};

inherits(GA, emitter);

exports.GA = GA;

GA.prototype.captureToken = function(err, token) {
    this.token = token;
};

function combineChunks(chunks, length) {
    var buf = new Buffer(length);
    var off = 0;
    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        chunk.copy(buf, off, 0);
        off += chunk.length;
    }
    return buf;
}

GA.prototype.login = function(cb) {
    var self = this;

    this.removeAllListeners('token');

    this.on('token', this.captureToken);

    if (cb) this.on('token', cb);

    var postData = {
        Email: this.user,
        Passwd: this.password,
        accountType: "HOSTED_OR_GOOGLE",
        source: "curl-accountFeed-v2",
        service: "analytics"
    };

    var options = { host: "www.google.com", port: 443, method: 'POST', path: '/accounts/ClientLogin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    var req = https.request(options, function(res) {
        var chunks = [];
        var length = 0;
        res.on('data', function(chunk) {
            chunks.push(chunk);
            length += chunk.length;
        });
        res.on('end', function() {
            var data = combineChunks(chunks, length).toString();
            var m = data.match(/(Auth=[^\s]*)\s/);
            if (!m) {
                m = data.match(/(Error=[^\s]*)\s/);
                if(m) {
                    var errMessage = m[0].replace('Error=', '');
                    var err = new Error(errMessage);
                    err.responseData = data;
                    self.emit('token', err, null);   
                } else {
                    self.emit('error', data);
                }
            } else {
                self.emit('token', null, m[1]);
            }
        });
    });
    req.write(querystring.stringify(postData));
    req.end();
};

/*
 * var options = {
 ids:'ga:11731936',
 "start-date":"2010-09-01",
 "end-date":"2010-09-30",
 dimensions:"ga:pagePath",
 metrics:"ga:pageviews,ga:bounces,ga:entrances",
 sort:"-ga:pagePath"
 };
 */
GA.prototype.get = function(options, cb) {
    var self = this;

    var rt = (options.metrics.lastIndexOf('rt:',0) === 0 ? true : false);
    var data_url = "/analytics/v3/data/" + (rt ? "realtime?" : "ga?") + querystring.stringify(options);

    var get_options = {
        host: 'www.googleapis.com',
        port: 443,
        path: data_url,
        method: 'GET',
        headers: {
            Authorization: this.tokenType + " " + this.token,
            "GData-Version": 2
        }
    };

    var req = https.request(get_options, function(res) {
        var chunks = [];
        var length = 0;
        res.on('data', function(chunk) {
            chunks.push(chunk);
            length += chunk.length;
        });
        res.on('end', function() {
            var entries = []
            ,metric_indexes = []
            ,metrics = []
            ,dimensions = []
            ,dimension_indexes = [];

            var data_data = combineChunks(chunks, length).toString();
            
            var parsed_data = JSON.parse(data_data);

            if (parsed_data.error) {
              var err = new Error(parsed_data.error.message);
              if (typeof cb === 'function' ) {
                return cb(err);
              }
            }

            if (!parsed_data.rows) {
                parsed_data.rows = [];
            }

            for (var col=0; col<parsed_data.columnHeaders.length; col++){
                if(parsed_data.columnHeaders[col]['columnType'] === "METRIC"){
                    metric_indexes.push(col);
                    metrics.push(parsed_data.columnHeaders[col]);
                }
                if(parsed_data.columnHeaders[col]['columnType'] === "DIMENSION"){
                    dimension_indexes.push(col);
                    dimensions.push(parsed_data.columnHeaders[col]);
                }
            }


            for (var i=0; i<parsed_data.rows.length; i++){
                var entry = {metrics:[], dimensions:[]};

                var object_metric = {};
                for (var j=0; j<metrics.length; j++){
                    object_metric[metrics[j].name] = parseFloat(parsed_data.rows[i][metric_indexes[j]]);
                }
                entry.metrics.push(object_metric);

                var object_dimension = {};
                for (var j=0; j<dimensions.length; j++){
                    object_dimension[dimensions[j].name] = parsed_data.rows[i][dimension_indexes[j]];
                }
                entry.dimensions.push(object_dimension);

                self.emit('entry', entry);
                entries.push(entry);

            }

            if (typeof cb === 'function' ) cb(null, entries);
                
        });
    });
    req.end();
};
