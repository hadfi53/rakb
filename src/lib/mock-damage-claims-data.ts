// Mock damage and claims data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';

export interface DamageReport {
  id: string;
  booking_id: string;
  reported_by: 'owner' | 'renter';
  report_date: string;
  damage_type: 'scratch' | 'dent' | 'crack' | 'stain' | 'mechanical' | 'other';
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  description: string;
  location: string; // Part of vehicle
  photos: string[];
  estimated_cost: number;
  status: 'reported' | 'under_review' | 'approved' | 'rejected' | 'resolved';
  reviewed_by?: string;
  reviewed_date?: string;
  review_notes?: string;
  actual_cost?: number;
  insurance_claim_id?: string;
}

export interface Claim {
  id: string;
  damage_report_id: string;
  booking_id: string;
  owner_id: string;
  renter_id: string;
  claim_type: 'damage' | 'theft' | 'loss';
  claim_amount: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid';
  submitted_date?: string;
  reviewed_date?: string;
  paid_date?: string;
  insurance_company?: string;
  claim_number?: string;
  notes: string;
  documents: string[];
}

const getMockDamageReports = (userId: string): DamageReport[] => {
  const stored = localStorage.getItem(`mock-damage-reports-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const getMockClaims = (userId: string): Claim[] => {
  const stored = localStorage.getItem(`mock-claims-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const saveMockDamageReport = (userId: string, report: DamageReport) => {
  const reports = getMockDamageReports(userId);
  reports.push(report);
  localStorage.setItem(`mock-damage-reports-${userId}`, JSON.stringify(reports));
};

const saveMockClaim = (userId: string, claim: Claim) => {
  const claims = getMockClaims(userId);
  claims.push(claim);
  localStorage.setItem(`mock-claims-${userId}`, JSON.stringify(claims));
};

const updateMockDamageReport = (userId: string, reportId: string, updates: Partial<DamageReport>) => {
  const reports = getMockDamageReports(userId);
  const index = reports.findIndex(r => r.id === reportId);
  if (index >= 0) {
    reports[index] = { ...reports[index], ...updates };
    localStorage.setItem(`mock-damage-reports-${userId}`, JSON.stringify(reports));
  }
};

const updateMockClaim = (userId: string, claimId: string, updates: Partial<Claim>) => {
  const claims = getMockClaims(userId);
  const index = claims.findIndex(c => c.id === claimId);
  if (index >= 0) {
    claims[index] = { ...claims[index], ...updates };
    localStorage.setItem(`mock-claims-${userId}`, JSON.stringify(claims));
  }
};

export const mockDamageClaimsApi = {
  // Damage Reports
  async createDamageReport(
    bookingId: string,
    userId: string,
    reportData: Omit<DamageReport, 'id' | 'booking_id' | 'report_date' | 'status'>
  ): Promise<DamageReport> {
    await delay(500);
    const report: DamageReport = {
      ...reportData,
      id: uuidv4(),
      booking_id: bookingId,
      report_date: new Date().toISOString(),
      status: 'reported'
    };
    saveMockDamageReport(userId, report);
    return report;
  },

  async getDamageReports(userId: string): Promise<DamageReport[]> {
    await delay(300);
    return getMockDamageReports(userId);
  },

  async getDamageReportByBookingId(bookingId: string, userId: string): Promise<DamageReport | null> {
    await delay(200);
    const reports = getMockDamageReports(userId);
    return reports.find(r => r.booking_id === bookingId) || null;
  },

  async updateDamageReport(
    userId: string,
    reportId: string,
    updates: Partial<DamageReport>
  ): Promise<void> {
    await delay(400);
    updateMockDamageReport(userId, reportId, updates);
  },

  async reviewDamageReport(
    userId: string,
    reportId: string,
    decision: 'approved' | 'rejected',
    notes: string,
    actualCost?: number
  ): Promise<void> {
    await delay(500);
    updateMockDamageReport(userId, reportId, {
      status: decision,
      reviewed_by: userId,
      reviewed_date: new Date().toISOString(),
      review_notes: notes,
      actual_cost: actualCost
    });
  },

  // Claims
  async createClaim(
    userId: string,
    claimData: Omit<Claim, 'id' | 'status'>
  ): Promise<Claim> {
    await delay(500);
    const claim: Claim = {
      ...claimData,
      id: uuidv4(),
      status: 'draft'
    };
    saveMockClaim(userId, claim);
    return claim;
  },

  async submitClaim(userId: string, claimId: string): Promise<void> {
    await delay(500);
    updateMockClaim(userId, claimId, {
      status: 'submitted',
      submitted_date: new Date().toISOString()
    });
  },

  async getClaims(userId: string): Promise<Claim[]> {
    await delay(300);
    return getMockClaims(userId);
  },

  async getClaimById(claimId: string, userId: string): Promise<Claim | null> {
    await delay(200);
    const claims = getMockClaims(userId);
    return claims.find(c => c.id === claimId) || null;
  },

  async updateClaimStatus(
    userId: string,
    claimId: string,
    status: Claim['status'],
    notes?: string
  ): Promise<void> {
    await delay(400);
    const updates: Partial<Claim> = { status };
    if (status === 'under_review') {
      updates.reviewed_date = new Date().toISOString();
    }
    if (status === 'paid') {
      updates.paid_date = new Date().toISOString();
    }
    if (notes) {
      updates.notes = notes;
    }
    updateMockClaim(userId, claimId, updates);
  }
};

