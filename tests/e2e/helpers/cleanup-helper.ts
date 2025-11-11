import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Get Supabase service role client for cleanup operations
 */
const getServiceClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role key not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

/**
 * Clean up test data created during tests
 */
export interface CleanupData {
  userIds?: string[];
  bookingIds?: string[];
  carIds?: string[];
  paymentIds?: string[];
  documentIds?: string[];
  reviewIds?: string[];
  notificationIds?: string[];
}

/**
 * Clean up test bookings
 */
export const cleanupBookings = async (bookingIds: string[]): Promise<void> => {
  if (bookingIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  // Delete related payments first
  await supabase
    .from('payments')
    .delete()
    .in('booking_id', bookingIds);
  
  // Delete bookings
  const { error } = await supabase
    .from('bookings')
    .delete()
    .in('id', bookingIds);
  
  if (error) {
    console.warn('Failed to cleanup bookings:', error);
  }
};

/**
 * Clean up test cars
 */
export const cleanupCars = async (carIds: string[]): Promise<void> => {
  if (carIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  // Delete related favorites
  await supabase
    .from('favorites')
    .delete()
    .in('car_id', carIds);
  
  // Delete related reviews
  await supabase
    .from('reviews')
    .delete()
    .in('car_id', carIds);
  
  // Delete cars
  const { error } = await supabase
    .from('cars')
    .delete()
    .in('id', carIds);
  
  if (error) {
    console.warn('Failed to cleanup cars:', error);
  }
};

/**
 * Clean up test payments
 */
export const cleanupPayments = async (paymentIds: string[]): Promise<void> => {
  if (paymentIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('payments')
    .delete()
    .in('id', paymentIds);
  
  if (error) {
    console.warn('Failed to cleanup payments:', error);
  }
};

/**
 * Clean up test documents
 */
export const cleanupDocuments = async (documentIds: string[]): Promise<void> => {
  if (documentIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  // Delete from storage first
  for (const docId of documentIds) {
    try {
      const { data: doc } = await supabase
        .from('user_documents')
        .select('file_url')
        .eq('id', docId)
        .single();
      
      if (doc?.file_url) {
        const filePath = doc.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('user-documents')
            .remove([filePath]);
        }
      }
    } catch (err) {
      console.warn(`Failed to delete document file ${docId}:`, err);
    }
  }
  
  // Delete document records
  const { error } = await supabase
    .from('user_documents')
    .delete()
    .in('id', documentIds);
  
  if (error) {
    console.warn('Failed to cleanup documents:', error);
  }
};

/**
 * Clean up test reviews
 */
export const cleanupReviews = async (reviewIds: string[]): Promise<void> => {
  if (reviewIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('reviews')
    .delete()
    .in('id', reviewIds);
  
  if (error) {
    console.warn('Failed to cleanup reviews:', error);
  }
};

/**
 * Clean up test notifications
 */
export const cleanupNotifications = async (notificationIds: string[]): Promise<void> => {
  if (notificationIds.length === 0) return;
  
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .in('id', notificationIds);
  
  if (error) {
    console.warn('Failed to cleanup notifications:', error);
  }
};

/**
 * Comprehensive cleanup of all test data
 */
export const cleanupTestData = async (data: CleanupData): Promise<void> => {
  const supabase = getServiceClient();
  
  try {
    // Clean up in reverse dependency order
    if (data.bookingIds) {
      await cleanupBookings(data.bookingIds);
    }
    
    if (data.paymentIds) {
      await cleanupPayments(data.paymentIds);
    }
    
    if (data.reviewIds) {
      await cleanupReviews(data.reviewIds);
    }
    
    if (data.carIds) {
      await cleanupCars(data.carIds);
    }
    
    if (data.documentIds) {
      await cleanupDocuments(data.documentIds);
    }
    
    if (data.notificationIds) {
      await cleanupNotifications(data.notificationIds);
    }
    
    // Clean up users last (cascade will handle related data)
    if (data.userIds) {
      for (const userId of data.userIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (err) {
          console.warn(`Failed to delete user ${userId}:`, err);
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Don't throw - cleanup should be best effort
  }
};

/**
 * Clean up all test data for a specific user
 */
export const cleanupUserTestData = async (userId: string): Promise<void> => {
  const supabase = getServiceClient();
  
  try {
    // Get all related data
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .or(`user_id.eq.${userId},host_id.eq.${userId}`);
    
    const { data: cars } = await supabase
      .from('cars')
      .select('id')
      .eq('host_id', userId);
    
    // Clean up
    if (bookings && bookings.length > 0) {
      await cleanupBookings(bookings.map(b => b.id));
    }
    
    if (cars && cars.length > 0) {
      await cleanupCars(cars.map(c => c.id));
    }
    
    // Delete user (cascade will handle profile)
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('Error cleaning up user data:', error);
  }
};

