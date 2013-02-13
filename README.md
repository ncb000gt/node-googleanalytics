Google Analytics
============

Pull data from Google Analytics for use in projects.

The library maintains tracking of the token so that you don't have to and will push the token around with your requests.
Should you require a different token, just create a new GA instance. However, this is asynchronous through eventing so if you do want the token you can latch onto the event.

* Updated for NodeJS 0.6.x *


Usage
============

With a user and password:

    var GA = require('googleanalytics'),
        util = require('util'),
        config = {
            "user": "myusername",
            "password": "mypassword"
        },
        ga = new GA.GA(config);

    ga.login(function(err, token) {
        var options = {
            'ids': 'ga:<profileid>',
            'start-date': '2010-09-01',
            'end-date': '2010-09-30',
            'dimensions': 'ga:pagePath',
            'metrics': 'ga:pageviews',
            'sort': '-ga:pagePath'
        };

        ga.get(options, function(err, entries) {
           util.debug(JSON.stringify(entries));
        });
    });

If you have already gotten permission from a user, you can simply use the oAuth access token you have:

    var GA = require('googleanalytics'),
        util = require('util'),
        config = {
            "token": "XXXXXXXXXXXX"
        },
        ga = new GA.GA(config);
    
    var options = {
        'ids': 'ga:<profileid>',
        'start-date': '2010-09-01',
        'end-date': '2010-09-30',
        'dimensions': 'ga:pagePath',
        'metrics': 'ga:pageviews',
        'sort': '-ga:pagePath'
    };

    ga.get(options, function(err, entries) {
        util.debug(JSON.stringify(entries));
    });

You can specify the type of token by setting 'tokenType', default is 'Bearer'.

See [node-gapitoken][gapi] for easy service account Server to Server authorization flow.

Rudamentary API
============

* login([callback]) - The callback is optional. However, if it is given, it is added to the `token` event.
* get(options, callback)


Event API
============

* token(err, token)
* entries(err, entries)


Entry API
============

* metrics[]
* dimensions[]

Each array contains objects. These objects contain the following:

* name - The name of the metric or dimension requested
* value - The value associated. If the value is a Number, it is parsed for you. Otherwise, it will be a string.


Contributors
===========

* [Brian Zeligson][beezee] - Updates for a more recent version of node. Also makes use of better selectors.
* [Mike Schierberl][mschierberl]
* [Gal Ben-Haim][bsphere] - Bug fixes for access token flow.

License
============

see license file


[beezee]:https://github.com/beezee
[mschierberl]:https://github.com/mschierberl
[bsphere]:https://github.com/bsphere

[gapi]:https://github.com/bsphere/node-gapitoken
