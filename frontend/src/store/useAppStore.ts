import { create } from 'zustand';
import { apiClient } from '../core/networking/apiClient';
import { uploadAndRegisterDocument } from '../core/networking/cloudinaryClient';

export type SubscriberStatus = 'NPS' | 'SB' | 'PS';
export type UserRole = 'user' | 'admin';
export type DividendPolicy = 'ALL_SUBSCRIBERS' | 'NON_PRIZED_ONLY';

export type GuarantorDocumentType =
  | 'SALARY_SLIP'
  | 'FDR_CERTIFICATE'
  | 'PROPERTY_DEED'
  | 'PAN_CARD'
  | 'IDENTITY_PROOF'
  | 'OTHER';

export interface GuarantorDocument {
  id: string;
  surety_id: string;
  guarantor_id?: string | null;
  document_type: GuarantorDocumentType;
  title?: string;
  file_url: string;
  cloudinary_public_id: string;
  cloudinary_format?: string;
  file_size_bytes?: number;
  mime_type?: string;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  guarantor_name?: string;
  created_at: string;
}

export interface ChitGroup {
  id: string;
  name: string;
  chit_amount: number;
  chit_amount_paise?: number;
  duration_months: number;
  foreman_commission_pct: number;
  registrar_state_code: string;
  dividend_distribution_policy: DividendPolicy;
  status: 'OPEN' | 'ACTIVE' | 'CLOSED';
  subscriber_count: number;
  vacant_slots: number;
  current_month: number;
  installment_amount: number;
  installment_amount_paise?: number;
  security_instrument: 'Cash Deposit' | 'Bank Guarantee' | 'Govt Securities';
  fdr_number: string;
  pso_order_number: string;
  past_dividends: number[];
}

export interface Subscription {
  id: string;
  chit_group_id: string;
  chit_group_name: string;
  ticket_number: number;
  subscriber_status: SubscriberStatus;
  chit_amount: number;
  chit_amount_paise?: number;
  installment_amount: number;
  installment_amount_paise?: number;
  next_due_date: string;
  is_overdue: boolean;
  installments_paid: number;
  total_installments: number;
  total_dividend_earned: number;
}

export interface Guarantor {
  id: string;
  surety_id: string;
  full_name: string;
  phone: string;
  pan_number?: string;
  relationship?: string;
  monthly_income_paise?: number;
  cibil_score?: number;
  signature_verified: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface Surety {
  id: string;
  subscription_id: string;
  auction_id?: string;
  surety_type: 'CO_GUARANTORS' | 'FIXED_DEPOSIT' | 'PROPERTY' | 'GOVERNMENT_SECURITY';
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  collateral_details?: Record<string, any>;
  rejection_reason?: string;
  guarantors?: Guarantor[];
  documents?: GuarantorDocument[];
}

export interface BidItem {
  id: string;
  bidder_name: string;
  ticket_number: number;
  bid_pct: number;
  discount_amount: number;
  timestamp: string;
  is_self?: boolean;
}

export interface Auction {
  id: string;
  chit_group_id: string;
  chit_group_name: string;
  month_number: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED';
  scheduled_at: string;
  current_lowest_bid_pct: number;
  chit_amount: number;
  total_subscribers: number;
  present_subscribers: number;
  remaining_seconds: number;
  bids: BidItem[];
}

export interface User {
  id: string;
  phone: string;
  full_name: string;
  email?: string;
  pan_number?: string;
  role: UserRole;
  kyc_status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED';
  is_nri: boolean;
  biometric_enabled: boolean;
}

export interface DPDPConsents {
  identity_verification: boolean;
  credit_bureau_check: boolean;
  auction_participation_records: boolean;
  regulatory_reporting_pmla: boolean;
  marketing_communications: boolean;
}

export interface PaymentRecord {
  id: string;
  user_id?: string;
  subscription_id: string;
  installment_id?: string;
  amount: number;
  amount_paise?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  status: 'CREATED' | 'SUCCESS' | 'FAILED';
  chit_group_name?: string;
  month_number?: number;
  ticket_number?: number;
  created_at: string;
}

export interface Disbursal {
  id: string;
  subscription_id: string;
  auction_id: string;
  surety_id?: string;
  gross_amount_paise: number;
  discount_amount_paise: number;
  foreman_commission_paise: number;
  net_payout_paise: number;
  payment_mode: 'RTGS' | 'NEFT' | 'IMPS' | 'CHEQUE';
  bank_account_number: string;
  bank_ifsc: string;
  bank_beneficiary_name: string;
  bank_reference_utr?: string;
  status: 'PENDING' | 'PROCESSING' | 'DISBURSED' | 'FAILED';
  disbursed_at?: string;
}

export interface PrizeClaim {
  subscription: {
    subscription_id: string;
    ticket_number: number;
    subscriber_status: SubscriberStatus;
    prized_month: number;
    chit_group_id: string;
    chit_group_name: string;
    chit_amount: number;
    foreman_commission_pct: number;
    auction_id?: string;
    winning_bid_pct?: number;
    auction_month?: number;
  };
  grossAmount: number;
  grossAmountPaise: number;
  winningBidPct: number;
  discountAmount: number;
  discountAmountPaise: number;
  foremanCommissionAmount: number;
  netPayoutAmount: number;
  netPayoutPaise: number;
  surety: Surety;
  disbursal: Disbursal | null;
}

export interface AdminStats {
  activeGroups: number;
  totalAUM: number;
  pendingKyc: number;
  todaysAuctions: number;
}

export interface PendingKycUser {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  kyc_status: string;
  pan_number?: string;
  aadhaar_vault_ref?: string;
  created_at: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isOffline: boolean;
  lastSynced: string;
  activeChits: Subscription[];
  availableGroups: ChitGroup[];
  paymentHistory: PaymentRecord[];
  paymentHistoryLoading: boolean;
  currentAuction: Auction | null;
  activePrizeClaim: PrizeClaim | null;
  prizeClaimLoading: boolean;
  suretyDocuments: GuarantorDocument[];
  suretyDocumentsLoading: boolean;
  dpdpConsents: DPDPConsents;

  adminStats: AdminStats | null;
  adminStatsLoading: boolean;
  pendingKycUsers: PendingKycUser[];
  pendingKycLoading: boolean;
  pendingDocuments: (GuarantorDocument & {
    subscriber_name?: string;
    subscriber_phone?: string;
    chit_group_name?: string;
  })[];
  pendingDocumentsLoading: boolean;
  selectedGroupDetails: (ChitGroup & { subscriptions?: any[] }) | null;
  selectedGroupDetailsLoading: boolean;
  adminLedger: any[];
  adminLedgerLoading: boolean;
  subscriptionInstallments: Record<string, any[]>;

  availableGroupsLoading: boolean;
  activeChitsLoading: boolean;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateKycStatus: (status: 'PENDING' | 'VERIFIED') => void;
  updateDPDPConsent: (key: keyof DPDPConsents, value: boolean) => void;
  toggleBiometric: () => void;
  fetchAvailableGroups: () => Promise<void>;
  fetchActiveChits: () => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  fetchActivePrizeClaim: () => Promise<void>;
  fetchSuretyDocuments: (suretyId: string) => Promise<void>;
  uploadSuretyDocument: (params: {
    suretyId: string;
    guarantorId?: string | null;
    documentType: GuarantorDocumentType;
    title?: string;
    file: any;
    fileSizeBytes?: number;
    mimeType?: string;
  }) => Promise<{ success: boolean; data?: GuarantorDocument; error?: string }>;
  deleteSuretyDocument: (documentId: string, suretyId: string) => Promise<{ success: boolean; error?: string }>;
  fetchAdminDashboard: () => Promise<void>;
  createChitGroup: (groupData: {
    name: string;
    chitAmount: number;
    durationMonths: number;
    foremanCommissionPct?: number;
    dividendDistributionPolicy?: 'ALL_SUBSCRIBERS' | 'NON_PRIZED_ONLY';
    registrarStateCode?: string;
  }) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchPendingKyc: () => Promise<void>;
  reviewKyc: (userId: string, status: 'VERIFIED' | 'REJECTED') => Promise<{ success: boolean; error?: string }>;
  fetchPendingDocuments: () => Promise<void>;
  reviewDocument: (
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    rejectionReason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  scheduleAuction: (chitGroupId: string, monthNumber: number, scheduledAt: string) => Promise<{ success: boolean; error?: string }>;
  addGuarantor: (
    suretyId: string,
    guarantor: {
      fullName: string;
      phone: string;
      panNumber?: string;
      relationship?: string;
      monthlyIncomePaise?: number;
      cibilScore?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  submitSuretyPackage: (suretyId: string) => Promise<{ success: boolean; error?: string }>;
  disbursePrizePayout: (
    suretyId: string,
    bankDetails: {
      bankAccountNumber: string;
      bankIfsc: string;
      bankBeneficiaryName: string;
      paymentMode?: 'RTGS' | 'NEFT' | 'IMPS' | 'CHEQUE';
    }
  ) => Promise<{ success: boolean; error?: string }>;
  joinChitGroup: (group: ChitGroup) => Promise<{ success: boolean; error?: string }>;
  submitBid: (bidPct: number) => Promise<{ success: boolean; error?: string }>;
  applyIncomingBid: (bidData: any) => void;
  closeCurrentAuction: (winnerData?: any) => void;
  fetchAuctionState: (auctionId: string) => Promise<void>;
  makePayment: (subscriptionId: string, amount?: number) => Promise<{ success: boolean; error?: string }>;
  exportUserData: () => Promise<{ success: boolean; data?: any; error?: string }>;
  withdrawDPDPConsent: (purpose: string) => Promise<{ success: boolean; error?: string }>;
  fetchFormXIV: (auctionId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchGstInvoice: (auctionId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchUserProfile: () => Promise<{ success: boolean; data?: any; error?: string }>;
  updateUserProfile: (data: { fullName?: string; email?: string; panNumber?: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchChitGroupDetails: (groupId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchSubscriptionInstallments: (subscriptionId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  approveSuretyPackage: (suretyId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  closeAuctionAdmin: (auctionId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchAdminLedger: (filters?: { groupId?: string; subscriptionId?: string; from?: string; to?: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  setOffline: (offline: boolean) => void;
}

const INITIAL_GROUPS: ChitGroup[] = [];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

const INITIAL_AUCTION: Auction = {
  id: 'a1111111-1111-1111-1111-111111111111',
  chit_group_id: '11111111-1111-1111-1111-111111111111',
  chit_group_name: 'Gold Chit 1 Lakh',
  month_number: 2,
  status: 'IN_PROGRESS',
  scheduled_at: new Date().toISOString(),
  current_lowest_bid_pct: 22.5,
  chit_amount: 100000,
  total_subscribers: 20,
  present_subscribers: 18,
  remaining_seconds: 120,
  bids: [
    {
      id: 'b1',
      bidder_name: 'Ticket #04 (R. Sharma)',
      ticket_number: 4,
      bid_pct: 22.5,
      discount_amount: 22500,
      timestamp: '17:31:40',
    },
    {
      id: 'b2',
      bidder_name: 'Ticket #12 (P. Kumar)',
      ticket_number: 12,
      bid_pct: 20.0,
      discount_amount: 20000,
      timestamp: '17:31:15',
    },
    {
      id: 'b3',
      bidder_name: 'Ticket #01 (Foreman Commission)',
      ticket_number: 1,
      bid_pct: 5.0,
      discount_amount: 5000,
      timestamp: '17:30:00',
    },
  ],
};

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: '',
    phone: '',
    full_name: 'Subscriber',
    role: 'user',
    kyc_status: 'NOT_STARTED',
    is_nri: false,
    biometric_enabled: false,
  },
  token: null,
  isOffline: false,
  lastSynced: 'Not synced yet',
  activeChits: [],
  availableGroups: [],
  paymentHistory: [],
  paymentHistoryLoading: false,
  availableGroupsLoading: false,
  activeChitsLoading: false,
  currentAuction: INITIAL_AUCTION,
  activePrizeClaim: null,
  prizeClaimLoading: false,
  suretyDocuments: [],
  suretyDocumentsLoading: false,
  adminStats: null,
  adminStatsLoading: false,
  pendingKycUsers: [],
  pendingKycLoading: false,
  pendingDocuments: [],
  pendingDocumentsLoading: false,
  selectedGroupDetails: null,
  selectedGroupDetailsLoading: false,
  adminLedger: [],
  adminLedgerLoading: false,
  subscriptionInstallments: {},
  dpdpConsents: {
    identity_verification: false,
    credit_bureau_check: false,
    auction_participation_records: false,
    regulatory_reporting_pmla: false,
    marketing_communications: false,
  },

  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null, activeChits: [], paymentHistory: [], activePrizeClaim: null }),
  switchRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
  updateKycStatus: (status) =>
    set((state) => ({
      user: state.user ? { ...state.user, kyc_status: status } : null,
    })),
  updateDPDPConsent: (key, value) => {
    set((state) => ({
      dpdpConsents: { ...state.dpdpConsents, [key]: value },
    }));
    apiClient.post('/compliance/dpdp/consent', { purpose: key, consented: value }).catch(() => {});
  },
  toggleBiometric: () =>
    set((state) => ({
      user: state.user ? { ...state.user, biometric_enabled: !state.user.biometric_enabled } : null,
    })),

  fetchAvailableGroups: async () => {
    set({ availableGroupsLoading: true });
    try {
      const res = await apiClient.get('/chit-groups');
      const items = res.data?.data?.items || [];
      set({ availableGroups: items, availableGroupsLoading: false });
    } catch (err: any) {
      console.warn('Failed to fetch chit groups:', err.message);
      set({ availableGroupsLoading: false });
    }
  },

  fetchActiveChits: async () => {
    const state = get();
    if (!state.user?.id) return;
    set({ activeChitsLoading: true });
    try {
      const res = await apiClient.get('/subscriptions/mine');
      const subs = res.data?.data || [];
      set({
        activeChits: subs.map((s: any) => ({
          id: s.id,
          chit_group_id: s.chit_group_id,
          chit_group_name: s.chit_group_name || s.group_name,
          ticket_number: s.ticket_number,
          subscriber_status: s.subscriber_status,
          chit_amount: Number(s.chit_amount),
          installment_amount: Number(s.installment_amount),
          next_due_date: '15th of month',
          is_overdue: false,
          installments_paid: Number(s.installments_paid || 0),
          total_installments: Number(s.duration_months || 20),
          total_dividend_earned: Number(s.total_dividend_earned || 0),
        })),
        activeChitsLoading: false,
        lastSynced: new Date().toLocaleTimeString('en-IN'),
      });
    } catch (err: any) {
      console.warn('Failed to fetch user subscriptions:', err.message);
      set({ activeChitsLoading: false });
    }
  },

  fetchPaymentHistory: async () => {
    const state = get();
    if (!state.user?.id) return;
    set({ paymentHistoryLoading: true });
    try {
      const res = await apiClient.get('/payments/mine');
      const items = res.data?.data || [];
      set({ paymentHistory: items, paymentHistoryLoading: false });
    } catch (err: any) {
      console.warn('Failed to fetch payment history:', err.message);
      set({ paymentHistoryLoading: false });
    }
  },

  joinChitGroup: async (group: ChitGroup) => {
    try {
      await apiClient.post(`/chit-groups/${group.id}/join`);
      await Promise.all([get().fetchActiveChits(), get().fetchAvailableGroups()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to join chit group' };
    }
  },
  submitBid: async (bidPct: number) => {
    const state = get();
    if (!state.currentAuction) return { success: false, error: 'No live auction in progress' };
    const auctionId = state.currentAuction.id;
    const mySub = state.activeChits.find((c) => c.chit_group_id === state.currentAuction?.chit_group_id) || state.activeChits[0];
    const ticketNum = mySub?.ticket_number || 7;

    try {
      await apiClient.post(`/auctions/${auctionId}/bid`, { bidPct });
    } catch (err: any) {
      // If error is 400 with a specific message from backend, return it
      const msg = err.response?.data?.error || err.message || 'Bid rejected';
      if (err.response?.status === 400 || err.response?.status === 403) {
        return { success: false, error: msg };
      }
      // If network error, allow local simulation fallback
      console.warn('Bid API error, applying local optimistic state:', msg);
    }

    const discountAmount = (state.currentAuction.chit_amount * bidPct) / 100;
    const newBid: BidItem = {
      id: `b-${Date.now()}`,
      bidder_name: `Ticket #${String(ticketNum).padStart(2, '0')} (${state.user?.full_name || 'You'})`,
      ticket_number: ticketNum,
      bid_pct: bidPct,
      discount_amount: discountAmount,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      is_self: true,
    };
    set({
      currentAuction: {
        ...state.currentAuction,
        current_lowest_bid_pct: bidPct,
        bids: [newBid, ...state.currentAuction.bids],
      },
    });
    return { success: true };
  },

  applyIncomingBid: (bidData: any) => {
    const state = get();
    if (!state.currentAuction || !bidData) return;
    const pct = Number(bidData.bidPct || 0);
    const ticket = Number(bidData.ticketNumber || 0);
    const isSelf = Boolean(
      bidData.subscriptionId &&
        state.activeChits.some((c) => c.id === bidData.subscriptionId)
    );

    // Skip duplicate self bid
    if (isSelf && state.currentAuction.current_lowest_bid_pct >= pct) return;

    const discountAmount = (state.currentAuction.chit_amount * pct) / 100;
    const newBid: BidItem = {
      id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bidder_name: isSelf
        ? `Ticket #${String(ticket).padStart(2, '0')} (You)`
        : `Ticket #${String(ticket).padStart(2, '0')}`,
      ticket_number: ticket,
      bid_pct: pct,
      discount_amount: discountAmount,
      timestamp: bidData.bidAt
        ? new Date(bidData.bidAt).toLocaleTimeString('en-IN', { hour12: false })
        : new Date().toLocaleTimeString('en-IN', { hour12: false }),
      is_self: isSelf,
    };

    set({
      currentAuction: {
        ...state.currentAuction,
        current_lowest_bid_pct: Math.max(state.currentAuction.current_lowest_bid_pct, pct),
        bids: [newBid, ...state.currentAuction.bids.filter((b) => b.id !== newBid.id)],
      },
    });
  },

  closeCurrentAuction: (winnerData?: any) => {
    const state = get();
    if (!state.currentAuction) return;
    set({
      currentAuction: {
        ...state.currentAuction,
        status: 'CLOSED',
        remaining_seconds: 0,
        current_lowest_bid_pct: winnerData?.winningBidPct ?? state.currentAuction.current_lowest_bid_pct,
      },
    });
  },

  fetchAuctionState: async (auctionId: string) => {
    try {
      const res = await apiClient.get(`/auctions/${auctionId}`);
      const data = res.data?.data;
      if (data) {
        const state = get();
        const livePct = data.liveState?.highestBidPct ?? data.liveState?.lowestBidPct ?? data.winning_bid_pct;
        if (state.currentAuction) {
          set({
            currentAuction: {
              ...state.currentAuction,
              current_lowest_bid_pct: livePct ? Number(livePct) : state.currentAuction.current_lowest_bid_pct,
              status: data.status === 'COMPLETED' ? 'CLOSED' : 'IN_PROGRESS',
            },
          });
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch auction state:', err.message);
    }
  },
  fetchActivePrizeClaim: async () => {
    const state = get();
    if (!state.user?.id) return;
    set({ prizeClaimLoading: true });
    try {
      const res = await apiClient.get('/sureties/mine');
      const claim = res.data?.data || null;
      set({ activePrizeClaim: claim, prizeClaimLoading: false });
      if (claim?.surety?.id) {
        get().fetchSuretyDocuments(claim.surety.id);
      }
    } catch (err: any) {
      console.warn('Failed to fetch prize claim:', err.message);
      set({ prizeClaimLoading: false });
    }
  },

  fetchSuretyDocuments: async (suretyId: string) => {
    set({ suretyDocumentsLoading: true });
    try {
      const res = await apiClient.get(`/media/documents/surety/${suretyId}`);
      set({ suretyDocuments: res.data?.data || [], suretyDocumentsLoading: false });
    } catch (err: any) {
      console.warn('Failed to fetch surety documents:', err.message);
      set({ suretyDocumentsLoading: false });
    }
  },

  uploadSuretyDocument: async (params) => {
    try {
      const doc = await uploadAndRegisterDocument({
        file: params.file,
        suretyId: params.suretyId,
        guarantorId: params.guarantorId,
        documentType: params.documentType,
        title: params.title,
        fileSizeBytes: params.fileSizeBytes,
        mimeType: params.mimeType,
      });
      await get().fetchSuretyDocuments(params.suretyId);
      return { success: true, data: doc };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  deleteSuretyDocument: async (documentId: string, suretyId: string) => {
    try {
      await apiClient.delete(`/media/documents/${documentId}`);
      await get().fetchSuretyDocuments(suretyId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  addGuarantor: async (suretyId, guarantor) => {
    try {
      await apiClient.post(`/sureties/${suretyId}/guarantors`, guarantor);
      await get().fetchActivePrizeClaim();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  submitSuretyPackage: async (suretyId) => {
    try {
      await apiClient.post(`/sureties/${suretyId}/submit`);
      await get().fetchActivePrizeClaim();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  disbursePrizePayout: async (suretyId, bankDetails) => {
    try {
      await apiClient.post(`/sureties/${suretyId}/disburse`, bankDetails);
      await Promise.all([get().fetchActivePrizeClaim(), get().fetchActiveChits()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchAdminDashboard: async () => {
    set({ adminStatsLoading: true });
    try {
      const res = await apiClient.get('/admin/dashboard');
      if (res.data?.success) {
        set({ adminStats: res.data.data, adminStatsLoading: false });
      } else {
        set({ adminStatsLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch admin dashboard:', err.message);
      set({ adminStatsLoading: false });
    }
  },

  createChitGroup: async (groupData) => {
    try {
      const res = await apiClient.post('/chit-groups', groupData);
      await Promise.all([get().fetchAvailableGroups(), get().fetchAdminDashboard()]);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchPendingKyc: async () => {
    set({ pendingKycLoading: true });
    try {
      const res = await apiClient.get('/admin/kyc/pending');
      if (res.data?.success) {
        set({ pendingKycUsers: res.data.data || [], pendingKycLoading: false });
      } else {
        set({ pendingKycLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch pending KYC users:', err.message);
      set({ pendingKycLoading: false });
    }
  },

  reviewKyc: async (userId, status) => {
    try {
      await apiClient.post(`/admin/kyc/${userId}/review`, { status });
      await Promise.all([get().fetchPendingKyc(), get().fetchAdminDashboard()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchPendingDocuments: async () => {
    set({ pendingDocumentsLoading: true });
    try {
      const res = await apiClient.get('/media/documents/pending');
      if (res.data?.success) {
        set({ pendingDocuments: res.data.data || [], pendingDocumentsLoading: false });
      } else {
        set({ pendingDocumentsLoading: false });
      }
    } catch (err: any) {
      console.warn('Failed to fetch pending documents:', err.message);
      set({ pendingDocumentsLoading: false });
    }
  },

  reviewDocument: async (documentId, status, rejectionReason) => {
    try {
      await apiClient.patch(`/media/documents/${documentId}/review`, {
        verificationStatus: status,
        rejectionReason,
      });
      await Promise.all([get().fetchPendingDocuments(), get().fetchAdminDashboard()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  scheduleAuction: async (chitGroupId, monthNumber, scheduledAt) => {
    try {
      await apiClient.post('/admin/auctions/schedule', { chitGroupId, monthNumber, scheduledAt });
      await get().fetchAdminDashboard();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  makePayment: async (subscriptionId: string, amount?: number) => {
    try {
      await apiClient.post('/payments/simulate', { subscriptionId });
      await Promise.all([get().fetchActiveChits(), get().fetchPaymentHistory()]);
      return { success: true };
    } catch (err: any) {
      console.warn('Payment failed:', err.message);
      return { success: false, error: err.message || 'Payment processing failed' };
    }
  },
  exportUserData: async () => {
    try {
      const res = await apiClient.get('/compliance/dpdp/export');
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  withdrawDPDPConsent: async (purpose: string) => {
    try {
      await apiClient.post('/compliance/dpdp/withdraw', { purpose });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchFormXIV: async (auctionId: string) => {
    try {
      const res = await apiClient.get(`/compliance/form-xiv/${auctionId}`);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchGstInvoice: async (auctionId: string) => {
    try {
      const res = await apiClient.get(`/compliance/gst-invoice/${auctionId}`);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchUserProfile: async () => {
    try {
      const res = await apiClient.get('/users/me');
      if (res.data?.success && res.data?.data) {
        const u = res.data.data;
        const mappedUser: User = {
          id: u.id,
          phone: u.phone,
          full_name: u.fullName || 'Subscriber',
          email: u.email,
          pan_number: u.panNumber,
          role: u.role,
          kyc_status:
            u.kycStatus === 'APPROVED' || u.kycStatus === 'VERIFIED'
              ? 'VERIFIED'
              : u.kycStatus === 'PENDING'
              ? 'PENDING'
              : 'NOT_STARTED',
          is_nri: false,
          biometric_enabled: get().user?.biometric_enabled ?? false,
        };
        set({ user: mappedUser });
        return { success: true, data: u };
      }
      return { success: false, error: 'User data not found' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  updateUserProfile: async (data) => {
    try {
      const res = await apiClient.patch('/users/me', data);
      if (res.data?.success) {
        await get().fetchUserProfile();
        return { success: true, data: res.data.data };
      }
      return { success: false, error: 'Update failed' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchChitGroupDetails: async (groupId: string) => {
    set({ selectedGroupDetailsLoading: true });
    try {
      const res = await apiClient.get(`/chit-groups/${groupId}`);
      if (res.data?.success && res.data?.data) {
        set({ selectedGroupDetails: res.data.data, selectedGroupDetailsLoading: false });
        return { success: true, data: res.data.data };
      }
      set({ selectedGroupDetailsLoading: false });
      return { success: false, error: 'Group not found' };
    } catch (err: any) {
      set({ selectedGroupDetailsLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchSubscriptionInstallments: async (subscriptionId: string) => {
    try {
      const res = await apiClient.get(`/subscriptions/${subscriptionId}/installments`);
      if (res.data?.success && res.data?.data) {
        set((state) => ({
          subscriptionInstallments: {
            ...state.subscriptionInstallments,
            [subscriptionId]: res.data.data,
          },
        }));
        return { success: true, data: res.data.data };
      }
      return { success: false, error: 'Failed to fetch installments' };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  approveSuretyPackage: async (suretyId: string) => {
    try {
      const res = await apiClient.post(`/sureties/${suretyId}/approve`);
      await Promise.all([get().fetchActivePrizeClaim(), get().fetchAdminDashboard()]);
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  closeAuctionAdmin: async (auctionId: string) => {
    try {
      const res = await apiClient.post(`/auctions/${auctionId}/close`);
      get().closeCurrentAuction(res.data?.data);
      await get().fetchAdminDashboard();
      return { success: true, data: res.data?.data };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  fetchAdminLedger: async (filters) => {
    set({ adminLedgerLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.groupId) params.append('groupId', filters.groupId);
      if (filters?.subscriptionId) params.append('subscriptionId', filters.subscriptionId);
      if (filters?.from) params.append('from', filters.from);
      if (filters?.to) params.append('to', filters.to);

      const queryStr = params.toString();
      const res = await apiClient.get(`/admin/ledger${queryStr ? `?${queryStr}` : ''}`);
      if (res.data?.success) {
        const items = res.data.data?.items || res.data.data || [];
        set({ adminLedger: items, adminLedgerLoading: false });
        return { success: true, data: items };
      }
      set({ adminLedgerLoading: false });
      return { success: false, error: 'Could not fetch ledger' };
    } catch (err: any) {
      set({ adminLedgerLoading: false });
      return { success: false, error: err.response?.data?.error || err.message };
    }
  },

  setOffline: (offline) =>
    set({
      isOffline: offline,
      lastSynced: new Date().toLocaleTimeString('en-IN'),
    }),
}));
