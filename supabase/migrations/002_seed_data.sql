-- Seed initial data

-- Insert sample fields
INSERT INTO fields (nume, sport, suprafata, pret, locatie, imagine, rating, review_count) VALUES
  ('Baza Sportivă UTA', 'Fotbal', 'Sintetic', 120.00, 'Calea Aurel Vlaicu, Arad', '⚽', 4.9, 120),
  ('Tenis Club Activ', 'Tenis', 'Zgură', 60.00, 'Str. Independenței, Arad', '🎾', 4.7, 85),
  ('Padel Arena West', 'Padel', 'Hard', 80.00, 'Dumbrăvița', '🏓', 4.8, 95);

-- Insert amenities
INSERT INTO amenities (name, icon) VALUES
  ('Wi-Fi Gratuit', 'Wifi'),
  ('Parcare Privată', 'Car'),
  ('Nocturnă Pro', 'Trophy'),
  ('Vestiare Încălzite', 'Check');

-- Link amenities to fields (all fields have all amenities for now)
INSERT INTO field_amenities (field_id, amenity_id)
SELECT f.id, a.id
FROM fields f
CROSS JOIN amenities a;
