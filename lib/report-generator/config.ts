/**
 * V-track PPT Generator Configuration
 * Copied from vtrack-ppt-generator/src/config.ts
 */

export const SLIDE_CONFIG = {
  width: 10,
  height: 7.5,
  margin: {
    top: 0.5,
    bottom: 0.5,
    left: 0.5,
    right: 0.5,
  },
};

export const COLORS = {
  primary: '97C11F',
  primaryDark: '7BA316',
  primaryLight: 'B8D954',
  secondary: '64748B',
  success: '97C11F',
  warning: 'F59E0B',
  danger: 'EF4444',
  info: '06B6D4',

  textPrimary: '1F2937',
  textSecondary: '6B7280',
  textLight: 'FFFFFF',

  bgWhite: 'FFFFFF',
  bgLight: 'F3F4F6',
  bgDark: '1F2937',
  bgGreen: 'F0F7E0',

  chart: [
    '97C11F', '7BA316', 'B8D954', '10B981',
    'F59E0B', '06B6D4', '8B5CF6', 'EC4899',
  ],

  stages: {
    MARKET_RESEARCH: '94A3B8',
    SOURCING_REQUEST: 'FBBF24',
    SOURCING_COMPLETED: '97C11F',
    QUOTE_SENT: '06B6D4',
    SAMPLE_SHIPPED: '06B6D4',
    QUALIFICATION: '06B6D4',
    DMF_RA_REVIEW: '1F2937',
    PRICE_AGREED: '1F2937',
    TRIAL_PO: '1F2937',
    REGISTRATION: '1F2937',
    COMMERCIAL_PO: '97C11F',
    WON: '97C11F',
    LOST: 'EF4444',
    ON_HOLD: 'FBBF24',
  },

  segments: {
    S: '97C11F',
    P: '8B5CF6',
    일반: '6B7280',
  },
};

export const FONTS = {
  heading: 'Pretendard',
  body: 'Pretendard',
  fallback: '맑은 고딕',

  sizes: {
    title: 28,
    subtitle: 20,
    heading1: 18,
    heading2: 16,
    body: 12,
    small: 10,
    tiny: 8,
  },
};

export const LAYOUT = {
  kpiCard: {
    width: 2.1,
    height: 1.2,
    gap: 0.3,
  },
  table: {
    rowsPerPage: 15,
    headerHeight: 0.4,
    rowHeight: 0.35,
  },
  chart: {
    barWidth: 0.4,
    pieRadius: 1.5,
    funnelWidth: 8,
  },
};

export const STAGES = {
  MARKET_RESEARCH: { label: '시장조사', progress: 0 },
  SOURCING_REQUEST: { label: '소싱요청', progress: 5 },
  SOURCING_COMPLETED: { label: '소싱완료', progress: 10 },
  QUOTE_SENT: { label: '견적발송', progress: 20 },
  SAMPLE_SHIPPED: { label: '샘플배송', progress: 30 },
  QUALIFICATION: { label: '품질테스트', progress: 40 },
  DMF_RA_REVIEW: { label: 'DMF/RA검토', progress: 50 },
  PRICE_AGREED: { label: '가격합의', progress: 60 },
  TRIAL_PO: { label: '시험PO', progress: 70 },
  REGISTRATION: { label: '완제연계심사중', progress: 80 },
  COMMERCIAL_PO: { label: '상업PO', progress: 90 },
  WON: { label: '완료', progress: 100 },
  LOST: { label: '실패', progress: 0 },
  ON_HOLD: { label: '보류', progress: 50 },
};

export const STAGE_ORDER = [
  'MARKET_RESEARCH',
  'SOURCING_REQUEST',
  'SOURCING_COMPLETED',
  'QUOTE_SENT',
  'SAMPLE_SHIPPED',
  'QUALIFICATION',
  'DMF_RA_REVIEW',
  'PRICE_AGREED',
  'TRIAL_PO',
  'REGISTRATION',
  'COMMERCIAL_PO',
  'WON',
];

export const CURRENCIES = ['USD', 'EUR', 'CNY', 'JPY', 'KRW'] as const;
export type Currency = (typeof CURRENCIES)[number];
