SELECT round(random() * 9 + 1)::int AS num
FROM generate_series(1, $1)
