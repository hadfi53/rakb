-- Créer un webhook pour les nouvelles réservations
INSERT INTO supabase_functions.hooks (
  hook_table_id,
  hook_name,
  hook_function_id,
  hook_definition,
  hook_enabled
)
VALUES (
  (SELECT id FROM supabase_functions.hooks_tables WHERE table_name = 'bookings' AND schema_name = 'public'),
  'booking_notification_webhook',
  (SELECT id FROM supabase_functions.hooks_functions WHERE function_name = 'send-email'),
  '{
    "events": ["INSERT"],
    "filters": {
      "table": "bookings",
      "schema": "public"
    }
  }',
  true
)
ON CONFLICT (hook_name) DO UPDATE
SET 
  hook_definition = EXCLUDED.hook_definition,
  hook_enabled = EXCLUDED.hook_enabled; 