-- Lessons table for trainer lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
  trainer_name VARCHAR(255) NOT NULL,
  trainer_phone VARCHAR(20),
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_lessons_field_id ON lessons(field_id);
CREATE INDEX idx_lessons_court_id ON lessons(court_id);
CREATE INDEX idx_lessons_court_date ON lessons(court_id, lesson_date);
CREATE INDEX idx_lessons_date ON lessons(lesson_date);

-- Add trigger to update updated_at for lessons
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Only admins can manage lessons
CREATE POLICY "Lessons are viewable by everyone" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert lessons" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update lessons" ON lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete lessons" ON lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
