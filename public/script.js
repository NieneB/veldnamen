//-------------------
// creating map layers
//-------------------
var basemaps ={ 
  "_1830": L.tileLayer('http://s.map5.nl/map/gast/tiles/tmk_1850/EPSG900913/{z}/{x}/{y}.png' ),
  "_2015": L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
  "Hoogte": L.tileLayer('http://s.map5.nl/map/gast/tiles/relief_struct/EPSG900913/{z}/{x}/{y}.jpeg')
}
var overlays = {
 
}
//-------------------
//Make the map
//-------------------
var map = new L.map('map', {
  maxZoom: 15,
  minZoom: 12,
  layers: basemaps._1830
});

map.setView([53.079529, 6.614894], 14);
map.setMaxBounds([
  [52.861743, 6.458972],
  [53.202277, 6.958035]
]);

//-------------------
//Make the MINI map
//-------------------

L.control.layers.minimap(basemaps, overlays, {
  maxZoom:15,
  minZoom: 10
} ).addTo(map);

// colapse = false na laden van de pagina
// 


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
    return (d.heights*-7)+ heightdif})
  .interpolate("basis-open");

var areaFunction = d3.svg.area()
  .x( lineFunction.x())
  .y0( lineFunction.y())
  .y1(400)
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

var optionsz = {
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

var drawControl = new L.Control.Draw(optionsz);
map.addControl(drawControl); 

//-------------------
// Nederlandse zinnen ipv engels
//-------------------

//-------------------
// Initialize transect line
//-------------------
var line = d3.select("#line")
var transect = line.append("g").attr("class", "transect"); // Line and field areas
var names = line.append("g").attr("class", "names"); // Fieldnames + water
var panel = line.append("g"); // NAP + meters
var mouse = line.append("g"); // moving marker + heights
var widthLine = line.style("width").replace("px", "")-5;

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

mouse
  .append("circle")
  .attr("class", "movingCircle")
  .attr("r", 5)
  .attr("fill", "none")
  .attr("cy", heightdif)
  .attr("cx", 0);
  
mouse
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
panel.append("line")
  .attr("x1", 56)
  .attr("y1", heightdif)
  .attr("x2", widthLine -5)
  .attr("y2", heightdif)
  .attr("stroke", "#2B2118")
  .attr("stroke-width", 1)
  .style("stroke-dasharray", ("3, 3"));
  
panel.append("text")
  .text("NAP lijn")
  .attr("x", 6)
  .attr("y", heightdif+2)
  .attr("class", "NAP")
  .attr("font-family", "Florlrg")
  .attr("font-size", "13px")

panel.append("text")
  .text(" ... meters")
  .attr("x", widthLine-100)
  .attr("y", "40")
  .attr("class", "hoogte")
  .attr("font-family", "Florlrg")
  .attr("font-size", "13px")
  
//-------------------
// Initiate line drawing
//-------------------
var coordinates = "6.605443954467773%2053.08026023642996,6.649303436279297%2053.089952072848995";
updateTransect(coordinates);

var lijn = L.polyline([[53.08026023642996,6.605443954467773], [53.089952072848995,6.649303436279297]],{
    color: "#EC8F2D"
  });
lijn.addTo(map);

//-------------------
// update line
//-------------------
var length
map.on('draw:created', function(e){
  var type = e.layerType;
  var layer = e.layer; 
  if (type === 'polyline'){
    length = layer.getBounds()
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
    console.log(coordinates)

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
    //remove previous landscape if exists
    //-------------------
    transect.selectAll("path, image, text, circle").remove();
    names.selectAll("path, text, image, circle").remove();
  //-------------------
  //Information panels
  //-------------------
    
   var tooltip = d3.select("#info")
    console.log(soil)
    //-------------------
    // soil area draw
    //-------------------     
    transect.selectAll(".bodem")
      .data(soil)
      .enter()
      .append("path")
      .attr("class", "bodem")
      .attr("d" , function(d){
        if(d[0].naam !== null){
          return areaFunction(d)}
        })
      .attr("fill", "#B3BC31")
      .attr("opacity", "0.6")
      .attr("stroke", "none")
      .attr("stroke-width", "none")
      
      .on("mouseover", function(d){
        d3.select(this)
          .attr("fill", "#EC8F2D")
        
        tooltip.selectAll("p").remove();
        var t =  tooltip.style("visibility", "visible")
          .style("z-index", 10)
          .append("p");
        console.log(d[0].category1)
        var group1 = d[0].category1.substring(0,1);
        var group2
        if (d[0].category2){
          group2 = d[0].category2.substring(0,1);  
        } else {group2 = 0}
        
        var categories = {
              A : "Relief",
              B : "Bodem",
              C : "Waternamen",
              D : "Beekdal en Moeras",
              E : "Bossen",
              F : "Veldgrond en Stuifzand",
              G : "Wilde Dieren",
              W : "Windrichting",
              O : "Overig"
            };
        d3.text("/text/" + d[0].category1 + ".txt", function(text){
          d3.text("/text/" + d[0].category2 +".txt", function(text2){
            if(d[0].category1 == d[0].category2 || d[0].category2 == null){
              t.html("<h2>" + d[0].naam + "<br> <i> Categorie: "+ 
              categories[group1] + " </i> </h2> " +  text);
              console.log("test gelukt")
            }
            else {
              t.html("<h2>" + d[0].naam + "<br> <i> Categorie:"+ 
              categories[group1] + "</i></h2> " + text +
              " <br> <h2> <i> Categorie:"+ categories[group2]+ "</i> </h2>" + text2 );
            }
          });
        }); 
      })
      .on("mouseout", function(){
        d3.select(this)
          .attr("fill", "#B3BC31")
      });
      
      tooltip
        .on("click", function(){
          d3.select(this)
            .style("visibility", "hidden")
      });   
      
      
  
    //-------------------
    // Water area
    //-------------------
    transect.selectAll(".water")
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
      .attr("stroke-width", "10px");
    //-------------------
    // water name text
    //-------------------
    names.selectAll("text")
      .data(waterGroups)
      .enter()
      .append("text")
      .attr("class", "waterName")
      .attr("x", function(x){
        return (x[0].percentage * width)
      })
      .attr("y", function(x){
        return ((x[0].heights*-7)+ heightdif-130)
      })
      .text( function (x) {
        if (x[0].waternaam !== null) {return x[0].waternaam}
      })
      .attr("font-family", "kingthings")
      .attr("margin", "5px 5px 5px 5px")
      .attr("font-size", "12px")
      .attr("font-style", "italic")
      .attr("fill", "steelblue")
      .attr("text-anchor", "bottom")
      .attr("transform", function(x){
        return "rotate(90 " + x[0].percentage * width +"," + ((x[0].heights*-7)+ heightdif-130) + ")"
      });
    //-------------------
    // Water Circles
    //-------------------
      names.selectAll('.waterCircle')
        .data(waterGroups)
        .enter()
        .append("circle")
        .attr("class", "waterCircle")
        .attr("cx", function(d){
          if(d[0].waternaam !== null){
            return (d[0].percentage*width)+3}
          })
        .attr("cy", function(d){
                    if(d[0].waternaam !== null){
                      return ((d[0].heights*-7)+heightdif-20)}
           })  
        .attr("r", 4)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", "2px")
           .style("stroke-dasharray", ("2, 1"));
    //-------------------
    //draw transect line
    //-------------------
    var linestring = [json[0]];
    transect.selectAll(".transect")
      .data(linestring)
      .enter()
      .append("path")
      .attr("class", "transect")
      .attr("d", lineFunction(json))
      .attr("stroke", "#2B2118")
      .attr("stroke-width", 3)
      .attr("fill", "none");

    //-------------------
    // Field name text
    //-------------------
    transect.selectAll("text")
      .data(field)
      .enter()
      .append("text")
      .attr("class", "soilName")
      .attr("x", function(x){
        return (x.percentage * width)+10
      })
      .attr("y", function(x){
        return ((x.heights*-7)+ heightdif)+30
      })
      .text( function (x) {
        return x.naam
      })
      .attr("font-family", "kingthings")
      .attr("padding", "10px")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "#2B2118")
      .attr("text-anchor", "top")
      .attr("transform", function(x){
        return "rotate(70 " + (x.percentage * width+10) +"," + ((x.heights*-7)+ heightdif+30) + ")"
      });
    //-------------------
    // Field name Circles
    //-------------------
      names.selectAll('.textCircle')
        .data(field)
        .enter()
        .append("circle")
        .attr("class", "textCircle")
        .attr("cx", function(d){
          if(d.naam !== null){
            return (d.percentage*width)+15}
          })
        .attr("cy", function(d){
                    if(d.naam !== null){
                      return ((d.heights*-7)+heightdif)+20}
           })  
        .attr("r", 4)
        .attr("fill", "none")
        .attr("stroke", "#2B2118")
        .attr("stroke-width", "2px")
           .style("stroke-dasharray", ("2, 1"));
      //-------------------
      // Interactivity Line
      //-------------------
      function mousemove(){
        var x0 = d3.mouse(this)[0];
        bisect = d3.bisector(function(d) { return d.percentage*width; }).left;
        var i = bisect(json, x0, 1);
        var y = json[i].heights;
    
        // Circle moving over the line //
        mouse.selectAll('.movingCircle')
          .attr("cx", function(x){
             return x0
              })
          .attr("cy", function(x){
              return y*-7+heightdif
              })
          .attr("fill", "#EC8F2D");
        // height text //
          
        d3.select('.meters')
          .attr("x", function(x){
             return x0
          })
          .attr("y", function(x){
              return y*-7+heightdif -30
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
    //-------------------
    // apend category symbol to fields
    //-------------------
   transect.selectAll("image")
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
        return (x[0].heights*-7)+heightdif-50
      })
      .attr("xlink:href",  function(x){ 
        var picture = x[0].category1
        switch(x[0].category1){
          case "B3": return "/pict/" + picture + ".svg"
          case "D1": return "/pict/" + picture + ".svg"
          case "D2": return "/pict/" + picture + ".svg"
          case "E1": return "/pict/" + picture + ".svg"
          case "E6": return "/pict/" + picture + ".svg"
          case "E7": return "/pict/" + picture + ".svg"
          case "E13": return "/pict/" + picture + ".svg"
          case "E14": return "/pict/" + picture + ".svg"
          case "G1": return "/pict/" + picture + ".svg"
          case "G6": return "/pict/" + picture + ".svg"
        };
   
      });
  });
};

///Extra info panels..   
d3.select("#legend")
.on("mouseover", function(){
  d3.select(this)
  .transition()
    .style("height", "500px")
    .style("width", "500px")
    .style("background-color", "grey")
   
})
.on("mouseout", function(){
  d3.select(this)
  .transition()
    .style("height", "50px")
    .style("width", "50px")
    .style("background-color", "#EC8F2D")
})

d3.select("#explanation")
.on("mouseover", function(){
  d3.select(this)
    .transition()
    .style("height", "500px")
    .style("width", "500px")
    .style("background-color", "grey")
    
})
.on("mouseout", function(){
  d3.select(this)
  .transition()
    .style("height", "50px")
    .style("width", "50px")
    .style("background-color", "#EC8F2D")
})
