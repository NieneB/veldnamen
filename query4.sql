WITH line AS
    -- From an arbitrary line
    (SELECT ST_Transform(ST_GeomFromText( $1 , 4326), 28992) AS geom),
linemesure AS
-- Add a mesure dimension to extract steps
(SELECT ST_AddMeasure(line.geom, 0, ST_Length(line.geom)) as linem,
generate_series(0, ST_Length(line.geom)::int, 10) as i
    FROM line),
points2d AS
(SELECT ST_GeometryN(ST_LocateAlong(linem, i), 1) AS geom FROM linemesure),
cells AS
-- Get DEM elevation for each
(SELECT p.geom AS geom, ST_Value(ahn2.rast, 1, p.geom) AS val
FROM ahn2, points2d p
WHERE ST_Intersects(ahn2.rast, p.geom)),
-- Instantiate 3D points
points3d AS
(SELECT ST_MakePoint(ST_X(ST_Transform(ST_SetSRID(geom, 28992),4326)), ST_Y(ST_Transform(ST_SetSRID(geom, 28992),4326)), val) AS geom FROM cells)
-- Build 3D line from 3D points
SELECT ST_AsGeoJSON(ST_MakeLine(geom)) AS geojson FROM points3d ;


