[![build status](https://secure.travis-ci.org/ncb000gt/node-googleanalytics.png)](http://travis-ci.org/ncb000gt/node-googleanalytics)
Google Analytics
============

Pull data from Google Analytics for use in projects.

The library maintains tracking of the token so that you don't have to and will push the token around with your requests. Should you require a different token, just create a new GA instance. However, this is asynchronous through eventing so if you do want the token you can latch onto the event.

* Updated for NodeJS 0.6.x *


Usage
============

    var ga = require('googleanalytics') 
    ,util = require('util'); 
    
    var GA = new ga.GA();
    GA.login(function(err, token) {
           var options = {
    	     'ids': 'ga:<profileid>',
	     'start-date': '2010-09-01',
	     'end-date': '2010-09-30',
	     'dimensions': 'ga:pagePath',
	     'metrics': 'ga:pageviews',
	     'sort': '-ga:pagePath'
           };
           GA.get(options, function(err, entries) {
                             util.debug(JSON.stringify(entries));
                           });
         });


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


License
============

see license file


[beezee]:https://github.com/beezee
