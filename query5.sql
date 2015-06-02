WITH line AS
      (SELECT ST_Transform(ST_GeomFromText( $1 , 4326), 28992) AS geom),
      SELECT naam, code_1 , ST_AsText(ST_Transform(ST_Intersection(line.geom, veldnamen.geom),4326)) AS num
      	FROM line, veldnamen 
      	WHERE ST_Intersects(veldnamen.geom, line.geom);