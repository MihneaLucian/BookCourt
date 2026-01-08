-- Add admin role to profiles
ALTER TABLE profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create field_owners table to link fields to admin users
CREATE TABLE field_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(field_id, user_id)
);

-- Indexes
CREATE INDEX idx_field_owners_field_id ON field_owners(field_id);
CREATE INDEX idx_field_owners_user_id ON field_owners(user_id);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- RLS Policies for field_owners
ALTER TABLE field_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Field owners are viewable by admins" ON field_owners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage field ownership" ON field_owners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Function to check if user owns a field
CREATE OR REPLACE FUNCTION user_owns_field(field_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM field_owners
    WHERE field_id = field_uuid
    AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update bookings RLS to allow field owners to see their bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id 
    OR user_owns_field(field_id)
  );

-- Allow field owners to update bookings for their fields
CREATE POLICY "Field owners can update their field bookings" ON bookings
  FOR UPDATE USING (user_owns_field(field_id));
