// 🧪 Quick Email Test - Copy this into browser console on your website
// Usage: Open your website, press F12, paste this code, press Enter

(async function testEmailOnWebsite() {
  try {
    console.log('🧪 Starting email test...');
    
    // Get Supabase client from window or import
    let supabase;
    
    if (window.supabase) {
      supabase = window.supabase;
      console.log('✅ Using window.supabase');
    } else {
      // Import Supabase client
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const supabaseUrl = 'https://kcujctyosmjlofppntfb.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdWpjdHlvc21qbG9mcHBudGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTc3MDksImV4cCI6MjA2NDk5MzcwOX0.cDEKK8jpBDuWWkN601RKn3FA4pu1p6XBG8F9p4n0pNw';
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Created new Supabase client');
    }
    
    // ⚠️ IMPORTANT: Replace with YOUR email address
    const testEmail = prompt('Enter your email address to receive test email:', 'your-email@example.com');
    
    if (!testEmail || testEmail === 'your-email@example.com') {
      alert('❌ Please enter a valid email address');
      return;
    }
    
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    // Test: User Registration Email
    const response = await supabase.functions.invoke('send-event-email', {
      body: {
        event_type: 'user_registered',
        recipient_email: testEmail,
        recipient_name: 'Test User',
        data: {
          user_id: 'test-' + Date.now(),
          first_name: 'Test',
          email: testEmail
        }
      }
    });
    
    console.log('📊 Response:', response);
    
    if (response.data?.success) {
      alert(`✅ SUCCESS! Email sent to ${testEmail}\n\nCheck your inbox (and spam folder)!\n\nEmail ID: ${response.data.email_id}`);
      console.log('✅ Email sent successfully!', response.data);
    } else {
      const errorMsg = response.error?.message || JSON.stringify(response.data);
      alert(`❌ ERROR: ${errorMsg}`);
      console.error('❌ Error:', response.error || response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Error: ' + error.message);
  }
})();

