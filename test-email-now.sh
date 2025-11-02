#!/bin/bash
# Test Email Function - Quick Test Script

PROJECT_URL="https://kcujctyosmjlofppntfb.supabase.co"
FUNCTION_URL="${PROJECT_URL}/functions/v1/send-event-email"

echo "🧪 Testing send-event-email function..."
echo ""

# You need to set your anon key here
# Get it from: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/settings/api
if [ -z "$ANON_KEY" ]; then
  echo "⚠️  Please set ANON_KEY environment variable"
  echo "   Get it from: https://supabase.com/dashboard/project/kcujctyosmjlofppntfb/settings/api"
  echo ""
  echo "   Usage:"
  echo "   export ANON_KEY='your_anon_key_here'"
  echo "   ./test-email-now.sh"
  echo ""
  echo "   Or run:"
  echo "   ANON_KEY='your_key' ./test-email-now.sh your-email@example.com"
  exit 1
fi

# Get email from argument or use default
TEST_EMAIL=${1:-"test@example.com"}

echo "📧 Sending test email to: $TEST_EMAIL"
echo "🔗 Function URL: $FUNCTION_URL"
echo ""

# Send test request
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"event_type\": \"user_registered\",
    \"recipient_email\": \"$TEST_EMAIL\",
    \"recipient_name\": \"Test User\",
    \"data\": {
      \"user_id\": \"test-$(date +%s)\",
      \"first_name\": \"Test\",
      \"email\": \"$TEST_EMAIL\"
    }
  }")

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Response Status: $HTTP_STATUS"
echo "📄 Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Email sent successfully"
  echo "📬 Check your inbox at: $TEST_EMAIL"
  echo "   (Also check spam/junk folder)"
else
  echo "❌ FAILED! Status code: $HTTP_STATUS"
  echo "Check the response above for error details"
fi

