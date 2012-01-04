var express = require('express');
var request = require('request');
var createStatic = require('../../nodejs/static');

var server;

exports.setUp = function(callback) {
  server = express.createServer();
  server.configure(function() {
    server.use(express.errorHandler());
    server.use(createStatic.static());
  });
  server.listen(3030, function() {
    callback(); 
  });
};

exports['test Express middleware serving'] = function(test) {
  request('http://localhost:3030/createjs.org/jquery.Midgard.midgardCreate.js', function(err, resp, body) {
    test.equal(resp.statusCode, 200);
    test.equal(resp.headers['content-type'], 'application/javascript');
    test.done();
  });
};

exports['test Express middleware not serving'] = function(test) {
  request('http://localhost:3030/createjs.org/jquery.Midgard.midgardCreate.gif', function(err, resp, body) {
    test.equal(resp.statusCode, 404);
    test.done();
  });
};

exports.tearDown = function(callback) {
  server.close();
  callback();
};
