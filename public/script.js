var tileUrl = 'http://s.map5.nl/map/gast/tiles/tmk_1850/EPSG900913/{z}/{x}/{y}.png';
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
      console.log(json)
      
      // range of heights for transect line
      
      var heights = json.map(function(object){
        if (object.heights !== null){
          return object.heights }
          else{return 0}
      });
      var range = json.map(function(object){
        return object.percentage });

     
      var width = 100 / heights.length;
      
      //drawing line on map
      // var first = new L.LatLng(json.features[0].geometry.coordinates[0],
//                                json.features[0].geometry.coordinates[1] )
//       var la = heights.length
//       var last = new L.LatLng(json.features[la-1].geometry.coordinates[0],
//                               json.features[la-1].geometry.coordinates[1] )
//       var list = [first, last]
//       L.polyline(list,{color: 'red'}).addTo(map);
      
     
      
      // drawing transect line
      var line = d3.select("#line");
      line.selectAll("line").remove();
      line.selectAll("line")
        .data(json)
        .enter()
        .append("line")
        .attr("class", "rect")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .style("height", function(x){
            
            return x.heights*10+"px";
        })
        .style("width", width+"%")
        .style("background-color", function(x){
          if (x.naam !== null){
            return "black"
          } else {return "red"}
        });
        
      });
    }
    map.addLayer(layer);
    drawnItems.addLayer(layer);
});

// function for building range //          

//
