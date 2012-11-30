"use strict";

var ga = require('../lib/ga');

var profile='';
var username='';
var password='';

var GA = new ga.GA({
  user: username,
  password: password
});

var dimensions = [
  'ga:date'
];

var metrics = [
  'ga:pageviews',
  'ga:visitors',
  'ga:transactions',
  'ga:transactionRevenue'
];

GA.login(function(err, token) {
  var options = {
    'ids': 'ga:'+profile,
    'start-date': '2012-07-01',
    'end-date': '2012-07-02',
    'dimensions': dimensions.join(','),
    'metrics': metrics.join(','),
    'sort': 'ga:date'
  };

  GA.get(options, function(err, entries) {
    if (!err) {
      console.log('date,pageviews,visitors,transactions,sales');
      entries.forEach(function(entry) {
        var buf = entry.dimensions[0]['ga:date'];

        metrics.forEach(function(metric) {
          buf += ',' + entry.metrics[0][metric];
        });

        console.log(buf);

      });
    } else {
      console.log(err);
    }
  });
});
