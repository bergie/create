var pathMatcher = new RegExp('^/createjs.org/([a-zA-Z.]+).(css|js)');
var fs = require('fs');

exports.static = function() {
  return function(req, res, next) {
    var matched = pathMatcher.exec(req.url);
    if (!matched) {
      return next();
    }
    
    if (matched[2] === 'js') {
      var path = __dirname + '/../src/' + matched[1] + '.js';
      fs.readFile(path, 'utf-8', function(err, data) {
        if (err) {
          next(err);
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'application/javascript'
        });
        res.end(data); 
      });
      return;
    }

    next();
  };
};
