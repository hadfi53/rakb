#!/bin/bash
# Test Email Function
# Replace YOUR_ANON_KEY and your-email@example.com before running

curl -X POST https://kcujctyosmjlofppntfb.supabase.co/functions/v1/send-event-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "user_registered",
    "recipient_email": "your-email@example.com",
    "recipient_name": "Test User",
    "data": {
      "user_id": "test-123",
      "first_name": "Test",
      "email": "your-email@example.com"
    }
  }'

