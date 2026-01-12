-- Trainers table for clubs
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update lessons table to reference trainers instead of storing trainer_name
ALTER TABLE lessons 
ADD COLUMN trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL;

-- Keep trainer_name for backward compatibility, but make it nullable
ALTER TABLE lessons 
ALTER COLUMN trainer_name DROP NOT NULL;

-- Remove duration constraint to allow flexible time intervals
ALTER TABLE lessons 
DROP CONSTRAINT IF EXISTS valid_lesson_duration;

-- Indexes for better query performance
CREATE INDEX idx_trainers_field_id ON trainers(field_id);
CREATE INDEX idx_lessons_trainer_id ON lessons(trainer_id);

-- Add trigger to update updated_at for trainers
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for trainers
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

-- Everyone can view trainers
CREATE POLICY "Trainers are viewable by everyone" ON trainers
  FOR SELECT USING (true);

-- Only admins can manage trainers
CREATE POLICY "Only admins can insert trainers" ON trainers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update trainers" ON trainers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete trainers" ON trainers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
