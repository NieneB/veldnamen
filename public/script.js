var tileUrl = 'http://s.map5.nl/map/gast/tiles/tmk_1850/EPSG900913/{z}/{x}/{y}.png'

function getMap(maps){
  console.log("click!")
  switch (maps){
    case "newMap":
      tileUrl = 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png'
      L.tileLayer(tileUrl).addTo(map);
      console.log("1")
      break;
    case "oldMap":
      tileUrl = 'http://s.map5.nl/map/gast/tiles/tmk_1850/EPSG900913/{z}/{x}/{y}.png'
      L.tileLayer(tileUrl).addTo(map);
      console.log("2")
      break;
    case "reliefMap":
      tileUrl = 'http://s.map5.nl/map/gast/tiles/relief_struct/EPSG900913/{z}/{x}/{y}.jpeg'
      L.tileLayer(tileUrl).addTo(map);
      console.log("3")
      break;
  };
};


var map = L.map('map');
L.tileLayer(tileUrl).addTo(map);
map.setView([53.079529, 6.614894], 14);    

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var options = {
  edit: {
    featureGroup: drawnItems
  },
  draw:{
    polyline:{
      shapeOptions:{
        allowIntersection: false,
        repeatMode: true,
        drawError: {
          color: '#e1e100',
          message: 'you can\'t draw intersecting lines!'
        }
      } 
    },
    polygon: false,
    circle: false,
    rectangle: false,
    marker: false
  }
};

//draw field with field name //
d3.json('query1', function(json){
  console.log("requesting fields from database");
  L.geoJson(json.features[0], 
    {style:{
      "fillColor": "#66cc66",
      "stroke": false,
      "fillOpacity": "0.6"}
    }
  ).addTo(map);
});

//control line drawing 
var drawControl = new L.Control.Draw(options);
map.addControl(drawControl); 
  
map.on('draw:created', function(e){
  var type = e.layerType;
  var layer = e.layer; 
  if (type === 'polyline'){
    var coordinates = layer.getLatLngs().map(function(latLng){
      return latLng.lng + '%20' + latLng.lat;
    }).join(',');
    d3.json('query4?linestring=' + coordinates, function(json){
      console.log("requesting line from database")
      console.log(json);

      // range of heights for transect line
      var heights = json.map(function(object){
        if (object.heights !== null){
          return object;
        }
        else {return object.heights = -5};
      });
            console.log(heights);
      // filter duplicate points
      var prev = "niene";
      var field = json.filter(function(object){
        if (object.naam !== prev) {
          prev = object.naam;
          return true;
        }
        return false;
      }); 
      
      
      //decoration stuff
      var decoration = json.filter(function(object){
        if (object.naam == null){
          return false;
        }
        return true;
      })
      console.log(decoration)
      // line making function
      
      //start drawing in svg #line//
      var line = d3.select("#line");
      
      //remove previous//
      line.selectAll("path, text, circle, image, line").remove();
      
      //get width line panel
      var widthLine = d3.select("#line").style("width").replace("px", "");
      var width = widthLine/100
      var heightdif = 150
      //draw field locations
      var fields = line.selectAll("circle")
        .data(field)
        .enter()
        .append("circle")  
        .attr("cx", function(x){
          return (x.percentage*width)
        })
        .attr("cy", function(x){
          return x.heights*-5+heightdif
        })  
        .attr("r", 5)
        .attr("fill", "red");
      
      //append text to line
      var text = line.selectAll("text")
        .data(field)
        .enter()
        .append("text")
        .attr("x", function(x){
          return x.percentage * width
        })
        .attr("y", function(x){
          return x.heights*-5+ heightdif + 15
        })
        .text( function (x) { 
          if (x.naam !== null) {return x.naam}
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .attr("text-anchor", "top left")
        .attr("transform", function(x){
          return "rotate(60 " + x.percentage * width +"," + (x.heights*-5+ heightdif +15) + ")"
        });
      
      // apend category symbol to fields
      var cat = line.selectAll("image")
        .data(field)
        .enter()
        .append("svg:image")
        .style("height", "50")
        .style("width", "50")
        .attr("anchor", "bottom left")
        .attr("x", function(x){
          return x.percentage * width-25
        })
        .attr("y", function(x){
          return (x.heights*-5)+heightdif-50
        })
        .attr("xlink:href",  function(x){ 
          switch(x.category){
          case "wilde_dieren": return "/pict/animal.svg"
          break;
          case "beekdal_moeras": return "/pict/swomp.svg"
          break;
          case "beekdalen_moerassen": return "/pict/swomp.svg"
          break;
          case "bossen": return "/pict/forest.svg"
          break;
          }
        });
      
      //draw transect line/
      var lineFunction = d3.svg.line()
        .x( function(d){
          return (d.percentage * width)
        })
        .y( function(d){
          return (d.heights*-5)+ heightdif
        })
        .interpolate("basis-open");
      
      
        
      var linestring = [json[0]];
    var NAP = line.selectAll("line")
      .data(linestring)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("y1", heightdif)
      .attr("x2", widthLine)
      .attr("y2", heightdif)
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .style("stroke-dasharray", ("3, 3"));
    
      line.selectAll("path")
        .data(linestring)
        .enter()
        .append("path")
        .attr("d", lineFunction(json))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "none");
      
      var decoline = line.selectAll("deco")
        .data(decoration)
        .enter()
        .append("line")
        .attr("d", lineFunction(decoration))
        .attr("stroke", "red")
        .attr("stroke-width", 10);
        
        
      //filling up the area!
      // var areaFunction = d3.svg.area()
      //   .x( function(d){
      //     return (d.percentage/100)
      //   })
      //   .y1( function(d){
      //     return (d.heights*5)+100
      //   })
      //   .y0(function(d){
      //     return 300})
      //   .interpolate("basis");
      //
      // var area = line.selectAll("area")
      //   .data(field)
      //   .enter()
      //   .append("area")
      //   .attr("d" , areaFunction(field))
      //   .style("fill", "steelblue");

    });
  }
  map.addLayer(layer);
  drawnItems.addLayer(layer);
});
