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


var map = L.map('map',
  {options: {
    maxZoom: 14
    }
  })  ;

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
  },
  edit:{
    featureGroup: drawnItems,
    edit: false,
    remove: false
      }
};


L.drawLocal.draw.toolbar.buttons.polyline = 'Teken een lijn door de velden heen!';


//draw fields with field name //
d3.json('veldnamen', function(json){
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
    d3.json('transect?linestring=' + coordinates, function(json){
      console.log("requesting line from database")

      // Get field names: filter out duplicate points
      var prev = json[0].naam;
      var field = json.filter(function(object){
        if (object.naam !== prev) {
          prev = object.naam;
          return true;
        }
        return false;
      }); 
      
      // line groups
      function groupBy(array, f){
        var groups = {};
        array.forEach( function(o){
          var group = JSON.stringify( f(o) );
          groups[group] = groups[group] || [];
          groups[group].push( o );  
          });
        return Object.keys(groups).map( function(group){
          return groups[group]; 
          })
      };
      var soil = groupBy(json, function(item){
        return [item.naam];
        });
      console.log(soil)
      
////// drawing the landscape: ////////////
      
      //start drawing in svg #line//
      var line = d3.select("#line");
      
      //remove previous//
      line.selectAll("path, text, circle, image, line").remove();
      
      //get width line panel
      var widthLine = line.style("width").replace("px", "");
      var width = widthLine/100
      var heightdif = 150

      // line and area function
      var lineFunction = d3.svg.line()
        .x( function(d){
          return (d.percentage * width)})
        .y( function(d){
          return (d.heights*-5)+ heightdif})
        .interpolate("basis-open");
    
      var areaFunction = d3.svg.area()
        .x( lineFunction.x())
        .y0( lineFunction.y())
        .y1(300)
        .interpolate("basis");
      
      //filling up the area
      var area = line.selectAll(".bodem")
        .data(soil)
        .enter()
        .append("path")
        .attr("class", "bodem")
        .attr("d" , function(d){
          if(d[0].naam !== null){
            return areaFunction(d)}
          })
        .attr("fill", "brown")
        .attr("opacity", "0.3")
        .attr("stroke", "none")
        .attr("stroke-width", "none");
        
        
      //draw transect line//
      var linestring = [json[0]];
    
      line.selectAll(".transect")
        .data(linestring)
        .enter()
        .append("path")
        .attr("class", "transect")
        .attr("d", lineFunction(json))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "none");
      
      
      
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
      
      
      
    
    // drawing null line
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
    
    
      // drawing field line locations
      var soilline = line.selectAll(".deco")
        .data(soil)
        .enter()
        .append("path")
        .attr("class", "deco")
        .attr("d", function(d){
          if(d[0].naam !== null){
            return lineFunction(d)}
          })
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "none");
        
        function drawSymbols(grouparray){
          var pictureset = []
          for (i=0; i < grouparray.length; i++){
            var l = grouparray[i].length
            
            for( s=0; s < l/10/2; s++){
              var d = Math.floor(Math.random()*(l + 1 ))
              pictureset.push([grouparray[i][d]])
            }
            
        } return pictureset 
      };

      
      var pictures = drawSymbols(soil)
      var pict = pictures.filter(function(d){
        if( d[0] !== undefined ){
          return true
        } else return false
      })
    // apend category symbol to fields
    var cat = line.selectAll("image")
      .data(pict)
      .enter()
      .append("svg:image")
      .style("width", "50")
      .style("height", "50")
      .attr("anchor", "bottom center")
      .attr("x", function(x){
        return x[0].percentage * width-25
      })
      .attr("y", function(x){
        return (x[0].heights*-5)+heightdif-50
      })
      .attr("xlink:href",  function(x){ 
        switch(x[0].category){
        case "wilde_dieren": return "/pict/animal.svg"
        break;
        case "D2": return "/pict/swomp.svg"
        break;
        case "D9": return "/pict/swomp.svg"
        break;
        case "D1": return "/pict/swomp.svg"
        break;
        case "E1": return "/pict/e7.svg"
        break;
        case "E4": return "/pict/e7.svg"
        break;
        case "E16": return "/pict/e6.svg"
        break;
        case "G1": return "/pict/g1.svg"
        break;
        case "G6": return "/pict/g6.svg"
        break;
        case "E6": return "/pict/e6.svg"
        break;
        case "E14": return "/pict/e14.svg"
        break;
        case "E7": return "/pict/e7.svg"
        break;
        case "E13": return "/pict/e13.svg"
        break;
        }
      });
    });
  }
  map.addLayer(layer);
  drawnItems.addLayer(layer);
});



    
    
    
    
    