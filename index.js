var fs = require('fs');
var util = require('util');
var express = require('express');
var config = require('./config');
var app = express();
var pg = require('pg');

app.use(express.static('public'));

var pgConfig = {
  user: config.db.username,
  password: config.db.password,
  database: config.db.database,
  port: 5432,
  host: config.db.hostname
};

var queries = {
  veldnamen: fs.readFileSync('./queries/veldnamen.sql', {encoding: 'utf8'}),
  transect: fs.readFileSync('./queries/transect.sql', {encoding: 'utf8'})
}

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
  pg.connect(pgConfig, function(err, client, done) {
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
  console.log('Nienes Veldnamen! 🐐');
});
