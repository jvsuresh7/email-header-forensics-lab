-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('teacher', 'student');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT,
  file_name TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS on notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Teachers can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view non-expired notes"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'student'
    )
    AND expires_at > NOW()
  );

-- Create storage bucket for note files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notes', 'notes', false);

-- Storage policies for notes bucket
CREATE POLICY "Teachers can upload note files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Students can view all note files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'notes' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'student'
    )
  );

-- Function to set expires_at on insert
CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '365 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expires_at
CREATE TRIGGER set_note_expires_at
  BEFORE INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION set_expires_at();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for better performance
CREATE INDEX notes_teacher_id_idx ON notes(teacher_id);
CREATE INDEX notes_note_date_idx ON notes(note_date DESC);
CREATE INDEX notes_expires_at_idx ON notes(expires_at);
CREATE INDEX notes_tags_idx ON notes USING gin(tags);