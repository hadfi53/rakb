// Mock admin data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';
import { mockVehicles } from './mock-data';
import { mockProfileApi } from './mock-profile-data';
import { VehiclePublicationStatus } from '@/types/vehicle';

export interface PendingVehicle {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  images: string[];
  submitted_at: string;
  status: VehiclePublicationStatus;
  owner_name?: string;
  owner_email?: string;
}

export interface DocumentReview {
  id: string;
  user_id: string;
  document_type: 'driver_license' | 'identity_card' | 'bank_details' | 'vehicle_registration' | 'insurance';
  document_name: string;
  document_url: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  user_name?: string;
  user_email?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'renter' | 'owner' | 'admin';
  verified_tenant: boolean;
  verified_host: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  last_login?: string;
  status: 'active' | 'suspended' | 'banned';
  suspension_reason?: string;
}

const getMockPendingVehicles = (): PendingVehicle[] => {
  const stored = localStorage.getItem('mock-pending-vehicles');
  if (stored) {
    return JSON.parse(stored);
  }
  // Create some sample pending vehicles
  const sampleVehicles: PendingVehicle[] = mockVehicles
    .filter(v => v.publication_status === 'pending_review')
    .slice(0, 5)
    .map(v => ({
      id: v.id,
      owner_id: v.owner_id || 'owner-1',
      make: v.make,
      model: v.model,
      year: v.year,
      price_per_day: v.price_per_day,
      location: v.location,
      images: v.images || [],
      submitted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: v.publication_status || 'pending_review',
      owner_name: 'Agence Sample',
      owner_email: 'agency@example.com'
    }));
  localStorage.setItem('mock-pending-vehicles', JSON.stringify(sampleVehicles));
  return sampleVehicles;
};

const getMockDocumentReviews = (): DocumentReview[] => {
  const stored = localStorage.getItem('mock-document-reviews');
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const getMockAdminUsers = (): AdminUser[] => {
  const stored = localStorage.getItem('mock-admin-users');
  if (stored) {
    return JSON.parse(stored);
  }
  // Generate sample users
  const sampleUsers: AdminUser[] = [];
  for (let i = 1; i <= 20; i++) {
    const role = i % 3 === 0 ? 'owner' : i % 3 === 1 ? 'renter' : 'admin';
    sampleUsers.push({
      id: `user-${i}`,
      email: `user${i}@example.com`,
      first_name: `User${i}`,
      last_name: 'Test',
      role: role as 'renter' | 'owner' | 'admin',
      verified_tenant: role === 'renter',
      verified_host: role === 'owner',
      email_verified: Math.random() > 0.2,
      phone_verified: Math.random() > 0.3,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    });
  }
  localStorage.setItem('mock-admin-users', JSON.stringify(sampleUsers));
  return sampleUsers;
};

const saveMockPendingVehicles = (vehicles: PendingVehicle[]) => {
  localStorage.setItem('mock-pending-vehicles', JSON.stringify(vehicles));
};

const saveMockDocumentReviews = (reviews: DocumentReview[]) => {
  localStorage.setItem('mock-document-reviews', JSON.stringify(reviews));
};

const saveMockAdminUsers = (users: AdminUser[]) => {
  localStorage.setItem('mock-admin-users', JSON.stringify(users));
};

export const mockAdminApi = {
  // Vehicle Moderation
  async getPendingVehicles(): Promise<PendingVehicle[]> {
    await delay(400);
    return getMockPendingVehicles();
  },

  async approveVehicle(vehicleId: string, adminId: string): Promise<void> {
    await delay(500);
    const vehicles = getMockPendingVehicles();
    const index = vehicles.findIndex(v => v.id === vehicleId);
    if (index >= 0) {
      vehicles[index].status = 'active';
      saveMockPendingVehicles(vehicles);
    }
    
    // Also update in main vehicles list
    const allVehicles = JSON.parse(localStorage.getItem('mock-vehicles') || '[]');
    const vehicleIndex = allVehicles.findIndex((v: any) => v.id === vehicleId);
    if (vehicleIndex >= 0) {
      allVehicles[vehicleIndex].publication_status = 'active';
      localStorage.setItem('mock-vehicles', JSON.stringify(allVehicles));
    }
  },

  async rejectVehicle(vehicleId: string, adminId: string, reason: string): Promise<void> {
    await delay(500);
    const vehicles = getMockPendingVehicles();
    const index = vehicles.findIndex(v => v.id === vehicleId);
    if (index >= 0) {
      vehicles[index].status = 'draft';
      saveMockPendingVehicles(vehicles);
    }
    
    // Also update in main vehicles list
    const allVehicles = JSON.parse(localStorage.getItem('mock-vehicles') || '[]');
    const vehicleIndex = allVehicles.findIndex((v: any) => v.id === vehicleId);
    if (vehicleIndex >= 0) {
      allVehicles[vehicleIndex].publication_status = 'draft';
      localStorage.setItem('mock-vehicles', JSON.stringify(allVehicles));
    }
  },

  // Document Verification
  async getPendingDocuments(): Promise<DocumentReview[]> {
    await delay(400);
    const reviews = getMockDocumentReviews();
    if (reviews.length === 0) {
      // Create sample pending documents
      const sampleReviews: DocumentReview[] = [
        {
          id: uuidv4(),
          user_id: 'user-1',
          document_type: 'driver_license',
          document_name: 'Permis de conduire - User1',
          document_url: '/placeholder-document.pdf',
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          user_name: 'User1 Test',
          user_email: 'user1@example.com'
        },
        {
          id: uuidv4(),
          user_id: 'user-2',
          document_type: 'vehicle_registration',
          document_name: 'Carte grise - User2',
          document_url: '/placeholder-document.pdf',
          submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          user_name: 'User2 Test',
          user_email: 'user2@example.com'
        }
      ];
      localStorage.setItem('mock-document-reviews', JSON.stringify(sampleReviews));
      return sampleReviews;
    }
    return reviews.filter(r => r.status === 'pending');
  },

  async getAllDocumentReviews(): Promise<DocumentReview[]> {
    await delay(400);
    return getMockDocumentReviews();
  },

  async approveDocument(documentId: string, adminId: string): Promise<void> {
    await delay(500);
    const reviews = getMockDocumentReviews();
    const index = reviews.findIndex(r => r.id === documentId);
    if (index >= 0) {
      reviews[index].status = 'approved';
      reviews[index].reviewed_by = adminId;
      reviews[index].reviewed_at = new Date().toISOString();
      saveMockDocumentReviews(reviews);
    }
  },

  async rejectDocument(documentId: string, adminId: string, reason: string): Promise<void> {
    await delay(500);
    const reviews = getMockDocumentReviews();
    const index = reviews.findIndex(r => r.id === documentId);
    if (index >= 0) {
      reviews[index].status = 'rejected';
      reviews[index].reviewed_by = adminId;
      reviews[index].reviewed_at = new Date().toISOString();
      reviews[index].review_notes = reason;
      saveMockDocumentReviews(reviews);
    }
  },

  // User Management
  async getUsers(params?: {
    role?: 'renter' | 'owner' | 'admin';
    status?: 'active' | 'suspended' | 'banned';
    search?: string;
  }): Promise<AdminUser[]> {
    await delay(400);
    let users = getMockAdminUsers();
    
    if (params?.role) {
      users = users.filter(u => u.role === params.role);
    }
    
    if (params?.status) {
      users = users.filter(u => u.status === params.status);
    }
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(u => 
        u.email.toLowerCase().includes(searchLower) ||
        u.first_name.toLowerCase().includes(searchLower) ||
        u.last_name.toLowerCase().includes(searchLower)
      );
    }
    
    return users;
  },

  async getUserById(userId: string): Promise<AdminUser | null> {
    await delay(200);
    const users = getMockAdminUsers();
    return users.find(u => u.id === userId) || null;
  },

  async suspendUser(userId: string, adminId: string, reason: string): Promise<void> {
    await delay(500);
    const users = getMockAdminUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].status = 'suspended';
      users[index].suspension_reason = reason;
      saveMockAdminUsers(users);
    }
  },

  async unsuspendUser(userId: string, adminId: string): Promise<void> {
    await delay(500);
    const users = getMockAdminUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].status = 'active';
      users[index].suspension_reason = undefined;
      saveMockAdminUsers(users);
    }
  },

  async banUser(userId: string, adminId: string, reason: string): Promise<void> {
    await delay(500);
    const users = getMockAdminUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].status = 'banned';
      users[index].suspension_reason = reason;
      saveMockAdminUsers(users);
    }
  },

  async updateUserRole(userId: string, newRole: 'renter' | 'owner' | 'admin', adminId: string): Promise<void> {
    await delay(500);
    const users = getMockAdminUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index].role = newRole;
      saveMockAdminUsers(users);
    }
  }
};

