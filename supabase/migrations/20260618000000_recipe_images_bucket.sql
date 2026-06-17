-- ========== Storage bucket for recipe images ==========
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

-- RLS: allow public read access (anyone can view recipe images)
CREATE POLICY "Recipe images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- RLS: allow authenticated users to insert recipe images
CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
  );

-- RLS: allow authenticated users to update their own recipe images
CREATE POLICY "Users can update recipe images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
  );

-- RLS: allow authenticated users to delete recipe images
CREATE POLICY "Users can delete recipe images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
  );