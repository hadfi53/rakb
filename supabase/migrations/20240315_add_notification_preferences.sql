-- Add notification_preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
  'email', true,
  'push', true
);

-- Update existing rows to have default notification preferences if they don't have any
UPDATE public.profiles
SET notification_preferences = jsonb_build_object(
  'email', true,
  'push', true
)
WHERE notification_preferences IS NULL;

-- Add a check constraint to ensure the notification_preferences structure
ALTER TABLE public.profiles
ADD CONSTRAINT check_notification_preferences_structure
CHECK (
  (notification_preferences ? 'email') AND 
  (notification_preferences ? 'push') AND
  jsonb_typeof(notification_preferences->'email') = 'boolean' AND
  jsonb_typeof(notification_preferences->'push') = 'boolean'
); 