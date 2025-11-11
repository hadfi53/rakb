import { Page } from '@playwright/test';

/**
 * Mock Resend email service
 * Intercepts calls to Resend API and logs them
 */
export const mockResendEmail = async (page: Page): Promise<void> => {
  await page.route('**/api.resend.com/emails', async (route) => {
    const request = route.request();
    const body = await request.postDataJSON();
    
    // Log the email for verification
    console.log('Mock Resend Email:', {
      to: body.to,
      subject: body.subject,
      from: body.from,
    });
    
    // Mock successful email send
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `email_${Date.now()}`,
        from: body.from,
        to: body.to,
        created_at: new Date().toISOString(),
      }),
    });
  });
};

/**
 * Mock Supabase Edge Function email sending
 * Intercepts calls to send-event-email function
 */
export const mockSupabaseEmailFunction = async (page: Page): Promise<void> => {
  await page.route('**/functions/v1/send-event-email', async (route) => {
    const request = route.request();
    const body = await request.postDataJSON();
    
    // Log the email event for verification
    console.log('Mock Email Event:', {
      event_type: body.event_type,
      recipient_email: body.recipient_email,
    });
    
    // Mock successful email send
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
    });
  });
  
  // Also mock process-email-queue function
  await page.route('**/functions/v1/process-email-queue', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        processed: 0,
        message: 'No pending emails to process',
      }),
    });
  });
};

/**
 * Set up all email mocks
 */
export const setupEmailMocks = async (page: Page): Promise<void> => {
  await mockResendEmail(page);
  await mockSupabaseEmailFunction(page);
};

/**
 * Verify email was sent (check email_queue table)
 */
export const verifyEmailQueued = async (
  supabase: any,
  recipientEmail: string,
  eventType: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('email_queue')
    .select('*')
    .eq('recipient_email', recipientEmail)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  // Check if event type matches (might be in metadata)
  const metadata = data.metadata || {};
  return metadata.event_type === eventType || data.related_type === eventType;
};

