var select = require('soupselect').select
,htmlparser = require('htmlparser')
,sys = require('sys')
,http = require('http')
,querystring = require('querystring')
,emitter = require('events').EventEmitter;

var USER_EMAIL="info@seoversite.com";
var USER_PASS="axiomst4ck";

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
    this.client = new http.createClient(443, 'www.google.com', true);
};

sys.inherits(GA, emitter);

exports.GA = GA;

GA.prototype.captureToken = function(err, token) {
    this.token = token;
};

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

    var request = this.client.request("POST", '/accounts/ClientLogin', {
                                          "Content-Type": 'application/x-www-form-urlencoded'
                                      });
    request.end(querystring.stringify(postData));
    request.on('response', function(res) {
                   var data = "";
                   res.on('data', function(chunk) {
                              data += chunk;
                          });
                   res.on('end', function() {
                              var idx = data.indexOf('Auth=');
                              if (idx < 0) {
                                  self.emit('token', data, null);
                              } else {
                                  self.emit('token', null, data.substring(idx));
                              }
                          });
               });
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

    this.on('entries', cb);

    var data_url = "/analytics/feeds/data?" + querystring.stringify(options);
    var data_request = this.client.request("GET", data_url, {
                                               Authorization:"GoogleLogin "+this.token,
                                               "GData-Version": 2
                                           });

    data_request.end();
    data_request.on('response', function(data_response) {
                        var data_data = "";
                        data_response.on('data', function(chunk) {
                                             data_data+=chunk;
                                         });
                        data_response.on('end', function() {
                                           data_response.connection.end();
                                             if (data_data.indexOf("<?xml") == 0) {
                                                 var parser = new htmlparser.Parser(
                                                     new htmlparser.DefaultHandler(function(err, dom) {
                                                                                       if (err) {
                                                                                           this.emit('entries', err);
                                                                                           return;
                                                                                       } else {
                                                                                           var entries = [];
                                                                                           select(dom, 'entry').forEach(function(element) {
                                                                                                                            var entry = {metrics:[], dimensions:[]};
                                                                                                                            var children = element.children;
                                                                                                                            var len = children.length;
                                                                                                                            for (var i = 0; i < len; i++) {
                                                                                                                                var item = children[i];
                                                                                                                                if (item.name in {"id":'',"updated":''}) continue;
                                                                                                                                var metric = false;
                                                                                                                                if (item.name == "dxp:metric") {
                                                                                                                                    metric = true;
                                                                                                                                }
                                                                                                                                var o = {};
                                                                                                                                if (item.attribs) {
                                                                                                                                    var attrs = item.attribs;
                                                                                                                                    if ('name' in attrs && 'value' in attrs) {
                                                                                                                                        var name = item.attribs['name'];
                                                                                                                                        var value = item.attribs['value'];
                                                                                                                                        o.name = name;
                                                                                                                                        if (isNaN(value)) {
                                                                                                                                            o.value = value;
                                                                                                                                        } else {
                                                                                                                                            o.value = parseInt(value, 10);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                                if ('name' in o && 'value' in o) {
                                                                                                                                    if (metric) {
                                                                                                                                        entry.metrics.push(o);
                                                                                                                                    } else {
                                                                                                                                        entry.dimensions.push(o);
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            if (entry.metrics.length > 0 || entry.dimensions.length > 0) {
                                                                                                                                entries.push(entry);
                                                                                                                            }
                                                                                                                        });

                                                                                           self.emit('entries', null, entries);
                                                                                         return;
                                                                                       }
                                                                                   }));
                                                 parser.parseComplete(data_data);
                                             }
                                         });
                    });
};