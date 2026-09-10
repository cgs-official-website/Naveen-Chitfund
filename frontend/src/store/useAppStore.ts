import { create } from 'zustand';

export type SubscriberStatus = 'NPS' | 'SB' | 'PS';
export type UserRole = 'user' | 'admin';
export type DividendPolicy = 'ALL_SUBSCRIBERS' | 'NON_PRIZED_ONLY';

export interface ChitGroup {
  id: string;
  name: string;
  chit_amount: number;
  duration_months: number;
  foreman_commission_pct: number;
  registrar_state_code: string;
  dividend_distribution_policy: DividendPolicy;
  status: 'OPEN' | 'ACTIVE' | 'CLOSED';
  subscriber_count: number;
  vacant_slots: number;
  current_month: number;
  installment_amount: number;
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
  installment_amount: number;
  next_due_date: string;
  is_overdue: boolean;
  installments_paid: number;
  total_installments: number;
  total_dividend_earned: number;
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

interface AppState {
  user: User | null;
  token: string | null;
  isOffline: boolean;
  lastSynced: string;
  activeChits: Subscription[];
  availableGroups: ChitGroup[];
  currentAuction: Auction | null;
  dpdpConsents: DPDPConsents;

  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateKycStatus: (status: 'PENDING' | 'VERIFIED') => void;
  updateDPDPConsent: (key: keyof DPDPConsents, value: boolean) => void;
  toggleBiometric: () => void;
  joinChitGroup: (group: ChitGroup) => void;
  submitBid: (bidPct: number) => boolean;
  makePayment: (subscriptionId: string, amount: number) => void;
  setOffline: (offline: boolean) => void;
}

const INITIAL_GROUPS: ChitGroup[] = [
  {
    id: 'grp-tg-101',
    name: 'Kaveti Smart Wealth Series-I',
    chit_amount: 500000,
    duration_months: 20,
    foreman_commission_pct: 5,
    registrar_state_code: 'Telangana (T-Chits: TG-HYD-8821)',
    dividend_distribution_policy: 'NON_PRIZED_ONLY',
    status: 'ACTIVE',
    subscriber_count: 20,
    vacant_slots: 0,
    current_month: 4,
    installment_amount: 25000,
    security_instrument: 'Bank Guarantee',
    fdr_number: 'SBI/HYD/FDR-992140',
    pso_order_number: 'PSO/TS/2025/0892',
    past_dividends: [3125, 4250, 3800],
  },
  {
    id: 'grp-tg-102',
    name: 'Kakatiya Premium Gold Chit',
    chit_amount: 1000000,
    duration_months: 25,
    foreman_commission_pct: 5,
    registrar_state_code: 'Telangana (T-Chits: TG-WGL-3312)',
    dividend_distribution_policy: 'ALL_SUBSCRIBERS',
    status: 'OPEN',
    subscriber_count: 22,
    vacant_slots: 3,
    current_month: 1,
    installment_amount: 40000,
    security_instrument: 'Govt Securities',
    fdr_number: 'HDFC/FDR-817293',
    pso_order_number: 'PSO/TS/2026/0144',
    past_dividends: [],
  },
  {
    id: 'grp-ap-201',
    name: 'Amaravati Growth Chit-V',
    chit_amount: 250000,
    duration_months: 25,
    foreman_commission_pct: 5,
    registrar_state_code: 'Andhra Pradesh (AP-VJA-4912)',
    dividend_distribution_policy: 'NON_PRIZED_ONLY',
    status: 'OPEN',
    subscriber_count: 18,
    vacant_slots: 7,
    current_month: 1,
    installment_amount: 10000,
    security_instrument: 'Cash Deposit',
    fdr_number: 'ICICI/VJA/FDR-192301',
    pso_order_number: 'PSO/AP/2026/0071',
    past_dividends: [],
  },
];

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-001',
    chit_group_id: 'grp-tg-101',
    chit_group_name: 'Kaveti Smart Wealth Series-I',
    ticket_number: 7,
    subscriber_status: 'NPS',
    chit_amount: 500000,
    installment_amount: 21875, // after dividend
    next_due_date: '2026-09-15',
    is_overdue: false,
    installments_paid: 3,
    total_installments: 20,
    total_dividend_earned: 11175,
  },
];

const INITIAL_AUCTION: Auction = {
  id: 'auc-tg-101-m4',
  chit_group_id: 'grp-tg-101',
  chit_group_name: 'Kaveti Smart Wealth Series-I',
  month_number: 4,
  status: 'IN_PROGRESS',
  scheduled_at: 'Today, 05:30 PM',
  current_lowest_bid_pct: 22.5,
  chit_amount: 500000,
  total_subscribers: 20,
  present_subscribers: 14,
  remaining_seconds: 78,
  bids: [
    {
      id: 'b-1',
      bidder_name: 'Ticket #14 (Ramesh V.)',
      ticket_number: 14,
      bid_pct: 18.0,
      discount_amount: 90000,
      timestamp: '17:03:12',
    },
    {
      id: 'b-2',
      bidder_name: 'Ticket #03 (Sunita K.)',
      ticket_number: 3,
      bid_pct: 20.5,
      discount_amount: 102500,
      timestamp: '17:05:44',
    },
    {
      id: 'b-3',
      bidder_name: 'Ticket #19 (K. Naresh)',
      ticket_number: 19,
      bid_pct: 22.5,
      discount_amount: 112500,
      timestamp: '17:06:50',
    },
  ],
};

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    id: 'usr-demo-01',
    phone: '+91 98765 43210',
    full_name: 'Mohamed Asfaque',
    role: 'user',
    kyc_status: 'VERIFIED',
    is_nri: false,
    biometric_enabled: true,
  },
  token: 'mock_jwt_token_chittech_2026',
  isOffline: false,
  lastSynced: 'Just now',
  activeChits: INITIAL_SUBSCRIPTIONS,
  availableGroups: INITIAL_GROUPS,
  currentAuction: INITIAL_AUCTION,
  dpdpConsents: {
    identity_verification: true,
    credit_bureau_check: true,
    auction_participation_records: true,
    regulatory_reporting_pmla: true,
    marketing_communications: false,
  },

  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  switchRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
  updateKycStatus: (status) =>
    set((state) => ({
      user: state.user ? { ...state.user, kyc_status: status } : null,
    })),
  updateDPDPConsent: (key, value) =>
    set((state) => ({
      dpdpConsents: { ...state.dpdpConsents, [key]: value },
    })),
  toggleBiometric: () =>
    set((state) => ({
      user: state.user ? { ...state.user, biometric_enabled: !state.user.biometric_enabled } : null,
    })),
  joinChitGroup: (group) =>
    set((state) => {
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        chit_group_id: group.id,
        chit_group_name: group.name,
        ticket_number: group.subscriber_count + 1,
        subscriber_status: 'NPS',
        chit_amount: group.chit_amount,
        installment_amount: group.installment_amount,
        next_due_date: '2026-10-01',
        is_overdue: false,
        installments_paid: 1,
        total_installments: group.duration_months,
        total_dividend_earned: 0,
      };
      return {
        activeChits: [newSub, ...state.activeChits],
      };
    }),
  submitBid: (bidPct) => {
    const state = get();
    if (!state.currentAuction) return false;
    const discountAmount = (state.currentAuction.chit_amount * bidPct) / 100;
    const newBid: BidItem = {
      id: `b-${Date.now()}`,
      bidder_name: `Ticket #07 (${state.user?.full_name || 'You'})`,
      ticket_number: 7,
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
    return true;
  },
  makePayment: (subscriptionId, amount) =>
    set((state) => ({
      activeChits: state.activeChits.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, is_overdue: false, installments_paid: sub.installments_paid + 1 }
          : sub
      ),
    })),
  setOffline: (offline) =>
    set({
      isOffline: offline,
      lastSynced: new Date().toLocaleTimeString('en-IN'),
    }),
}));
