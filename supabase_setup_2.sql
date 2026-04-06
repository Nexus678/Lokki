-- Trigger to insert a row in 'usuarios' when a new user registers in 'auth.users'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, correo)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuario Nuevo'), 
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Realtime for the 'tiendas' table safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tiendas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE tiendas';
  END IF;
END $$;

-- Ensure the bucket exists (in case it wasn't created completely)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user_images', 'user_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for user_images bucket
-- Create policies to allow users to manage their own folder
-- Assuming the folder name matches their user ID (uid)
CREATE POLICY "Allow users to manage their own folder" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user_images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
