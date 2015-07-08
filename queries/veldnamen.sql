SELECT ST_AsGeoJSON(ST_Transform(geom, 4326 )) AS geojson FROM veldnamen2;
