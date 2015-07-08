//-------------------
// creating map layers
//-------------------
var oldMap = L.tileLayer('http://s.map5.nl/map/gast/tiles/tmk_1850/EPSG900913/{z}/{x}/{y}.png' )
var newMap = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
var reliefMap = L.tileLayer('http://s.map5.nl/map/gast/tiles/relief_struct/EPSG900913/{z}/{x}/{y}.jpeg')

//-------------------
// Update maps!
//-------------------

var current = oldMap;
var other = newMap
var changeLayer = function(){
  map.removeLayer(current);
  if(current == oldMap){
    current = newMap
    other = oldMap
  } 
  else{ 
    current = oldMap
    other = newMap} ;
  map.addLayer(current);
};

//-------------------
//Make the map
//-------------------
var map = new L.map('map', {
  maxZoom: 15,
  minZoom: 12,
  layers: current
});

map.setView([53.079529, 6.614894], 14);
map.setMaxBounds([
  [52.861743, 6.458972],
  [53.202277, 6.958035]
]);

//-------------------
//Make the MINI map
//-------------------
var miniOptions = {
  minZoom: 12, 
  maxZoom: 15
};
// var miniMap =  new L.Control.Layers.Minimap(other, options)
// miniMap.addTo(map);

//-------------------
// Velden met naam tekenen
//-------------------
d3.json('veldnamen', function(json){
  console.log("requesting fields from database");
  L.geoJson(json.features[0], 
    {style:{
      "fillColor": "#B3BC31",
      "stroke": false,
      "fillOpacity": "0.6"}
    }
  ).addTo(map);
});

//-------------------
// Functions 
//-------------------`
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

var waterFunction = d3.svg.area()
  .x( lineFunction.x())
  .y0(lineFunction.y())
  .y1( lineFunction.y())
  .interpolate("basis");

function groupBy(array, index){
  var groups = {};
  array.forEach( function(object){

    var group = JSON.stringify( index(object));
        console.log(group)
    groups[group] = groups[group] || [];
    groups[group].push( object );  
  });
  return Object.keys(groups).map( function(group){
    return groups[group]; 
  });
};

//-------------------
// Initialise drawing features
//-------------------
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
        repeatMode: true
      }, 
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

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl); 

//-------------------
// Nederlandse zinnen ipv engels
//-------------------
L.drawControl = {
  draw:{
    toolbar:{
      buttons:{
        polyline: "hala"
      }
    },
    handlers:{
      polyline: {
        tooltip:{
          start: 'Klik om een lijn te tekenen',
          cont: 'Klik om te tekenen',
          end: "Klik op het laatste punt om de lijn af te maken"
        }
      }
    }
  }
};



//-------------------
// Initialize transect line
//-------------------
var line = d3.select("#line");
line.attr("background-image", "http://www.danone.nl/Danone/media/Danone/HeaderBackgrounds/Lucht.jpg?width=1600&height=800&ext=.jpg")
var widthLine = line.style("width").replace("px", "");
var width = widthLine/100;
var heightdif = 150;

//-------------------
// Moving map marker
//-------------------
var mouseMarker = L.circleMarker([53.079529, 6.614894], {
  color: 'none',
  radius: 10, 
  fillColor: '#EC8F2D',
  fillOpacity: 1
}).addTo(map);

line
  .append("circle")
  .attr("r", 5)
  .attr("fill", "none")
  .attr("cy", heightdif)
  .attr("cx", 0);
  
line
  .append("text")
  .attr("x", 0)
  .attr("y", heightdif-10)
  .attr("font-family", "sans-serif")
  .attr("font-size", "14px")
  .attr("fill", "black")
  .attr("class", "meters")
  .text("");  
  
  
//-------------------
// NAP line
//-------------------
line.append("line")
  .attr("x1", 56)
  .attr("y1", heightdif)
  .attr("x2", widthLine)
  .attr("y2", heightdif)
  .attr("stroke", "black")
  .attr("stroke-width", 1)
  .style("stroke-dasharray", ("3, 3"));
  
line.append("text")
  .text("NAP lijn")
  .attr("x", 6)
  .attr("y", heightdif+2)
  .attr("class", "NAP")
  .attr("font-family", "sans-serif")
  .attr("font-size", "13px")
  
//-------------------
// Initiate line drawing
//-------------------
var coordinates = "6.625041066727135%2053.09510641588805,6.633795796951745%2053.083714492247026";
updateTransect(coordinates);

var lijn = L.polyline([[53.09510641588805,6.625041066727135], [53.083714492247026,6.633795796951745]],{
    color: "#EC8F2D"
  });
lijn.addTo(map);

//-------------------
// update line
//-------------------
map.on('draw:created', function(e){
  var type = e.layerType;
  var layer = e.layer; 
  if (type === 'polyline'){
    coordinates = layer.getLatLngs().map(function(latLng){
      return latLng.lng + '%20' + latLng.lat;
    }).join(',');
  };
  updateTransect(coordinates);
  lijn.setLatLngs(layer.getLatLngs()).addTo(map)
});

//-------------------
// Drawing the transect svg
//-------------------
function updateTransect(coordinates){
  d3.json('transect?linestring=' + coordinates, function(json){
    console.log("requesting line from database");
    
    //-------------------
    // Get field names: filter out duplicate points
    //-------------------
    var prev = json[0].naam;
    var perc = json[0].percentage;
    var field = json.filter(function(object){
      if (object.naam !== prev && object.percentage !== perc) {
        prev = object.naam;
        perc = object.percentage
        return true;
      }
      return false;
    }); 
    
    //-------------------
    // groups soil fields
    //-------------------
    var soil = groupBy(json, function(item){
      return [item.naam];
      });
    //-------------------
    // groups water fields
    //-------------------
    var water = json.filter(function(object, index, array){
      return  object.typewater}); 
    var waterGroups = groupBy(water, function(item){
      return [item.waterid]});
      
    //-------------------
    // Interactivity Line
    //-------------------
    function mousemove(){
      var x0 = d3.mouse(this)[0];
      bisect = d3.bisector(function(d) { return d.percentage*width; }).left;
      var i = bisect(json, x0, 1);
      var y = json[i].heights;
      
      // Circle moving over the line //
      line.selectAll('circle')
        .attr("cx", function(x){
           return x0
            })
        .attr("cy", function(x){
            return y*-5+heightdif
            })
        .attr("fill", "#EC8F2D");
      // height text //
      d3.select('.meters')
        .attr("x", function(x){
           return x0
        })
        .attr("y", function(x){
            return y*-5+heightdif -30
        })  
        .text( function (x) { 
              return Math.round(y) + " m"
        });
      // Marker on map location //
      var latLng = json[i].geometry.coordinates.slice(0, 2);
      latLng.reverse();
      mouseMarker.setLatLng(latLng);
    };
    d3.select("body")
      .on("mousemove", mousemove);
    //-------------------
    //remove previous landscape if exists
    //-------------------
    line.selectAll("path, image, .soilName, .water").remove();
    //-------------------
    // soil area draw
    //-------------------     
    var area = line.selectAll(".bodem")
      .data(soil)
      .enter()
      .append("path")
      .attr("class", "bodem")
      .attr("d" , function(d){
        if(d[0].naam !== null){
          return areaFunction(d)}
        })
      .attr("fill", "#EC8F2D")
      .attr("opacity", "0.8")
      .attr("stroke", "none")
      .attr("stroke-width", "none")
      .on("mouseover", function(){
        d3.select(this)
        .attr("fill", "#B3BC31")
      })
      .on("mouseout", function(){
        d3.select(this)
        .attr("fill", "#EC8F2D")
      })
      .on("mouseclick", function(){
        d3.select(this).enter().append("text")
        .text("hallo")
        
      });
    //-------------------
    // Water area
    //-------------------
    var water = line.selectAll(".water")
      .data(waterGroups)
      .enter()
      .append("path")
      .attr("class", "water")
      .attr("d" , function(d){
        if(d.length > 0) {return waterFunction(d)}
        })
      .attr("fill", "steelblue")
      .attr("opacity", "0.5")
      .attr("stroke", "steelblue")
      .attr("stroke-width", "5px");

    //-------------------
    //draw transect line
    //-------------------
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

    //-------------------
    // Field name text
    var text = line.selectAll("text")
      .data(field)
      .enter()
      .append("text")
      .attr("class", "soilName")
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
      .attr("font-size", "18px")
      .attr("fill", "black")
      .attr("text-anchor", "top left")
      .attr("transform", function(x){
        return "rotate(40 " + x.percentage * width +"," + (x.heights*-5+ heightdif +30) + ")"
      });
  
    //-------------------
    // symbols on the line
    //-------------------
    function drawSymbols(grouparray){
      var pictureset = [];
      for (i=0; i < grouparray.length; i++){
        var l = grouparray[i].length
        if(l<10){
          var d = Math.floor(Math.random()*(l + 1 ))
          pictureset.push([grouparray[i][d]])
        }
        else if(l>10 && l <20){
          var d = Math.floor(Math.random()*(l + 1 -l/2))
          var e = Math.floor(Math.random()*(l + 1 +l/2))
          pictureset.push([grouparray[i][d]],[grouparray[i][e]])
        }
        // * (max - min + 1)) + min;
        else if(l>20){
          var d = Math.floor(Math.random()*(l - (l*0.75) + 1)+(l*0.75));//4
          var e = Math.floor(Math.random()*((l*0.75) - (l*0.5)+ 1) + (l*0.5)); // 3e
          var f = Math.floor(Math.random()*((l*0.5) - (l*0.25)+1) + (l*0.25)); // 2e
          var g = Math.floor(Math.random()*((l*0.25)+1)); // 1e deel
          pictureset.push([grouparray[i][d]],[grouparray[i][e]],[grouparray[i][f]],[grouparray[i][g]]);
        };
      } return pictureset 
    };
    
    var pictures = drawSymbols(soil);
    var pict = pictures.filter(function(d){
      if( d[0] !== undefined ){
        return true
      } else return false
    });
  
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
        switch(x[0].category1){
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
        };
      });
  });
};

  
    