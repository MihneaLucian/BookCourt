-- Add city column to fields table
ALTER TABLE fields 
ADD COLUMN city VARCHAR(100);

-- Extract city from existing locations and update
UPDATE fields 
SET city = CASE
  WHEN locatie LIKE '%Arad%' THEN 'Arad'
  WHEN locatie LIKE '%Dumbrăvița%' THEN 'Dumbrăvița'
  WHEN locatie LIKE '%București%' OR locatie LIKE '%Bucharest%' THEN 'București'
  WHEN locatie LIKE '%Cluj%' THEN 'Cluj-Napoca'
  WHEN locatie LIKE '%Timișoara%' THEN 'Timișoara'
  WHEN locatie LIKE '%Iași%' THEN 'Iași'
  WHEN locatie LIKE '%Constanța%' THEN 'Constanța'
  WHEN locatie LIKE '%Craiova%' THEN 'Craiova'
  WHEN locatie LIKE '%Brașov%' THEN 'Brașov'
  WHEN locatie LIKE '%Galați%' THEN 'Galați'
  ELSE 'Altele'
END;

-- Make city NOT NULL after updating existing records
ALTER TABLE fields 
ALTER COLUMN city SET NOT NULL;

-- Add index for city searches
CREATE INDEX idx_fields_city ON fields(city);
