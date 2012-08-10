var https = require('https')
,querystring = require('querystring')
,emitter = require('events').EventEmitter
,DOMParser= require('xmldom').DOMParser
,$ = require('jquery')
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
        }
        if ('password' in config) {
            this.password = config.password;
        }
    } else {
        throw Error("No config given.");
    }
    this.token = null;
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
                self.emit('error', data);
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

    var data_url = "/analytics/feeds/data?" + querystring.stringify(options);

    var get_options = {
        host: 'www.google.com',
        port: 443,
        path: data_url,
        method: 'GET',
        headers: {
            Authorization:"GoogleLogin "+this.token,
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
            var entries = [];
            var data_data = combineChunks(chunks, length).toString();
            var doc = new DOMParser().parseFromString(data_data);
            $(doc).find('entry').each(function(){
                                var entry = {metrics:[], dimensions:[]};
                                $(this).children()
                                    .filter(function() {
                                        return ($(this).prop('tagName') === 'dxp:metric'
                                                || $(this).prop('tagName') === 'dxp:dimension');
                                    }).each(function(){
                                    var item =$(this);
                                    var metric = false;
                                    if (item.prop('tagName') === "dxp:metric") {
                                        metric = true;
                                    }
                                    if (item.attr('name') && item.attr('value')) {
                                        var o = {};
                                        o[item.attr('name')] = (isNaN(item.attr('value'))) ? item.attr('value') : parseInt(item.attr('value'), 10);
                                        if (metric) {
                                            entry.metrics.push(o);
                                        } else {
                                            entry.dimensions.push(o);
                                        }
                                    }
                                });
                                if (entry.metrics.length > 0 || entry.dimensions.length > 0) {
                                    self.emit('entry', entry);
                                    entries.push(entry);
                                }
                            });

                            if (typeof cb === 'function' ) cb(null, entries)
        });
    });
    req.end();
};
