import { supabase } from './supabase';

// Types pour les utilisateurs admin
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'renter' | 'owner' | 'admin';
  verified_tenant: boolean;
  verified_host: boolean;
  is_verified: boolean;
  is_active: boolean;
  status: 'active' | 'suspended' | 'banned';
  created_at: string;
  phone_number?: string;
  avatar_url?: string;
}

// Types pour les documents
export interface DocumentReview {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  document_type: string;
  document_url: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  rejection_reason?: string;
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
}

// Types pour les véhicules
export interface PendingVehicle {
  id: string;
  host_id: string;
  host_name: string;
  make: string;
  model: string;
  year?: number;
  price_per_day: number;
  location?: string;
  images: string[];
  is_approved: boolean;
  submitted_at: string;
}

// Types pour les statistiques
export interface AdminStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  pendingDocuments: number;
  pendingVerifications: number;
  activeBookings: number;
  completedBookings: number;
  // Analytics
  revenueByMonth: { month: string; revenue: number; bookings: number }[];
  bookingsByStatus: { status: string; count: number }[];
  revenueByStatus: { status: string; revenue: number }[];
  topVehicles: { car_id: string; make: string; model: string; bookings: number; revenue: number }[];
  topHosts: { host_id: string; name: string; bookings: number; revenue: number }[];
  userGrowth: { month: string; users: number }[];
  recentRevenue: number; // Last 30 days
  averageBookingValue: number;
  platformCommission: number;
  hostPayouts: number;
}

// Types pour les réservations admin
export interface AdminBooking {
  id: string;
  booking_id: string;
  user_id: string;
  host_id: string;
  car_id: string;
  renter_name: string;
  host_name: string;
  vehicle_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

class AdminService {
  // ==================== UTILISATEURS ====================
  
  async getUsers(params?: {
    role?: 'renter' | 'owner' | 'admin';
    status?: 'active' | 'suspended' | 'banned';
    search?: string;
  }): Promise<AdminUser[]> {
    // First, get all profiles
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        role,
        user_role,
        verified_tenant,
        verified_host,
        is_verified,
        is_active,
        phone_number,
        avatar_url,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Filtrer par rôle
    if (params?.role && params.role !== 'all') {
      query = query.eq('role', params.role);
    }

    // Filtrer par statut actif/suspendu
    if (params?.status && params.status !== 'all') {
      if (params.status === 'active') {
        query = query.eq('is_active', true);
      } else if (params.status === 'suspended') {
        query = query.eq('is_active', false);
      }
    }

    const { data: profilesData, error } = await query;

    if (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }

    // Get all user IDs (including those without profiles)
    const profileUserIds = profilesData?.map(u => u.id) || [];
    
    // Also get users from auth.users who might not have profiles yet
    // We'll use the RPC function to get emails for all users
    const allUserIds = [...profileUserIds];
    
    // Get emails for all users
    const emailMap = new Map<string, string>();
    if (allUserIds.length > 0) {
      try {
        const { data: emailData, error: emailError } = await supabase
          .rpc('get_user_emails', { user_ids: allUserIds });
        
        if (emailError) {
          // Handle permission denied errors gracefully
          if (emailError.code === '42501' || emailError.message?.includes('permission denied')) {
            console.warn('Permission denied for get_user_emails RPC. Emails will not be available.');
          } else {
            console.warn('Error fetching user emails via RPC:', emailError);
          }
        } else if (emailData && Array.isArray(emailData)) {
          emailData.forEach((item: any) => {
            if (item.id && item.email) {
              emailMap.set(item.id, item.email);
            }
          });
        }
      } catch (e: any) {
        // Handle permission denied or other errors gracefully
        if (e.code === '42501' || e.message?.includes('permission denied')) {
          console.warn('Permission denied for get_user_emails RPC. Emails will not be available.');
        } else {
          console.warn('Could not fetch user emails via RPC:', e);
        }
      }
    }

    // Combine profile data with emails
    let users: AdminUser[] = (profilesData || []).map(profile => {
      const email = emailMap.get(profile.id) || 'Email non disponible';
      const role = (profile.role || profile.user_role || 'renter') as 'renter' | 'owner' | 'admin';
      
      // Déterminer le statut
      let status: 'active' | 'suspended' | 'banned' = 'active';
      if (profile.is_active === false) {
        status = 'suspended';
      }

      return {
        id: profile.id,
        email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        role,
        verified_tenant: profile.verified_tenant || false,
        verified_host: profile.verified_host || false,
        is_verified: profile.is_verified || false,
        is_active: profile.is_active ?? true,
        status,
        created_at: profile.created_at,
        phone_number: profile.phone_number,
        avatar_url: profile.avatar_url,
      };
    });

    // Filtrer par recherche (nom, email)
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(u => 
        u.first_name.toLowerCase().includes(searchLower) ||
        u.last_name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
      );
    }

    return users;
  }

  async suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error suspending user:', error);
      throw error;
    }

    // Log l'action dans audit_logs si disponible
    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'user',
        entity_id: userId,
        action: 'suspend',
        metadata: { reason }
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  async unsuspendUser(userId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'user',
        entity_id: userId,
        action: 'unsuspend',
        metadata: {}
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  async banUser(userId: string, adminId: string, reason: string): Promise<void> {
    // Bannir = suspendre + marquer comme banni
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error banning user:', error);
      throw error;
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'user',
        entity_id: userId,
        action: 'ban',
        metadata: { reason }
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  async updateUserRole(userId: string, newRole: 'renter' | 'owner' | 'admin', adminId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        user_role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }

    // Mettre à jour les métadonnées utilisateur (via RPC ou Edge Function)
    // Note: Cela nécessite une fonction backend ou Edge Function
    try {
      await supabase.rpc('update_user_role_metadata', {
        user_id: userId,
        new_role: newRole
      }).catch(() => {
        // Si la fonction n'existe pas, on continue sans erreur
        console.warn('RPC function not available, skipping metadata update');
      });
    } catch (e) {
      console.warn('Could not update auth metadata:', e);
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'user',
        entity_id: userId,
        action: 'update_role',
        metadata: { new_role: newRole }
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  // ==================== DOCUMENTS ====================

  async getPendingDocuments(): Promise<DocumentReview[]> {
    const { data, error } = await supabase
      .from('identity_documents')
      .select(`
        id,
        user_id,
        document_type,
        document_url,
        verification_status,
        rejection_reason,
        uploaded_at,
        verified_at,
        verified_by
      `)
      .in('verification_status', ['pending', 'under_review'])
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending documents:', error);
      throw error;
    }

    // Récupérer les infos utilisateur
    const userIds = [...new Set(data?.map(d => d.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    // Récupérer les emails (via RPC si disponible)
    const usersMap = new Map<string, string>();
    try {
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });
      
      if (emailError) {
        // Handle permission denied errors gracefully
        if (emailError.code === '42501' || emailError.message?.includes('permission denied')) {
          console.warn('Permission denied for get_user_emails RPC in getPendingDocuments. Emails will not be available.');
        } else {
          console.warn('Error fetching emails in getPendingDocuments:', emailError);
        }
      } else if (emailData && Array.isArray(emailData)) {
        emailData.forEach((item: any) => {
          if (item.id && item.email) {
            usersMap.set(item.id, item.email);
          }
        });
      }
    } catch (e: any) {
      // Handle permission denied or other errors gracefully
      if (e.code === '42501' || e.message?.includes('permission denied')) {
        console.warn('Permission denied for get_user_emails RPC in getPendingDocuments. Emails will not be available.');
      } else {
        console.warn('Could not fetch emails in getPendingDocuments:', e);
      }
    }
    
    const profilesMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]) || []);

    return (data || []).map(doc => ({
      id: doc.id,
      user_id: doc.user_id,
      user_name: profilesMap.get(doc.user_id) || 'Utilisateur inconnu',
      user_email: usersMap.get(doc.user_id) || 'Email non disponible',
      document_type: doc.document_type,
      document_url: doc.document_url,
      verification_status: doc.verification_status as any,
      rejection_reason: doc.rejection_reason,
      submitted_at: doc.uploaded_at,
      verified_at: doc.verified_at,
      verified_by: doc.verified_by,
    }));
  }

  async getAllDocumentReviews(): Promise<DocumentReview[]> {
    const { data, error } = await supabase
      .from('identity_documents')
      .select(`
        id,
        user_id,
        document_type,
        document_url,
        verification_status,
        rejection_reason,
        uploaded_at,
        verified_at,
        verified_by
      `)
      .order('uploaded_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    const userIds = [...new Set(data?.map(d => d.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    // Récupérer les emails (via RPC si disponible)
    const usersMap = new Map<string, string>();
    try {
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_emails', { user_ids: userIds });
      
      if (emailError) {
        // Handle permission denied errors gracefully
        if (emailError.code === '42501' || emailError.message?.includes('permission denied')) {
          console.warn('Permission denied for get_user_emails RPC in getAllDocumentReviews. Emails will not be available.');
        } else {
          console.warn('Error fetching emails in getAllDocumentReviews:', emailError);
        }
      } else if (emailData && Array.isArray(emailData)) {
        emailData.forEach((item: any) => {
          if (item.id && item.email) {
            usersMap.set(item.id, item.email);
          }
        });
      }
    } catch (e: any) {
      // Handle permission denied or other errors gracefully
      if (e.code === '42501' || e.message?.includes('permission denied')) {
        console.warn('Permission denied for get_user_emails RPC in getAllDocumentReviews. Emails will not be available.');
      } else {
        console.warn('Could not fetch emails in getAllDocumentReviews:', e);
      }
    }
    
    const profilesMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]) || []);

    return (data || []).map(doc => ({
      id: doc.id,
      user_id: doc.user_id,
      user_name: profilesMap.get(doc.user_id) || 'Utilisateur inconnu',
      user_email: usersMap.get(doc.user_id) || 'Email non disponible',
      document_type: doc.document_type,
      document_url: doc.document_url,
      verification_status: doc.verification_status as any,
      rejection_reason: doc.rejection_reason,
      submitted_at: doc.uploaded_at,
      verified_at: doc.verified_at,
      verified_by: doc.verified_by,
    }));
  }

  async approveDocument(documentId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('identity_documents')
      .update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        verified_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error approving document:', error);
      throw error;
    }

    // Mettre à jour le statut de vérification de l'utilisateur si nécessaire
    try {
      const { data: doc } = await supabase
        .from('identity_documents')
        .select('user_id, verification_type')
        .eq('id', documentId)
        .single();

      if (doc) {
        // Vérifier si tous les documents requis sont approuvés
        const { data: allDocs } = await supabase
          .from('identity_documents')
          .select('verification_status')
          .eq('user_id', doc.user_id)
          .eq('verification_type', doc.verification_type);

        const allApproved = allDocs?.every(d => d.verification_status === 'approved');

        if (allApproved && doc.verification_type === 'tenant') {
          await supabase
            .from('profiles')
            .update({ verified_tenant: true, is_verified: true })
            .eq('id', doc.user_id);
        } else if (allApproved && doc.verification_type === 'host') {
          await supabase
            .from('profiles')
            .update({ verified_host: true, is_verified: true })
            .eq('id', doc.user_id);
        }
      }
    } catch (e) {
      console.warn('Could not update user verification status:', e);
    }
  }

  async rejectDocument(documentId: string, adminId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('identity_documents')
      .update({
        verification_status: 'rejected',
        rejection_reason: reason,
        verified_at: new Date().toISOString(),
        verified_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error rejecting document:', error);
      throw error;
    }
  }

  // ==================== VÉHICULES ====================

  async getPendingVehicles(): Promise<PendingVehicle[]> {
    const { data, error } = await supabase
      .from('cars')
      .select(`
        id,
        host_id,
        brand,
        make,
        model,
        year,
        price_per_day,
        location,
        images,
        is_approved,
        created_at
      `)
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending vehicles:', error);
      throw error;
    }

    // Récupérer les noms des hôtes
    const hostIds = [...new Set(data?.map(v => v.host_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', hostIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]) || []);

    return (data || []).map(vehicle => {
      const images = Array.isArray(vehicle.images) 
        ? vehicle.images 
        : typeof vehicle.images === 'string' 
          ? JSON.parse(vehicle.images || '[]') 
          : [];

      return {
        id: vehicle.id,
        host_id: vehicle.host_id,
        host_name: profilesMap.get(vehicle.host_id) || 'Propriétaire inconnu',
        make: vehicle.make || vehicle.brand || 'N/A',
        model: vehicle.model || 'N/A',
        year: vehicle.year,
        price_per_day: parseFloat(vehicle.price_per_day?.toString() || '0'),
        location: vehicle.location,
        images: images.length > 0 ? images : [],
        is_approved: vehicle.is_approved,
        submitted_at: vehicle.created_at,
      };
    });
  }

  async approveVehicle(vehicleId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('cars')
      .update({
        is_approved: true,
        is_verified: true
      })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error approving vehicle:', error);
      throw error;
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'vehicle',
        entity_id: vehicleId,
        action: 'approve',
        metadata: {}
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  async rejectVehicle(vehicleId: string, adminId: string, reason: string): Promise<void> {
    // Pour rejeter, on peut supprimer ou marquer comme non approuvé
    // Ici on marque comme non approuvé avec une note
    const { error } = await supabase
      .from('cars')
      .update({
        is_approved: false,
        is_verified: false
      })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error rejecting vehicle:', error);
      throw error;
    }

    try {
      await supabase.from('audit_logs').insert({
        actor_id: adminId,
        entity: 'vehicle',
        entity_id: vehicleId,
        action: 'reject',
        metadata: { reason }
      });
    } catch (e) {
      console.warn('Could not log audit:', e);
    }
  }

  // ==================== PAYMENTS ====================
  
  async getPayments(params?: {
    booking_id?: string;
    user_id?: string;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    limit?: number;
  }): Promise<any[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          id,
          booking_id,
          user_id,
          amount,
          currency,
          status,
          provider,
          provider_ref,
          provider_payment_id,
          provider_payment_data,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (params?.booking_id) {
        query = query.eq('booking_id', params.booking_id);
      }

      if (params?.user_id) {
        query = query.eq('user_id', params.user_id);
      }

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        // Handle specific error about updated_at column
        if (error.code === '42703' && error.message?.includes('updated_at')) {
          console.warn('Payments table schema issue - updated_at column may not exist. Using created_at only.');
          // Retry without updated_at if it was in the query
          return [];
        }
        console.error('Error fetching payments:', error);
        throw error;
      }

      return (data || []).map(payment => ({
        ...payment,
        amount: typeof payment.amount === 'number' ? payment.amount / 100 : payment.amount, // Convert from cents
      }));
    } catch (error: any) {
      console.error('Error in getPayments:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // ==================== STATISTIQUES ====================

  async getStats(): Promise<AdminStats> {
    try {
      // Total utilisateurs
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total véhicules
      const { count: totalVehicles } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });

      // Total réservations
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get completed payments from payments table
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('status', 'completed');

      // Calculate revenue from payments table (amount is in cents, so divide by 100)
      const revenueFromPayments = payments?.reduce((sum, p) => {
        const amount = typeof p.amount === 'number' ? p.amount / 100 : parseFloat(p.amount?.toString() || '0');
        return sum + amount;
      }, 0) || 0;

      // Revenus totaux (depuis les bookings avec status confirmé/completed)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, status, created_at')
        .in('status', ['confirmed', 'completed', 'active', 'in_progress']);

      const revenueFromBookings = bookings?.reduce((sum, b) => sum + (parseFloat(b.total_amount?.toString() || '0')), 0) || 0;

      // Use payments table revenue if available, otherwise fall back to bookings
      const totalRevenue = revenueFromPayments > 0 ? revenueFromPayments : revenueFromBookings;

      // Recent revenue (last 30 days) - from payments table
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPayments = payments?.filter(p => new Date(p.created_at) >= thirtyDaysAgo) || [];
      const recentRevenueFromPayments = recentPayments.reduce((sum, p) => {
        const amount = typeof p.amount === 'number' ? p.amount / 100 : parseFloat(p.amount?.toString() || '0');
        return sum + amount;
      }, 0);

      const recentBookings = bookings?.filter(b => new Date(b.created_at) >= thirtyDaysAgo) || [];
      const recentRevenueFromBookings = recentBookings.reduce((sum, b) => sum + (parseFloat(b.total_amount?.toString() || '0')), 0);
      
      const recentRevenue = recentRevenueFromPayments > 0 ? recentRevenueFromPayments : recentRevenueFromBookings;

      // Average booking value
      const averageBookingValue = bookings && bookings.length > 0 
        ? totalRevenue / bookings.length 
        : 0;

      // Platform commission (estimate 15% from host commission + 10% service fee)
      const platformCommission = totalRevenue * 0.25; // Rough estimate
      const hostPayouts = totalRevenue * 0.75; // Rough estimate

      // Documents en attente
      const { count: pendingDocuments } = await supabase
        .from('identity_documents')
        .select('*', { count: 'exact', head: true })
        .in('verification_status', ['pending', 'under_review']);

      // Demandes de vérification en attente
      const { count: pendingVerifications } = await supabase
        .from('verification_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review']);

      // Réservations actives
      const { count: activeBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'active', 'in_progress']);

      // Réservations terminées
      const { count: completedBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'finished']);

      // Revenue by month (last 6 months) - from payments table
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: paymentsForRevenue } = await supabase
        .from('payments')
        .select('amount, created_at, status')
        .gte('created_at', sixMonthsAgo.toISOString())
        .eq('status', 'completed');

      // Convert payments to booking-like format for groupByMonth
      const paymentsAsBookings = (paymentsForRevenue || []).map(p => ({
        total_amount: typeof p.amount === 'number' ? p.amount / 100 : parseFloat(p.amount?.toString() || '0'),
        created_at: p.created_at,
        status: p.status,
      }));

      const { data: bookingsForRevenue } = await supabase
        .from('bookings')
        .select('total_amount, created_at, status')
        .gte('created_at', sixMonthsAgo.toISOString())
        .in('status', ['confirmed', 'completed', 'active', 'in_progress']);

      // Use payments if available, otherwise bookings
      const revenueByMonth = this.groupByMonth(
        paymentsAsBookings.length > 0 ? paymentsAsBookings : (bookingsForRevenue || [])
      );

      // Bookings by status
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('status, total_amount');

      const bookingsByStatus = this.groupByStatus(allBookings || []);
      const revenueByStatus = this.groupRevenueByStatus(allBookings || []);

      // Top vehicles (by bookings and revenue)
      const topVehicles = await this.getTopVehicles();

      // Top hosts (by bookings and revenue)
      const topHosts = await this.getTopHosts();

      // User growth (last 6 months)
      const userGrowth = await this.getUserGrowth();

      return {
        totalUsers: totalUsers || 0,
        totalVehicles: totalVehicles || 0,
        totalBookings: totalBookings || 0,
        totalRevenue: totalRevenue || 0,
        pendingDocuments: pendingDocuments || 0,
        pendingVerifications: pendingVerifications || 0,
        activeBookings: activeBookings || 0,
        completedBookings: completedBookings || 0,
        revenueByMonth: revenueByMonth || [],
        bookingsByStatus: bookingsByStatus || [],
        revenueByStatus: revenueByStatus || [],
        topVehicles: topVehicles || [],
        topHosts: topHosts || [],
        userGrowth: userGrowth || [],
        recentRevenue: recentRevenue || 0,
        averageBookingValue: averageBookingValue || 0,
        platformCommission: platformCommission || 0,
        hostPayouts: hostPayouts || 0,
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  private groupByMonth(bookings: any[]): { month: string; revenue: number; bookings: number }[] {
    const months = new Map<string, { revenue: number; bookings: number }>();
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      if (!months.has(monthKey)) {
        months.set(monthKey, { revenue: 0, bookings: 0 });
      }
      
      const current = months.get(monthKey)!;
      current.revenue += parseFloat(booking.total_amount?.toString() || '0');
      current.bookings += 1;
    });

    return Array.from(months.entries())
      .map(([key, value]) => ({
        month: new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: value.revenue,
        bookings: value.bookings,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private groupByStatus(bookings: any[]): { status: string; count: number }[] {
    const statusMap = new Map<string, number>();
    
    bookings.forEach(booking => {
      const status = booking.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));
  }

  private groupRevenueByStatus(bookings: any[]): { status: string; revenue: number }[] {
    const statusMap = new Map<string, number>();
    
    bookings.forEach(booking => {
      const status = booking.status || 'unknown';
      const revenue = parseFloat(booking.total_amount?.toString() || '0');
      statusMap.set(status, (statusMap.get(status) || 0) + revenue);
    });

    return Array.from(statusMap.entries()).map(([status, revenue]) => ({ status, revenue }));
  }

  private async getTopVehicles(): Promise<{ car_id: string; make: string; model: string; bookings: number; revenue: number }[]> {
    const { data: bookingStats } = await supabase
      .from('bookings')
      .select('car_id, total_amount, status')
      .in('status', ['confirmed', 'completed', 'active']);

    if (!bookingStats) return [];

    const vehicleMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookingStats.forEach(booking => {
      const carId = booking.car_id;
      if (!vehicleMap.has(carId)) {
        vehicleMap.set(carId, { bookings: 0, revenue: 0 });
      }
      const current = vehicleMap.get(carId)!;
      current.bookings += 1;
      current.revenue += parseFloat(booking.total_amount?.toString() || '0');
    });

    const topVehicleIds = Array.from(vehicleMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id]) => id);

    if (topVehicleIds.length === 0) return [];

    const { data: vehicles } = await supabase
      .from('cars')
      .select('id, make, model, brand')
      .in('id', topVehicleIds);

    return topVehicleIds.map(carId => {
      const vehicle = vehicles?.find(v => v.id === carId);
      const stats = vehicleMap.get(carId)!;
      return {
        car_id: carId,
        make: vehicle?.make || vehicle?.brand || 'N/A',
        model: vehicle?.model || 'N/A',
        bookings: stats.bookings,
        revenue: stats.revenue,
      };
    });
  }

  private async getTopHosts(): Promise<{ host_id: string; name: string; bookings: number; revenue: number }[]> {
    const { data: bookingStats } = await supabase
      .from('bookings')
      .select('host_id, total_amount, status')
      .in('status', ['confirmed', 'completed', 'active']);

    if (!bookingStats) return [];

    const hostMap = new Map<string, { bookings: number; revenue: number }>();
    
    bookingStats.forEach(booking => {
      const hostId = booking.host_id;
      if (!hostMap.has(hostId)) {
        hostMap.set(hostId, { bookings: 0, revenue: 0 });
      }
      const current = hostMap.get(hostId)!;
      current.bookings += 1;
      current.revenue += parseFloat(booking.total_amount?.toString() || '0');
    });

    const topHostIds = Array.from(hostMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id]) => id);

    if (topHostIds.length === 0) return [];

    const { data: hosts } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', topHostIds);

    return topHostIds.map(hostId => {
      const host = hosts?.find(h => h.id === hostId);
      const stats = hostMap.get(hostId)!;
      return {
        host_id: hostId,
        name: host ? `${host.first_name || ''} ${host.last_name || ''}`.trim() || 'Hôte inconnu' : 'Hôte inconnu',
        bookings: stats.bookings,
        revenue: stats.revenue,
      };
    });
  }

  private async getUserGrowth(): Promise<{ month: string; users: number }[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());

    const monthMap = new Map<string, number>();
    
    profiles?.forEach(profile => {
      const date = new Date(profile.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    // Calculate cumulative growth
    let cumulative = 0;
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        cumulative += count;
        return {
          month: new Date(key + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          users: cumulative,
        };
      });
  }

  // ==================== RÉSERVATIONS ====================

  async getBookings(params?: {
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<AdminBooking[]> {
    let query = supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        host_id,
        car_id,
        start_date,
        end_date,
        total_amount,
        status,
        payment_status,
        created_at,
        reference_number
      `)
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) {
      // Handle RLS recursion errors gracefully
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        console.error('RLS infinite recursion error in getBookings. This may indicate a policy issue.');
        return [];
      }
      // Handle permission denied errors
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.error('Permission denied for bookings table. Check RLS policies.');
        return [];
      }
      console.error('Error fetching bookings:', error);
      throw error;
    }

    // Récupérer les infos utilisateurs et véhicules
    const userIds = [...new Set([
      ...(data?.map(b => b.user_id) || []),
      ...(data?.map(b => b.host_id) || [])
    ])];
    const carIds = [...new Set(data?.map(b => b.car_id) || [])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const { data: vehicles } = await supabase
      .from('cars')
      .select('id, make, model, brand, year')
      .in('id', carIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name}`]) || []);
    const vehiclesMap = new Map(vehicles?.map(v => [v.id, `${v.make || v.brand} ${v.model} ${v.year || ''}`.trim()]) || []);

    return (data || []).map(booking => ({
      id: booking.id,
      booking_id: booking.reference_number || booking.id,
      user_id: booking.user_id,
      host_id: booking.host_id,
      car_id: booking.car_id,
      renter_name: profilesMap.get(booking.user_id) || 'Locataire inconnu',
      host_name: profilesMap.get(booking.host_id) || 'Propriétaire inconnu',
      vehicle_name: vehiclesMap.get(booking.car_id) || 'Véhicule inconnu',
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_amount: parseFloat(booking.total_amount?.toString() || '0'),
      status: booking.status,
      payment_status: booking.payment_status || 'pending',
      created_at: booking.created_at,
    }));
  }
}

export const adminService = new AdminService();

