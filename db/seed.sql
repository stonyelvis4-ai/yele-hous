INSERT INTO delivery_communes (id, name, delivery_price, is_active)
VALUES
  ('COM-1', 'Cocody', 5000, TRUE),
  ('COM-2', 'Plateau', 4500, TRUE),
  ('COM-3', 'Marcory', 3500, TRUE),
  ('COM-4', 'DeuxPlateaux', 4000, TRUE),
  ('COM-5', 'Zone4', 3000, TRUE),
  ('COM-6', 'Yopougon', 6000, TRUE)
ON CONFLICT (id) DO NOTHING;
