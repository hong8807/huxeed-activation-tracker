/**
 * Data transformation for report sections (12 sections)
 * Adapted from vtrack-ppt-generator/src/data/transform.ts
 */
import type {
  Target, Supplier, StageHistory, ExchangeRates,
  ReportData, ReportMetadata, CoverData, KpiSummaryData,
  HighRevenueProductsData, HighRevenueItem,
  StrategyProgressData, StrategyItem,
  StageFunnelData, StageItem,
  AccountProgressData, AccountItem,
  SavingTop10Data, SavingItem,
  SupplierStatusData, SupplierProductItem,
  CostAnalysisData, CostAnalysisProduct, CostAnalysisAccount,
  OwnerDistributionData, OwnerItem,
  DetailTableData, DetailItem,
  ActionItemsData, ActionItem, ActionItemPage,
} from './types';
import { convertToKrw } from './exchange-rate';
import { STAGES, STAGE_ORDER } from './config';
import { formatDate, getKoreanDate, daysBetween, parseDate } from './date';

export function transformData(
  targets: Target[],
  suppliers: Supplier[],
  stageHistory: StageHistory[],
  exchangeRates: ExchangeRates
): ReportData {
  const now = getKoreanDate();
  const reportDate = formatDate(now);

  return {
    metadata: buildMetadata(targets, suppliers, exchangeRates, reportDate),
    cover: buildCoverData(now),
    logoPath: './assets/logo.png',
    kpiSummary: buildKpiSummary(targets),
    highRevenueProducts: buildHighRevenueProducts(targets),
    strategyProgress: buildStrategyProgress(targets),
    stageFunnel: buildStageFunnel(targets),
    accountProgress: buildAccountProgress(targets),
    savingTop10: buildSavingTop10(targets),
    supplierStatus: buildSupplierStatus(targets, suppliers),
    costAnalysis: buildCostAnalysis(targets, suppliers, exchangeRates, reportDate),
    ownerDistribution: buildOwnerDistribution(targets),
    detailTable: buildDetailTable(targets),
    actionItems: buildActionItems(targets, suppliers, stageHistory),
  };
}

function buildMetadata(
  targets: Target[],
  suppliers: Supplier[],
  exchangeRates: ExchangeRates,
  reportDate: string
): ReportMetadata {
  return {
    generatedAt: new Date().toISOString(),
    reportDate,
    exchangeRates,
    totalTargets: targets.length,
    totalSuppliers: suppliers.length,
  };
}

function buildCoverData(date: Date): CoverData {
  return {
    title: '휴시드 V-Track System 현황 보고',
    subtitle: 'HUXEED Activation Tracking System',
    vision: '2028년까지 750억 이상 지속성장 하는 기업으로 원료의약품 판매 TOP 5 진입',
    generatedDate: formatDate(date),
    reportMonth: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
  };
}

function buildKpiSummary(targets: Target[]): KpiSummaryData {
  const totalTargets = targets.length;
  const avgProgress =
    targets.reduce((sum, t) => sum + (t.stage_progress_rate || 0), 0) / totalTargets;
  const completedTargets = targets.filter((t) => t.current_stage === 'WON').length;
  const targetRevenue = targets.reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0);
  const achievedRevenue = targets
    .filter((t) => t.current_stage === 'WON')
    .reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0);
  const achievementRate = targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0;

  return {
    totalTargets,
    avgProgress,
    completedTargets,
    targetRevenue,
    achievedRevenue,
    achievementRate,
  };
}

function buildHighRevenueProducts(targets: Target[]): HighRevenueProductsData {
  const threshold = 500_000_000;
  const rowsPerPage = 13;

  const filtered = targets
    .filter((t) => (t.our_est_revenue_krw || 0) >= threshold)
    .sort((a, b) => (b.our_est_revenue_krw || 0) - (a.our_est_revenue_krw || 0));

  const items: HighRevenueItem[] = filtered.map((t, idx) => ({
    rank: idx + 1,
    accountName: t.account_name,
    productName: t.product_name,
    quantity: t.est_qty_kg || 0,
    unitPriceKrw: t.our_unit_price_krw || 0,
    estRevenue: t.our_est_revenue_krw || 0,
    stage: t.current_stage,
    stageName: STAGES[t.current_stage as keyof typeof STAGES]?.label || t.current_stage,
  }));

  const pages: HighRevenueItem[][] = [];
  for (let i = 0; i < items.length; i += rowsPerPage) {
    pages.push(items.slice(i, i + rowsPerPage));
  }

  return {
    items,
    pages,
    totalCount: items.length,
    totalRevenue: items.reduce((sum, i) => sum + i.estRevenue, 0),
    threshold,
    rowsPerPage,
    totalPages: pages.length || 1,
  };
}

function buildStrategyProgress(targets: Target[]): StrategyProgressData {
  const STRATEGY_PRODUCTS = {
    whiteSpace: ['cefaclor', 'rebamipide', 'clarithromycin'],
    erdosteine: ['erdosteine'],
  };

  const isStrategyProduct = (productName: string): boolean => {
    const lower = productName?.toLowerCase() || '';
    return (
      STRATEGY_PRODUCTS.whiteSpace.some((p) => lower.includes(p)) ||
      STRATEGY_PRODUCTS.erdosteine.some((p) => lower.includes(p))
    );
  };

  const whiteSpaceTargets = targets.filter((t) => {
    const lower = t.product_name?.toLowerCase() || '';
    return STRATEGY_PRODUCTS.whiteSpace.some((p) => lower.includes(p));
  });

  const erdosteineTargets = targets.filter((t) =>
    t.product_name?.toLowerCase().includes('erdosteine')
  );

  const spTargets = targets.filter(
    (t) =>
      (t.segment === 'S' || t.segment === 'P') &&
      !isStrategyProduct(t.product_name)
  );

  const buildStrategyItem = (items: Target[], name: string): StrategyItem => {
    const targetRevenue = items.reduce((sum, t) => sum + (t.our_est_revenue_krw || 0), 0);
    const wonItems = items.filter((t) => t.current_stage === 'WON');
    const achievedRevenue = wonItems.reduce(
      (sum, t) => sum + (t.our_est_revenue_krw || 0),
      0
    );

    return {
      name,
      targetRevenue,
      achievedRevenue,
      achievementRate: targetRevenue > 0 ? (achievedRevenue / targetRevenue) * 100 : 0,
      targetCount: items.length,
      completedCount: wonItems.length,
    };
  };

  return {
    whiteSpace: buildStrategyItem(whiteSpaceTargets, 'White Space'),
    erdosteine: buildStrategyItem(erdosteineTargets, 'Erdosteine'),
    spSegment: buildStrategyItem(spTargets, 'S/P 세그먼트'),
  };
}

function buildStageFunnel(targets: Target[]): StageFunnelData {
  const stageCounts: Record<string, number> = {};

  for (const stage of STAGE_ORDER) {
    stageCounts[stage] = targets.filter((t) => t.current_stage === stage).length;
  }

  stageCounts['LOST'] = targets.filter((t) => t.current_stage === 'LOST').length;
  stageCounts['ON_HOLD'] = targets.filter((t) => t.current_stage === 'ON_HOLD').length;

  const totalCount = targets.length;

  const stages: StageItem[] = STAGE_ORDER.map((stage) => ({
    stage,
    stageName: STAGES[stage as keyof typeof STAGES]?.label || stage,
    count: stageCounts[stage] || 0,
    percentage: totalCount > 0 ? ((stageCounts[stage] || 0) / totalCount) * 100 : 0,
    color: '#' + (STAGES[stage as keyof typeof STAGES] ? '2563EB' : '6B7280'),
  }));

  return { stages, totalCount };
}

function buildAccountProgress(targets: Target[]): AccountProgressData {
  const accountMap = new Map<
    string,
    { targets: Target[]; totalProgress: number; completedCount: number; totalRevenue: number }
  >();

  for (const t of targets) {
    const existing = accountMap.get(t.account_name) || {
      targets: [],
      totalProgress: 0,
      completedCount: 0,
      totalRevenue: 0,
    };

    existing.targets.push(t);
    existing.totalProgress += t.stage_progress_rate || 0;
    if (t.current_stage === 'WON') existing.completedCount++;
    existing.totalRevenue += t.our_est_revenue_krw || 0;

    accountMap.set(t.account_name, existing);
  }

  const accounts: AccountItem[] = Array.from(accountMap.entries())
    .map(([name, data]) => ({
      accountName: name,
      avgProgress: data.totalProgress / data.targets.length,
      targetCount: data.targets.length,
      completedCount: data.completedCount,
      totalRevenue: data.totalRevenue,
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 10);

  return { accounts, totalCount: accountMap.size };
}

function buildSavingTop10(targets: Target[]): SavingTop10Data {
  const sorted = [...targets]
    .filter((t) => (t.total_saving_krw || 0) > 0)
    .sort((a, b) => (b.total_saving_krw || 0) - (a.total_saving_krw || 0))
    .slice(0, 10);

  const items: SavingItem[] = sorted.map((t, idx) => ({
    rank: idx + 1,
    accountName: t.account_name,
    productName: t.product_name,
    totalSaving: t.total_saving_krw || 0,
    savingRate: t.saving_rate || 0,
  }));

  return {
    items,
    totalSaving: items.reduce((sum, i) => sum + i.totalSaving, 0),
  };
}

function normalizeProductName(name: string | null | undefined): string {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function buildSupplierStatus(
  targets: Target[],
  suppliers: Supplier[]
): SupplierStatusData {
  const rowsPerPage = 11;

  const productSupplierMap = new Map<string, Map<string, { dmf_registered: boolean; linkage_status: string }>>();

  for (const s of suppliers) {
    const normalizedName = normalizeProductName(s.product_name);
    if (!productSupplierMap.has(normalizedName)) {
      productSupplierMap.set(normalizedName, new Map());
    }
    const supplierMap = productSupplierMap.get(normalizedName)!;

    if (!supplierMap.has(s.supplier_name)) {
      supplierMap.set(s.supplier_name, {
        dmf_registered: s.dmf_registered,
        linkage_status: s.linkage_status,
      });
    }
  }

  const productNameMap = new Map<string, string>();
  for (const t of targets) {
    const normalizedName = normalizeProductName(t.product_name);
    if (!productNameMap.has(normalizedName)) {
      productNameMap.set(normalizedName, t.product_name);
    }
  }

  const products: SupplierProductItem[] = Array.from(productNameMap.entries())
    .map(([normalizedName, productName]) => {
      const supplierMap = productSupplierMap.get(normalizedName) || new Map();
      const supplierCount = supplierMap.size;
      const dmfCount = Array.from(supplierMap.values()).filter((s) => s.dmf_registered).length;
      const linkageCompletedCount = Array.from(supplierMap.values()).filter(
        (s) => s.linkage_status === 'COMPLETED'
      ).length;

      return {
        productName,
        supplierCount,
        dmfCount,
        dmfRate: supplierCount > 0 ? (dmfCount / supplierCount) * 100 : 0,
        linkageCompletedCount,
        linkageRate:
          supplierCount > 0 ? (linkageCompletedCount / supplierCount) * 100 : 0,
        hasWarning: supplierCount === 0,
      };
    })
    .sort((a, b) => b.supplierCount - a.supplierCount);

  const productsWithSuppliers = products.filter((p) => p.supplierCount > 0).length;

  const pages: SupplierProductItem[][] = [];
  for (let i = 0; i < products.length; i += rowsPerPage) {
    pages.push(products.slice(i, i + rowsPerPage));
  }

  return {
    products,
    pages,
    summary: {
      totalProducts: productNameMap.size,
      productsWithSuppliers,
      coverageRate: productNameMap.size > 0 ? (productsWithSuppliers / productNameMap.size) * 100 : 0,
      avgDmfRate:
        products.length > 0
          ? products.reduce((sum, p) => sum + p.dmfRate, 0) / products.length
          : 0,
      avgLinkageRate:
        products.length > 0
          ? products.reduce((sum, p) => sum + p.linkageRate, 0) / products.length
          : 0,
    },
    rowsPerPage,
    totalPages: pages.length || 1,
  };
}

function buildCostAnalysis(
  targets: Target[],
  suppliers: Supplier[],
  exchangeRates: ExchangeRates,
  reportDate: string
): CostAnalysisData {
  const productsPerPage = 2;

  const productsWithSuppliers = [...new Set(suppliers.map((s) => s.product_name))];

  const products: CostAnalysisProduct[] = productsWithSuppliers.map((productName) => {
    const productSuppliers = suppliers.filter((s) => s.product_name === productName);

    const lowestCostSupplier = productSuppliers.reduce((lowest, curr) => {
      const lowestCost = convertToKrw(lowest.unit_price_foreign, lowest.currency, exchangeRates);
      const currCost = convertToKrw(curr.unit_price_foreign, curr.currency, exchangeRates);
      return currCost < lowestCost ? curr : lowest;
    });

    const costKrw = convertToKrw(
      lowestCostSupplier.unit_price_foreign,
      lowestCostSupplier.currency,
      exchangeRates
    );

    const productTargets = targets.filter((t) => t.product_name === productName);

    const accounts: CostAnalysisAccount[] = productTargets.map((t) => {
      const sellingPriceKrw = t.our_unit_price_krw || 0;
      const profitMargin =
        sellingPriceKrw > 0 ? ((sellingPriceKrw - costKrw) / sellingPriceKrw) * 100 : 0;

      return {
        accountName: t.account_name,
        sellingPriceKrw,
        profitMargin,
        quantity: t.est_qty_kg || 0,
        estRevenue: t.our_est_revenue_krw || 0,
      };
    });

    return {
      productName,
      lowestCostSupplier: {
        supplierName: lowestCostSupplier.supplier_name,
        originalCurrency: lowestCostSupplier.currency,
        originalPrice: lowestCostSupplier.unit_price_foreign,
        costKrw,
      },
      accounts,
      totalEstRevenue: accounts.reduce((sum, a) => sum + a.estRevenue, 0),
    };
  });

  let totalProfitMargin = 0;
  let accountCount = 0;
  for (const p of products) {
    for (const a of p.accounts) {
      totalProfitMargin += a.profitMargin;
      accountCount++;
    }
  }

  const MAX_PAGE_HEIGHT = 420;
  const PRODUCT_HEADER_HEIGHT = 100;
  const TABLE_HEADER_HEIGHT = 35;
  const ROW_HEIGHT = 35;
  const MARGIN = 20;

  const calcProductHeight = (p: CostAnalysisProduct): number => {
    return PRODUCT_HEADER_HEIGHT + TABLE_HEADER_HEIGHT + (p.accounts.length * ROW_HEIGHT) + MARGIN;
  };

  const pages: CostAnalysisProduct[][] = [];
  let currentPage: CostAnalysisProduct[] = [];
  let currentHeight = 0;

  for (const product of products) {
    const productHeight = calcProductHeight(product);

    if (currentHeight + productHeight <= MAX_PAGE_HEIGHT && currentPage.length < 2) {
      currentPage.push(product);
      currentHeight += productHeight;
    } else {
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }
      currentPage = [product];
      currentHeight = productHeight;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return {
    reportDate,
    exchangeRates,
    products,
    pages,
    summary: {
      totalProducts: products.length,
      totalAccounts: accountCount,
      avgProfitMargin: accountCount > 0 ? totalProfitMargin / accountCount : 0,
    },
    productsPerPage,
    totalPages: pages.length || 1,
  };
}

function buildOwnerDistribution(targets: Target[]): OwnerDistributionData {
  const rowsPerPage = 12;

  const ownerMap = new Map<
    string,
    { targets: Target[]; totalProgress: number; completedCount: number; totalRevenue: number }
  >();

  for (const t of targets) {
    const ownerName = t.owner_name || '미지정';
    const existing = ownerMap.get(ownerName) || {
      targets: [],
      totalProgress: 0,
      completedCount: 0,
      totalRevenue: 0,
    };

    existing.targets.push(t);
    existing.totalProgress += t.stage_progress_rate || 0;
    if (t.current_stage === 'WON') existing.completedCount++;
    existing.totalRevenue += t.our_est_revenue_krw || 0;

    ownerMap.set(ownerName, existing);
  }

  const totalCount = targets.length;

  const owners: OwnerItem[] = Array.from(ownerMap.entries())
    .map(([name, data]) => ({
      ownerName: name,
      targetCount: data.targets.length,
      avgProgress: data.totalProgress / data.targets.length,
      completedCount: data.completedCount,
      totalRevenue: data.totalRevenue,
      percentage: (data.targets.length / totalCount) * 100,
    }))
    .sort((a, b) => b.targetCount - a.targetCount);

  const pages: OwnerItem[][] = [];
  for (let i = 0; i < owners.length; i += rowsPerPage) {
    pages.push(owners.slice(i, i + rowsPerPage));
  }

  return {
    owners,
    pages,
    totalCount,
    rowsPerPage,
    totalPages: pages.length || 1,
  };
}

function buildDetailTable(targets: Target[]): DetailTableData {
  const rowsPerPage = 13;

  const items: DetailItem[] = targets
    .filter((t) => (t.our_est_revenue_krw || 0) > 0)
    .map((t) => ({
      accountName: t.account_name,
      productName: t.product_name,
      ownerName: t.owner_name || '-',
      stage: t.current_stage,
      stageName: STAGES[t.current_stage as keyof typeof STAGES]?.label || t.current_stage,
      progress: t.stage_progress_rate || 0,
      estRevenue: t.our_est_revenue_krw || 0,
      segment: t.segment || '일반',
    }))
    .sort((a, b) => {
      if (b.estRevenue !== a.estRevenue) {
        return b.estRevenue - a.estRevenue;
      }
      return b.progress - a.progress;
    });

  const pages: DetailItem[][] = [];
  for (let i = 0; i < items.length; i += rowsPerPage) {
    pages.push(items.slice(i, i + rowsPerPage));
  }

  return {
    items,
    pages,
    totalPages: pages.length || 1,
    rowsPerPage,
  };
}

function buildActionItems(
  targets: Target[],
  suppliers: Supplier[],
  stageHistory: StageHistory[]
): ActionItemsData {
  const now = getKoreanDate();
  const highPriority: ActionItem[] = [];
  const mediumPriority: ActionItem[] = [];
  const itemsPerPage = 8;
  const revenueThreshold = 500_000_000;

  const productRevenueMap = new Map<string, number>();
  for (const t of targets) {
    const current = productRevenueMap.get(t.product_name) || 0;
    productRevenueMap.set(t.product_name, current + (t.our_est_revenue_krw || 0));
  }

  for (const t of targets) {
    if (t.current_stage === 'SOURCING_REQUEST') {
      const stageDate = t.stage_updated_at ? parseDate(t.stage_updated_at.split('T')[0]) : null;
      const daysElapsed = stageDate ? daysBetween(now, stageDate) : 0;
      const totalEstRevenue = productRevenueMap.get(t.product_name) || 0;

      if (totalEstRevenue >= revenueThreshold) {
        highPriority.push({
          accountName: t.account_name,
          productName: t.product_name,
          issue: '소싱요청 대기 중 - 제조원 발굴 필요',
          daysElapsed,
          stage: t.current_stage,
          totalEstRevenue,
        });
      }
    }
  }

  const sourcingCompletedIndex = STAGE_ORDER.indexOf('SOURCING_COMPLETED');
  const quotesentIndex = STAGE_ORDER.indexOf('QUOTE_SENT');

  for (const t of targets) {
    const stageIndex = STAGE_ORDER.indexOf(t.current_stage);

    if (stageIndex >= sourcingCompletedIndex && stageIndex < quotesentIndex) {
      const stageDate = t.stage_updated_at ? parseDate(t.stage_updated_at.split('T')[0]) : null;
      const daysElapsed = stageDate ? daysBetween(now, stageDate) : 0;

      if (daysElapsed >= 7) {
        mediumPriority.push({
          accountName: t.account_name,
          productName: t.product_name,
          issue: `소싱완료 후 영업액션 대기 (${daysElapsed}일 경과)`,
          daysElapsed,
          stage: t.current_stage,
        });
      }
    }
  }

  highPriority.sort((a, b) => (b.totalEstRevenue || 0) - (a.totalEstRevenue || 0));
  mediumPriority.sort((a, b) => b.daysElapsed - a.daysElapsed);

  const pages: ActionItemPage[] = [];
  const highPerPage = 4;
  const mediumPerPage = 4;

  let highIndex = 0;
  let mediumIndex = 0;
  let pageNum = 1;

  while (highIndex < highPriority.length || mediumIndex < mediumPriority.length) {
    const pageHighItems = highPriority.slice(highIndex, highIndex + highPerPage);
    const pageMediumItems = mediumPriority.slice(mediumIndex, mediumIndex + mediumPerPage);

    pages.push({
      pageNum,
      highPriority: pageHighItems,
      mediumPriority: pageMediumItems,
    });

    highIndex += highPerPage;
    mediumIndex += mediumPerPage;
    pageNum++;
  }

  if (pages.length === 0) {
    pages.push({
      pageNum: 1,
      highPriority: [],
      mediumPriority: [],
    });
  }

  return {
    highPriority,
    mediumPriority,
    pages,
    totalPages: pages.length,
    itemsPerPage,
  };
}
