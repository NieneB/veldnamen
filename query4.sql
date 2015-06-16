
WITH line AS
  -- Create line geometry
  (SELECT ST_Transform(ST_GeomFromText($1 , 4326), 28992) AS geom),
    
linemesure AS
  (SELECT ST_AddMeasure(line.geom, 0, ST_Length(line.geom)) as linem,
  generate_series(0, ST_Length(line.geom)::int, 10) as i 
  FROM line),

points2d AS
  (SELECT ST_GeometryN(ST_LocateAlong(linem, i), 1) AS geom, (i*100/ST_Length(linem)) as percentage
  FROM linemesure),

AHN AS
-- Get DEM elevation for each
  (SELECT p.geom AS geom, ST_Value(ahn2.rast, 1, p.geom) AS heights, percentage
  FROM ahn2, points2d p
  WHERE ST_Intersects(ahn2.rast, p.geom)),

-- Get names of intersecting fields
fields AS
  (SELECT naam AS naam, ST_Intersection(p.geom, veldnamen.geom) AS geoms
      	FROM veldnamen, points2d p 
      	WHERE ST_Intersects(veldnamen.geom, p.geom)),

points AS
(SELECT *  FROM AHN LEFT OUTER JOIN fields ON (AHN.geom = fields.geoms))

-- Make points:
SELECT ST_AsGeoJSON(ST_MakePoint(ST_X(ST_Transform(ST_SetSRID(geom, 28992),4326)), ST_Y(ST_Transform(ST_SetSRID(geom, 28992),4326)), heights)) AS geom, naam, heights, percentage
FROM points

