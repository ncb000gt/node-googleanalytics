Google Analytics
============

Pull data from Google Analytics for use in projects.

The library maintains tracking of the token so that you don't have to and will push the token around with your requests. Should you require a different token, just create a new GA instance. However, this is asynchronous through eventing so if you do want the token you can latch onto the event.


Usage
============

    var ga = require('ga') 
    ,sys = require('sys'); 
    
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
                             sys.debug(JSON.stringify(entries));
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


License
============

see license file