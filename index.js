var fs = require('fs');
var util = require('util');
var express = require('express');
var config = require('./config');
var app = express();
var pg = require('pg');

app.use(express.static('public'));

var conString = util.format("postgres://%s:%s@%s/%s", config.db.username, config.db.password, config.db.hostname, config.db.database);

var queries = {
  veldnamen: fs.readFileSync('./queries/veldnamen.sql', {encoding: 'utf8'}),
  transect: fs.readFileSync('./queries/transect.sql', {encoding: 'utf8'})
}

app.get('/', function (req, res) {
  res.send({
    message: 'Welkom op Nienes eerste API!',
    urls: [
      'http://localhost:3000/map.html',
      'http://localhost:3000/veldnamen',
      'http://localhost:3000/transect?linestring=6.608791351318359 53.08185850865092,6.626729965209961 53.083147394638345'
    ]
  });
});

app.get('/veldnamen', function (req, res) {
  query(queries.veldnamen, null, function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(
        {
          type: 'FeatureCollection',
          features: [
            result.rows.map(function(d){
              return JSON.parse(d.geojson);
            })
          ]
        })
      }
    });
});

app.get('/transect', function (req, res) {
  query(queries.transect, ['LINESTRING (' + req.query.linestring + ')'] , function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(result.rows.map(function(row) {
        row.geometry = JSON.parse(row.geometry);
        return row;
      }));
    }
  })
});

function query(sql, params, callback) {

  // Voor meer informatie over node-postgres, zie:
  // https://github.com/brianc/node-postgres
  pg.connect(conString, function(err, client, done) {
    if(err) {
      callback(err);
    } else {
      client.query(sql, params, function(err, result) {
        done();
        callback(err, result);
      });
    }
  });
}

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Nienes API is bereikbaar op http://%s:%s', host, port);
});
