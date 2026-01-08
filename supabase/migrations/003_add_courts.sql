-- Courts table for fields that have multiple courts (e.g., tennis clubs)
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- e.g., "Teren 1", "Court A", etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add court_id to bookings table
ALTER TABLE bookings 
ADD COLUMN court_id UUID REFERENCES courts(id) ON DELETE SET NULL;

-- Index for better query performance
CREATE INDEX idx_courts_field_id ON courts(field_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_court_date ON bookings(court_id, booking_date);

-- Add trigger to update updated_at for courts
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies for courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courts are viewable by everyone" ON courts
  FOR SELECT USING (true);

-- Add sample courts for tennis club (field id 2 from seed data)
-- Note: You'll need to get the actual UUID from your fields table
-- This is a template - adjust the field_id after running the migration
INSERT INTO courts (field_id, name) 
SELECT id, 'Teren 1' FROM fields WHERE sport = 'Tenis' LIMIT 1;

INSERT INTO courts (field_id, name) 
SELECT id, 'Teren 2' FROM fields WHERE sport = 'Tenis' LIMIT 1;

INSERT INTO courts (field_id, name) 
SELECT id, 'Teren 3' FROM fields WHERE sport = 'Tenis' LIMIT 1;
