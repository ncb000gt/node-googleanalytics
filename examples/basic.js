var ga = require('../lib/ga');

var profile='';
var username='';
var password='';

var GA = new ga.GA({
  user: username,
  password: password
});
GA.login(function(err, token) {
  var options = {
    'ids': 'ga:'+profile,
  'start-date': '2012-07-01',
  'end-date': '2012-08-10',
  'dimensions': 'ga:pagePath',
  'metrics': 'ga:pageviews',
  'sort': '-ga:pagePath'
  };
  GA.get(options, function(err, entries) {
    console.log(entries);
  });
});
