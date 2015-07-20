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
  (SELECT p.geom AS geom, ST_Value(ahn.rast, 1, p.geom) AS heights, percentage
  FROM ahn, points2d p
  WHERE ST_Intersects(ahn.rast, p.geom)),

fields AS
    (SELECT naam AS naam, code_1 AS category1, code_2 AS category2, ST_Intersection(p.geom, veldnamen_final.geom) AS geoms
        	FROM veldnamen_final, points2d p 
        	WHERE ST_Intersects(veldnamen_final.geom, p.geom)),

--Get Water inersects
waters As
(SELECT naamnl AS waternaam, typewater AS typewater, identifica AS waterId, ST_Intersection(p.geom, water.geom) AS geomz
FROM water, points2d p
WHERE ST_Intersects(water.geom, p.geom)),

points AS
(SELECT *  FROM AHN LEFT OUTER JOIN fields ON (AHN.geom = fields.geoms)),

points1 AS
(SELECT * FROM points LEFT OUTER JOIN waters ON (points.geom = waters.geomz))

-- Make points:
SELECT ST_AsGeoJSON(ST_MakePoint(ST_X(ST_Transform(ST_SetSRID(geom, 28992),4326)), ST_Y(ST_Transform(ST_SetSRID(geom, 28992),4326)), heights)) 
AS geometry, naam, heights, percentage , category1, category2, waternaam, typewater, waterID
FROM points1

