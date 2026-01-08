-- Fix RLS policies for courts to allow admins to update blocked status
-- Drop existing policies
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "Admins can update courts" ON courts;

-- Allow everyone to view courts
CREATE POLICY "Courts are viewable by everyone" ON courts
  FOR SELECT USING (true);

-- Allow admins to update courts (for blocking/unblocking)
CREATE POLICY "Admins can update courts" ON courts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Allow admins to insert courts
CREATE POLICY "Admins can insert courts" ON courts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
