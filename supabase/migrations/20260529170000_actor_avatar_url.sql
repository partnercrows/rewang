-- Add actor_avatar_url column to activity_feed
ALTER TABLE public.activity_feed
ADD COLUMN IF NOT EXISTS actor_avatar_url TEXT;