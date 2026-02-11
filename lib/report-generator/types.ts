/**
 * V-track Report Generator - Type Definitions
 * Extracted from vtrack-ppt-generator
 */

// Database types
export interface Target {
  id: string;
  year: number;
  account_name: string;
  product_name: string;
  est_qty_kg: number;
  owner_name: string;
  sales_2025_krw: number;
  segment: string | null;

  curr_currency: string;
  curr_unit_price_foreign: number;
  curr_fx_rate_input: number;
  curr_unit_price_krw: number;
  curr_total_krw: number;

  our_currency: string;
  our_unit_price_foreign: number;
  our_fx_rate_input: number;
  our_unit_price_krw: number;
  our_est_revenue_krw: number;

  saving_per_kg: number;
  total_saving_krw: number;
  saving_rate: number;

  current_stage: string;
  stage_updated_at: string | null;
  stage_progress_rate: number;

  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  target_id: string;
  product_name: string;
  supplier_name: string;
  created_by_name: string | null;

  currency: string;
  unit_price_foreign: number;
  fx_rate: number;
  tariff_rate: number;
  additional_cost_rate: number;
  unit_price_krw: number;

  dmf_registered: boolean;
  linkage_status: string;

  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageHistory {
  id: string;
  target_id: string;
  stage: string;
  changed_at: string;
  actor_name: string | null;
  comment: string | null;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  CNY: number;
  JPY: number;
  KRW: number;
  timestamp: string;
}

// Report section types
export interface ReportData {
  metadata: ReportMetadata;
  cover: CoverData;
  logoPath: string;
  kpiSummary: KpiSummaryData;
  highRevenueProducts: HighRevenueProductsData;
  strategyProgress: StrategyProgressData;
  stageFunnel: StageFunnelData;
  accountProgress: AccountProgressData;
  savingTop10: SavingTop10Data;
  supplierStatus: SupplierStatusData;
  costAnalysis: CostAnalysisData;
  ownerDistribution: OwnerDistributionData;
  detailTable: DetailTableData;
  actionItems: ActionItemsData;
}

export interface ReportMetadata {
  generatedAt: string;
  reportDate: string;
  exchangeRates: ExchangeRates;
  totalTargets: number;
  totalSuppliers: number;
}

export interface CoverData {
  title: string;
  subtitle: string;
  vision: string;
  generatedDate: string;
  reportMonth: string;
}

export interface KpiSummaryData {
  totalTargets: number;
  avgProgress: number;
  completedTargets: number;
  targetRevenue: number;
  achievedRevenue: number;
  achievementRate: number;
}

export interface HighRevenueProductsData {
  items: HighRevenueItem[];
  pages: HighRevenueItem[][];
  totalCount: number;
  totalRevenue: number;
  threshold: number;
  rowsPerPage: number;
  totalPages: number;
}

export interface HighRevenueItem {
  rank: number;
  accountName: string;
  productName: string;
  quantity: number;
  unitPriceKrw: number;
  estRevenue: number;
  stage: string;
  stageName: string;
}

export interface StrategyProgressData {
  whiteSpace: StrategyItem;
  erdosteine: StrategyItem;
  spSegment: StrategyItem;
}

export interface StrategyItem {
  name: string;
  targetRevenue: number;
  achievedRevenue: number;
  achievementRate: number;
  targetCount: number;
  completedCount: number;
}

export interface StageFunnelData {
  stages: StageItem[];
  totalCount: number;
}

export interface StageItem {
  stage: string;
  stageName: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AccountProgressData {
  accounts: AccountItem[];
  totalCount: number;
}

export interface AccountItem {
  accountName: string;
  avgProgress: number;
  targetCount: number;
  completedCount: number;
  totalRevenue: number;
}

export interface SavingTop10Data {
  items: SavingItem[];
  totalSaving: number;
}

export interface SavingItem {
  rank: number;
  accountName: string;
  productName: string;
  totalSaving: number;
  savingRate: number;
}

export interface SupplierStatusData {
  products: SupplierProductItem[];
  pages: SupplierProductItem[][];
  summary: {
    totalProducts: number;
    productsWithSuppliers: number;
    coverageRate: number;
    avgDmfRate: number;
    avgLinkageRate: number;
  };
  rowsPerPage: number;
  totalPages: number;
}

export interface SupplierProductItem {
  productName: string;
  supplierCount: number;
  dmfCount: number;
  dmfRate: number;
  linkageCompletedCount: number;
  linkageRate: number;
  hasWarning: boolean;
}

export interface CostAnalysisData {
  reportDate: string;
  exchangeRates: ExchangeRates;
  products: CostAnalysisProduct[];
  pages: CostAnalysisProduct[][];
  summary: {
    totalProducts: number;
    totalAccounts: number;
    avgProfitMargin: number;
  };
  productsPerPage: number;
  totalPages: number;
}

export interface CostAnalysisProduct {
  productName: string;
  lowestCostSupplier: {
    supplierName: string;
    originalCurrency: string;
    originalPrice: number;
    costKrw: number;
  };
  accounts: CostAnalysisAccount[];
  totalEstRevenue: number;
}

export interface CostAnalysisAccount {
  accountName: string;
  sellingPriceKrw: number;
  profitMargin: number;
  quantity: number;
  estRevenue: number;
}

export interface OwnerDistributionData {
  owners: OwnerItem[];
  pages: OwnerItem[][];
  totalCount: number;
  rowsPerPage: number;
  totalPages: number;
}

export interface OwnerItem {
  ownerName: string;
  targetCount: number;
  avgProgress: number;
  completedCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface DetailTableData {
  items: DetailItem[];
  pages: DetailItem[][];
  totalPages: number;
  rowsPerPage: number;
}

export interface DetailItem {
  accountName: string;
  productName: string;
  ownerName: string;
  stage: string;
  stageName: string;
  progress: number;
  estRevenue: number;
  segment: string;
}

export interface ActionItemsData {
  highPriority: ActionItem[];
  mediumPriority: ActionItem[];
  pages: ActionItemPage[];
  totalPages: number;
  itemsPerPage: number;
}

export interface ActionItemPage {
  pageNum: number;
  highPriority: ActionItem[];
  mediumPriority: ActionItem[];
}

export interface ActionItem {
  accountName: string;
  productName: string;
  issue: string;
  daysElapsed: number;
  stage: string;
  totalEstRevenue?: number;
}
