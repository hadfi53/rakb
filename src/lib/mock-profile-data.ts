// Mock profile data storage in localStorage
import { delay } from './mock-data';

export interface MockProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  birthdate?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  notification_preferences?: {
    email: boolean;
    push: boolean;
  };
  email_verified?: boolean;
  phone_verified?: boolean;
  verified_tenant?: boolean;
  verified_host?: boolean;
  avatar_url?: string;
}

export interface MockDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

const getMockProfile = (userId: string): MockProfile | null => {
  const stored = localStorage.getItem(`mock-profile-${userId}`);
  if (!stored) {
    // Create default profile from user data
    const userData = localStorage.getItem('mock-user');
    if (userData) {
      const user = JSON.parse(userData);
      const defaultProfile: MockProfile = {
        user_id: userId,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          postal_code: '',
          country: 'MA'
        },
        notification_preferences: {
          email: true,
          push: true
        },
        email_verified: false,
        phone_verified: false,
        verified_tenant: false,
        verified_host: false
      };
      localStorage.setItem(`mock-profile-${userId}`, JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    return null;
  }
  return JSON.parse(stored);
};

const saveMockProfile = (userId: string, profile: Partial<MockProfile>) => {
  const existing = getMockProfile(userId);
  const updated = { ...existing, ...profile } as MockProfile;
  localStorage.setItem(`mock-profile-${userId}`, JSON.stringify(updated));
  return updated;
};

const getMockDocuments = (userId: string): MockDocument[] => {
  const stored = localStorage.getItem(`mock-documents-${userId}`);
  return stored ? JSON.parse(stored) : [];
};

const saveMockDocument = (userId: string, document: MockDocument) => {
  const documents = getMockDocuments(userId);
  documents.push(document);
  localStorage.setItem(`mock-documents-${userId}`, JSON.stringify(documents));
  return document;
};

export const mockProfileApi = {
  async getProfile(userId: string): Promise<MockProfile | null> {
    await delay(300);
    return getMockProfile(userId);
  },

  async updateProfile(userId: string, data: Partial<MockProfile>): Promise<MockProfile> {
    await delay(500);
    return saveMockProfile(userId, data);
  },

  async getDocuments(userId: string): Promise<MockDocument[]> {
    await delay(200);
    return getMockDocuments(userId);
  },

  async uploadDocument(userId: string, document: Omit<MockDocument, 'id' | 'submitted_at'>): Promise<MockDocument> {
    await delay(800);
    const newDocument: MockDocument = {
      ...document,
      id: `doc-${Date.now()}`,
      submitted_at: new Date().toISOString()
    };
    return saveMockDocument(userId, newDocument);
  }
};

