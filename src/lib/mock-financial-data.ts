// Mock financial data storage in localStorage
import { delay } from './mock-data';
import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  owner_id: string;
  renter_id: string;
  vehicle_id: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  service_fee: number;
  deposit: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'partial';
  payment_date?: string;
  payment_method?: string;
  pdf_url?: string;
}

export interface Deposit {
  id: string;
  booking_id: string;
  owner_id: string;
  renter_id: string;
  amount: number;
  status: 'pending' | 'held' | 'released' | 'retained' | 'refunded';
  hold_date: string;
  release_date?: string;
  retain_reason?: string;
  retained_amount?: number;
}

export interface Refund {
  id: string;
  booking_id: string;
  owner_id: string;
  renter_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_date: string;
  processed_date?: string;
  refund_method: 'original' | 'account_credit';
  stripe_refund_id?: string;
}

export interface RevenueStats {
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  revenue_by_month: Array<{ month: string; revenue: number }>;
  revenue_by_category: Array<{ category: string; revenue: number }>;
  forecast_next_month: number;
  forecast_next_year: number;
  payment_details: Array<{
    date: string;
    amount: number;
    booking_id: string;
    status: string;
  }>;
}

const getMockInvoices = (userId: string): Invoice[] => {
  const stored = localStorage.getItem(`mock-invoices-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  // Create sample invoices
  const sampleInvoices: Invoice[] = [
    {
      id: uuidv4(),
      booking_id: `booking-${userId}-1`,
      invoice_number: `INV-${Date.now()}-001`,
      owner_id: userId,
      renter_id: 'renter-1',
      vehicle_id: '1',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: 2400,
      tax: 432,
      service_fee: 240,
      deposit: 500,
      total_amount: 3572,
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      payment_method: 'card'
    }
  ];
  localStorage.setItem(`mock-invoices-${userId}`, JSON.stringify(sampleInvoices));
  return sampleInvoices;
};

const getMockDeposits = (userId: string): Deposit[] => {
  const stored = localStorage.getItem(`mock-deposits-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  const sampleDeposits: Deposit[] = [
    {
      id: uuidv4(),
      booking_id: `booking-${userId}-1`,
      owner_id: userId,
      renter_id: 'renter-1',
      amount: 500,
      status: 'held',
      hold_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem(`mock-deposits-${userId}`, JSON.stringify(sampleDeposits));
  return sampleDeposits;
};

const getMockRefunds = (userId: string): Refund[] => {
  const stored = localStorage.getItem(`mock-refunds-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
};

const saveMockInvoice = (userId: string, invoice: Invoice) => {
  const invoices = getMockInvoices(userId);
  invoices.push(invoice);
  localStorage.setItem(`mock-invoices-${userId}`, JSON.stringify(invoices));
};

const updateMockDeposit = (userId: string, depositId: string, updates: Partial<Deposit>) => {
  const deposits = getMockDeposits(userId);
  const index = deposits.findIndex(d => d.id === depositId);
  if (index >= 0) {
    deposits[index] = { ...deposits[index], ...updates };
    localStorage.setItem(`mock-deposits-${userId}`, JSON.stringify(deposits));
  }
};

const saveMockRefund = (userId: string, refund: Refund) => {
  const refunds = getMockRefunds(userId);
  refunds.push(refund);
  localStorage.setItem(`mock-refunds-${userId}`, JSON.stringify(refunds));
};

export const mockFinancialApi = {
  // Revenue Dashboard
  async getRevenueStats(userId: string, period: 'month' | 'year' = 'month'): Promise<RevenueStats> {
    await delay(400);
    const bookings = JSON.parse(localStorage.getItem(`mock-bookings-owner-${userId}`) || '[]');
    const invoices = getMockInvoices(userId);
    
    const totalRevenue = invoices
      .filter(inv => inv.payment_status === 'paid')
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    
    const monthlyRevenue = invoices
      .filter(inv => {
        const invDate = new Date(inv.issue_date);
        const now = new Date();
        return invDate.getMonth() === now.getMonth() && 
               invDate.getFullYear() === now.getFullYear() &&
               inv.payment_status === 'paid';
      })
      .reduce((sum, inv) => sum + inv.total_amount, 0);
    
    // Generate monthly revenue data for last 12 months
    const revenueByMonth: Array<{ month: string; revenue: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      const monthRevenue = invoices
        .filter(inv => {
          const invDate = new Date(inv.issue_date);
          return invDate.toISOString().slice(0, 7) === monthKey && inv.payment_status === 'paid';
        })
        .reduce((sum, inv) => sum + inv.total_amount, 0);
      revenueByMonth.push({
        month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue || Math.random() * 5000 + 1000 // Fallback simulation
      });
    }
    
    const yearlyRevenue = revenueByMonth.reduce((sum, m) => sum + m.revenue, 0);
    const forecastNextMonth = monthlyRevenue * 1.1; // Simple forecast
    const forecastNextYear = yearlyRevenue * 1.15;
    
    const paymentDetails = invoices
      .filter(inv => inv.payment_status === 'paid')
      .slice(-10)
      .map(inv => ({
        date: inv.payment_date || inv.issue_date,
        amount: inv.total_amount,
        booking_id: inv.booking_id,
        status: inv.payment_status
      }));
    
    return {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue,
      revenue_by_month: revenueByMonth,
      revenue_by_category: [
        { category: 'SUV', revenue: totalRevenue * 0.4 },
        { category: 'Berline', revenue: totalRevenue * 0.3 },
        { category: 'Sportive', revenue: totalRevenue * 0.2 },
        { category: 'Luxe', revenue: totalRevenue * 0.1 }
      ],
      forecast_next_month: forecastNextMonth,
      forecast_next_year: forecastNextYear,
      payment_details: paymentDetails
    };
  },

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    await delay(300);
    return getMockInvoices(userId);
  },

  async getInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
    await delay(200);
    const allKeys = Object.keys(localStorage);
    const invoiceKeys = allKeys.filter(key => key.startsWith('mock-invoices-'));
    
    for (const key of invoiceKeys) {
      const invoices: Invoice[] = JSON.parse(localStorage.getItem(key) || '[]');
      const invoice = invoices.find(inv => inv.booking_id === bookingId);
      if (invoice) return invoice;
    }
    return null;
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoice_number' | 'issue_date'>): Promise<Invoice> {
    await delay(500);
    const newInvoice: Invoice = {
      ...invoice,
      id: uuidv4(),
      invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      issue_date: new Date().toISOString()
    };
    saveMockInvoice(invoice.owner_id, newInvoice);
    return newInvoice;
  },

  async generateInvoicePDF(invoiceId: string): Promise<string> {
    await delay(1000);
    // In production, this would call a backend service to generate PDF
    // For now, return a mock URL
    return `https://api.rakeb.com/invoices/${invoiceId}/pdf`;
  },

  // Deposits
  async getDeposits(userId: string): Promise<Deposit[]> {
    await delay(300);
    return getMockDeposits(userId);
  },

  async getDepositByBookingId(bookingId: string): Promise<Deposit | null> {
    await delay(200);
    const allKeys = Object.keys(localStorage);
    const depositKeys = allKeys.filter(key => key.startsWith('mock-deposits-'));
    
    for (const key of depositKeys) {
      const deposits: Deposit[] = JSON.parse(localStorage.getItem(key) || '[]');
      const deposit = deposits.find(d => d.booking_id === bookingId);
      if (deposit) return deposit;
    }
    return null;
  },

  async releaseDeposit(userId: string, depositId: string): Promise<void> {
    await delay(500);
    updateMockDeposit(userId, depositId, {
      status: 'released',
      release_date: new Date().toISOString()
    });
  },

  async retainDeposit(userId: string, depositId: string, amount: number, reason: string): Promise<void> {
    await delay(500);
    updateMockDeposit(userId, depositId, {
      status: 'retained',
      retained_amount: amount,
      retain_reason: reason
    });
  },

  // Refunds
  async getRefunds(userId: string): Promise<Refund[]> {
    await delay(300);
    return getMockRefunds(userId);
  },

  async createRefund(refund: Omit<Refund, 'id' | 'requested_date' | 'status'>): Promise<Refund> {
    await delay(800);
    const newRefund: Refund = {
      ...refund,
      id: uuidv4(),
      requested_date: new Date().toISOString(),
      status: 'pending'
    };
    saveMockRefund(refund.owner_id, newRefund);
    
    // Simulate processing
    setTimeout(() => {
      updateRefundStatus(refund.owner_id, newRefund.id, 'processing');
      setTimeout(() => {
        updateRefundStatus(refund.owner_id, newRefund.id, 'completed');
      }, 2000);
    }, 1000);
    
    return newRefund;
  },

  async updateRefundStatus(userId: string, refundId: string, status: Refund['status']): Promise<void> {
    await delay(300);
    const refunds = getMockRefunds(userId);
    const index = refunds.findIndex(r => r.id === refundId);
    if (index >= 0) {
      refunds[index].status = status;
      if (status === 'completed') {
        refunds[index].processed_date = new Date().toISOString();
      }
      localStorage.setItem(`mock-refunds-${userId}`, JSON.stringify(refunds));
    }
  }
};

const updateRefundStatus = (userId: string, refundId: string, status: Refund['status']) => {
  const refunds = getMockRefunds(userId);
  const index = refunds.findIndex(r => r.id === refundId);
  if (index >= 0) {
    refunds[index].status = status;
    if (status === 'completed') {
      refunds[index].processed_date = new Date().toISOString();
    }
    localStorage.setItem(`mock-refunds-${userId}`, JSON.stringify(refunds));
  }
};

