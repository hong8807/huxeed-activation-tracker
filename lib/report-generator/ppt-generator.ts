/**
 * PPT Generator (pptxgenjs) - Web-adapted version
 * Adapted from vtrack-ppt-generator/src/ppt/generator.ts
 * Key changes: returns Buffer instead of saving file
 */
import PptxGenJS from 'pptxgenjs';
import type { ReportData } from './types';
import { FONTS } from './config';
import {
  formatBillionKRW,
  formatPercent,
  formatNumber,
  getCurrencySymbol,
} from './format';

const SLIDE_WIDTH = 13.333;
const SLIDE_HEIGHT = 7.5;

const BRAND = {
  main: '97C11F',
  light: 'B4D94D',
  mid: '6E9A00',
  dark: '235000',
  deep: '122400',
};

const UI = {
  textMain: '1A1A1A',
  textSub: '555555',
  bgSlide: 'FFFFFF',
  bgLightGray: 'F8F9FA',
  border: 'E9ECEF',
  danger: 'E11D48',
  warning: 'F59E0B',
  success: '10B981',
  info: '3B82F6',
};

const SLIDE_MASTER = {
  title: 'HUXEED_MASTER',
  background: { color: UI.bgSlide },
};

const ROWS_PER_PAGE = {
  highRevenue: 12,
  supplierStatus: 10,
  costAnalysis: 2,
  ownerDistribution: 11,
  detailTable: 12,
};


function calculateTotalPages(data: ReportData): number {
  let total = 8;
  total += Math.ceil(data.highRevenueProducts.items.length / ROWS_PER_PAGE.highRevenue) || 1;
  total += Math.ceil(data.supplierStatus.products.length / ROWS_PER_PAGE.supplierStatus) || 1;
  total += Math.ceil(data.costAnalysis.products.length / ROWS_PER_PAGE.costAnalysis) || 1;
  total += Math.ceil(data.ownerDistribution.owners.length / ROWS_PER_PAGE.ownerDistribution) || 1;
  total += Math.ceil(data.detailTable.items.length / ROWS_PER_PAGE.detailTable) || 1;
  total += data.actionItems.totalPages || 1;
  return total;
}

export function generatePpt(data: ReportData): PptxGenJS {
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'HUXEED V-track';
  pptx.title = data.cover.title;
  pptx.subject = data.cover.reportMonth + ' 보고서';
  pptx.company = 'HUXEED';

  pptx.defineSlideMaster({
    title: SLIDE_MASTER.title,
    background: SLIDE_MASTER.background,
  });

  const totalPages = calculateTotalPages(data);
  let currentPage = 1;

  addCoverSlide(pptx, data);
  currentPage++;

  addIndexSlide(pptx, data, currentPage, totalPages);
  currentPage++;

  addKpiSummarySlide(pptx, data, currentPage, totalPages);
  currentPage++;

  currentPage = addHighRevenueSlides(pptx, data, currentPage, totalPages);

  addStrategyProgressSlide(pptx, data, currentPage, totalPages);
  currentPage++;

  addStageFunnelSlide(pptx, data, currentPage, totalPages);
  currentPage++;

  addAccountProgressSlide(pptx, data, currentPage, totalPages);
  currentPage++;

  addSavingTop10Slide(pptx, data, currentPage, totalPages);
  currentPage++;

  currentPage = addSupplierStatusSlides(pptx, data, currentPage, totalPages);
  currentPage = addCostAnalysisSlides(pptx, data, currentPage, totalPages);
  currentPage = addOwnerDistributionSlides(pptx, data, currentPage, totalPages);
  currentPage = addDetailTableSlides(pptx, data, currentPage, totalPages);
  currentPage = addActionItemsSlides(pptx, data, currentPage, totalPages);

  addClosingSlide(pptx, data, currentPage, totalPages);

  return pptx;
}

/**
 * Generate PPT as a Node.js Buffer (for HTTP response)
 */
export async function generatePptBuffer(data: ReportData): Promise<Buffer> {
  const pptx = generatePpt(data);
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}

// ============ Slide Functions ============

function addCoverSlide(pptx: PptxGenJS, data: ReportData): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
  slide.background = { color: BRAND.deep };

  slide.addShape('ellipse', {
    x: 8, y: 3, w: 8, h: 8,
    fill: { color: BRAND.mid, transparency: 70 },
  });


  slide.addShape('rect', {
    x: 0.8, y: 2.3, w: 0.6, h: 0.06,
    fill: { color: BRAND.light },
  });

  slide.addText('V-TRACK REPORT', {
    x: 1.5, y: 2.15, w: 4, h: 0.4,
    fontSize: 16, bold: true, color: BRAND.light,
    fontFace: FONTS.heading,
  });

  slide.addText(data.cover.title, {
    x: 0.8, y: 2.7, w: 10, h: 1.4,
    fontSize: 54, bold: true, color: 'FFFFFF',
    fontFace: FONTS.heading,
  });

  slide.addText(data.cover.subtitle, {
    x: 0.8, y: 4.1, w: 10, h: 0.6,
    fontSize: 22, color: 'FFFFFF',
    fontFace: FONTS.body,
  });

  slide.addShape('rect', {
    x: 0.8, y: 5.2, w: 0.08, h: 1.2,
    fill: { color: BRAND.main },
  });

  slide.addShape('rect', {
    x: 0.88, y: 5.2, w: 5, h: 1.2,
    fill: { color: '000000', transparency: 80 },
  });

  slide.addText([
    { text: `${data.cover.reportMonth} 보고서\n`, options: { fontSize: 14, color: 'FFFFFF', bold: true } },
    { text: `생성일: ${data.cover.generatedDate}`, options: { fontSize: 12, color: 'CCCCCC' } },
  ], {
    x: 1.1, y: 5.35, w: 4.5, h: 1,
    fontFace: FONTS.body,
  });

  slide.addText('기획전략실', {
    x: 10.5, y: 6.8, w: 2.5, h: 0.4,
    fontSize: 12, color: BRAND.light, align: 'right',
    fontFace: FONTS.body,
  });
}

function addIndexSlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, 'Index', '보고서 구성');
  addSlideFooter(slide, pageNum, totalPages);

  const indexItems = [
    { num: '01', title: 'Executive Summary', desc: '핵심 KPI 요약' },
    { num: '02', title: '예상매출 5억+ 제품', desc: '고부가가치 제품 리스트' },
    { num: '03', title: '3대 전략 현황', desc: 'White Space / Erdosteine / S·P' },
    { num: '04', title: '단계별 현황', desc: '12단계 퍼널 분석' },
    { num: '05', title: '거래처별 진행률', desc: 'Top 10 진척률' },
    { num: '06', title: '절감액 Top 10', desc: '원가절감 성과' },
    { num: '07', title: '제조원 현황', desc: 'DMF/연계심사 현황' },
    { num: '08', title: '소싱 원가 분석', desc: '품목별 이익률' },
    { num: '09', title: '담당자별 현황', desc: '담당자별 실적' },
  ];

  const cardW = 3.8;
  const cardH = 1.5;
  const gapX = 0.4;
  const gapY = 0.3;
  const startX = 0.6;
  const startY = 1.4;

  indexItems.forEach((item, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape('rect', {
      x, y, w: cardW, h: cardH,
      fill: { color: UI.bgSlide },
      line: { color: UI.border, pt: 1 },
      shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.1 },
    });

    slide.addText(item.num, {
      x: x + cardW - 1.2, y: y + 0.1, w: 1, h: 0.8,
      fontSize: 36, bold: true, color: 'E0E0E0', align: 'right',
      fontFace: FONTS.heading,
    });

    slide.addText(item.title, {
      x: x + 0.2, y: y + 0.3, w: cardW - 0.4, h: 0.5,
      fontSize: 14, bold: true, color: BRAND.deep,
      fontFace: FONTS.heading,
    });

    slide.addText(item.desc, {
      x: x + 0.2, y: y + 0.85, w: cardW - 0.4, h: 0.4,
      fontSize: 11, color: UI.textSub,
      fontFace: FONTS.body,
    });
  });
}

function addKpiSummarySlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, 'Executive Summary', '신규품목 활성화 핵심 지표');
  addSlideFooter(slide, pageNum, totalPages);

  const kpiData = data.kpiSummary;

  const kpiCards = [
    { label: '평균 진척률', value: formatPercent(kpiData.avgProgress), unit: '' },
    { label: '완료 건수', value: String(kpiData.completedTargets), unit: '건' },
    { label: 'Target 매출액', value: formatBillionKRW(kpiData.targetRevenue), unit: '' },
    { label: '전략 달성률', value: formatPercent(kpiData.achievementRate), unit: '' },
  ];

  const cardW = 2.9;
  const cardH = 1.4;
  const startX = 0.6;
  const startY = 1.3;
  const gap = 0.35;

  kpiCards.forEach((card, idx) => {
    const x = startX + idx * (cardW + gap);

    slide.addShape('rect', {
      x, y: startY, w: cardW, h: cardH,
      fill: { color: UI.bgSlide },
      line: { color: UI.border, pt: 1 },
      shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.1 },
    });

    slide.addShape('ellipse', {
      x: x + cardW - 0.7, y: startY + 0.15, w: 0.5, h: 0.5,
      fill: { color: BRAND.main, transparency: 85 },
    });

    slide.addText(card.label, {
      x: x + 0.2, y: startY + 0.15, w: cardW - 0.5, h: 0.35,
      fontSize: 12, color: UI.textSub, fontFace: FONTS.body,
    });

    slide.addText(card.value + card.unit, {
      x: x + 0.2, y: startY + 0.5, w: cardW - 0.4, h: 0.7,
      fontSize: 28, bold: true, color: BRAND.deep, fontFace: FONTS.heading,
    });
  });

  const tableData = [
    ['항목', '수치', '비고'],
    ['전체 등록 품목 수', `${kpiData.totalTargets}건`, '활성화 대상 전체'],
    ['완료(WON) 품목 수', `${kpiData.completedTargets}건`, '활성화 성공'],
    ['Target 매출액 합계', formatBillionKRW(kpiData.targetRevenue), '전체 예상매출'],
    ['달성 매출액', formatBillionKRW(kpiData.achievedRevenue), 'WON 단계 합계'],
  ];

  addModernTable(slide, tableData, 0.6, 3.0, [4.5, 3.5, 4]);
}

function addHighRevenueSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const items = data.highRevenueProducts.items;
  const rowsPerPage = ROWS_PER_PAGE.highRevenue;
  const pageCount = Math.ceil(items.length / rowsPerPage) || 1;

  for (let page = 0; page < pageCount; page++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageItems = items.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const subtitle = pageCount > 1
      ? `총 ${data.highRevenueProducts.totalCount}건 | ${formatBillionKRW(data.highRevenueProducts.totalRevenue)} (${page + 1}/${pageCount})`
      : `총 ${data.highRevenueProducts.totalCount}건 | ${formatBillionKRW(data.highRevenueProducts.totalRevenue)}`;

    addSlideHeader(slide, '예상매출 5억 이상 제품 리스트', subtitle);
    addSlideFooter(slide, startPage + page, totalPages);

    const tableData = [
      ['순위', '거래처', '품목', '수량(kg)', '예상매출', '단계'],
      ...pageItems.map((item) => [
        String(item.rank),
        item.accountName,
        item.productName,
        formatNumber(item.quantity),
        formatBillionKRW(item.estRevenue),
        item.stageName,
      ]),
    ];

    addModernTable(slide, tableData, 0.6, 1.3, [0.8, 3, 3, 1.5, 2, 1.7]);
  }

  return startPage + pageCount;
}

function addStrategyProgressSlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, '3대 전략 달성 현황', 'White Space / Erdosteine / S·P 세그먼트');
  addSlideFooter(slide, pageNum, totalPages);

  const strategies = [
    { data: data.strategyProgress.whiteSpace, x: 0.6 },
    { data: data.strategyProgress.erdosteine, x: 4.7 },
    { data: data.strategyProgress.spSegment, x: 8.8 },
  ];

  strategies.forEach(({ data: s, x }) => {
    addStrategyCard(slide, x, 1.3, s);
  });
}

function addStageFunnelSlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, '단계별 진행 현황 (12단계)', `전체 ${data.stageFunnel.totalCount}건`);
  addSlideFooter(slide, pageNum, totalPages);

  const funnelColors = [
    '6E9A00', '608800', '537700', '466600', '3D5A00', '345000',
    '2C4400', '253A00', '1E3000', '172600', '101C00', '10B981',
  ];

  const centerX = SLIDE_WIDTH / 2;
  const startY = 1.35;
  const stepH = 0.42;

  data.stageFunnel.stages.forEach((stage, idx) => {
    const y = startY + idx * stepH;
    const widthPercent = 100 - idx * 4;
    const barW = (widthPercent / 100) * 10;
    const x = centerX - barW / 2;

    slide.addShape('rect', {
      x, y, w: barW, h: stepH - 0.05,
      fill: { color: funnelColors[idx] || BRAND.mid },
    });

    slide.addText(stage.stageName, {
      x: x + 0.2, y, w: 2, h: stepH - 0.05,
      fontSize: 10, bold: true, color: 'FFFFFF', valign: 'middle',
      fontFace: FONTS.body,
    });

    slide.addText(`${stage.count}건 (${formatPercent(stage.percentage)})`, {
      x: x + barW - 2.2, y, w: 2, h: stepH - 0.05,
      fontSize: 10, bold: true, color: 'FFFFFF', valign: 'middle', align: 'right',
      fontFace: FONTS.body,
    });
  });
}

function addAccountProgressSlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, '거래처별 진행률 Top 10', '평균 진척률 기준');
  addSlideFooter(slide, pageNum, totalPages);

  const startY = 1.4;
  const barH = 0.4;
  const gap = 0.12;
  const labelW = 2.5;
  const barMaxW = 8;
  const valueW = 1;

  data.accountProgress.accounts.forEach((account, idx) => {
    const y = startY + idx * (barH + gap);

    slide.addText(account.accountName, {
      x: 0.6, y, w: labelW, h: barH,
      fontSize: 11, color: UI.textMain, valign: 'middle',
      fontFace: FONTS.body,
    });

    slide.addShape('rect', {
      x: 0.6 + labelW + 0.2, y: y + 0.05, w: barMaxW, h: barH - 0.1,
      fill: { color: UI.border },
    });

    const fillW = (account.avgProgress / 100) * barMaxW;
    slide.addShape('rect', {
      x: 0.6 + labelW + 0.2, y: y + 0.05, w: fillW, h: barH - 0.1,
      fill: { color: BRAND.main },
    });

    slide.addText(formatPercent(account.avgProgress), {
      x: 0.6 + labelW + 0.2 + barMaxW + 0.2, y, w: valueW, h: barH,
      fontSize: 11, bold: true, color: BRAND.deep, valign: 'middle', align: 'right',
      fontFace: FONTS.body,
    });
  });
}

function addSavingTop10Slide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });

  addSlideHeader(slide, '절감액 Top 10', `총 절감액 ${formatBillionKRW(data.savingTop10.totalSaving)}`);
  addSlideFooter(slide, pageNum, totalPages);

  const tableData = [
    ['순위', '거래처', '품목', '절감액', '절감률'],
    ...data.savingTop10.items.map((item) => [
      String(item.rank),
      item.accountName,
      item.productName,
      formatBillionKRW(item.totalSaving),
      formatPercent(item.savingRate),
    ]),
  ];

  addModernTable(slide, tableData, 0.6, 1.3, [0.8, 3.5, 3.5, 2.2, 2]);
}

function addSupplierStatusSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const products = data.supplierStatus.products;
  const rowsPerPage = ROWS_PER_PAGE.supplierStatus;
  const pageCount = Math.ceil(products.length / rowsPerPage) || 1;

  for (let page = 0; page < pageCount; page++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageItems = products.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const subtitle = pageCount > 1
      ? `품목별 제조원 등록 및 DMF/연계심사 현황 (${page + 1}/${pageCount})`
      : '품목별 제조원 등록 및 DMF/연계심사 현황';

    addSlideHeader(slide, '제조원 등록 현황', subtitle);
    addSlideFooter(slide, startPage + page, totalPages);

    let tableY = 1.3;

    if (page === 0) {
      const summary = data.supplierStatus.summary;
      const summaryItems = [
        { label: '전체 품목', value: String(summary.totalProducts) },
        { label: '등록 완료', value: String(summary.productsWithSuppliers) },
        { label: '등록률', value: formatPercent(summary.coverageRate) },
        { label: 'DMF 등록률', value: formatPercent(summary.avgDmfRate) },
      ];

      const cardW = 2.8;
      summaryItems.forEach((item, idx) => {
        const x = 0.6 + idx * (cardW + 0.3);
        slide.addShape('rect', {
          x, y: 1.3, w: cardW, h: 0.9,
          fill: { color: UI.bgLightGray },
          line: { color: UI.border, pt: 1 },
        });
        slide.addText(item.value, {
          x, y: 1.35, w: cardW, h: 0.5,
          fontSize: 22, bold: true, color: BRAND.deep, align: 'center',
          fontFace: FONTS.heading,
        });
        slide.addText(item.label, {
          x, y: 1.85, w: cardW, h: 0.3,
          fontSize: 10, color: UI.textSub, align: 'center',
          fontFace: FONTS.body,
        });
      });
      tableY = 2.4;
    }

    const tableData = [
      ['품목명', '제조원 수', 'DMF 등록', '연계심사 완료', '상태'],
      ...pageItems.map((p) => [
        p.productName,
        `${p.supplierCount}개사`,
        `${p.dmfCount}/${p.supplierCount} (${formatPercent(p.dmfRate)})`,
        `${p.linkageCompletedCount}/${p.supplierCount} (${formatPercent(p.linkageRate)})`,
        p.hasWarning ? '미등록' : 'OK',
      ]),
    ];

    addModernTable(slide, tableData, 0.6, tableY, [3.5, 1.8, 2.5, 2.5, 1.7]);
  }

  return startPage + pageCount;
}

function addCostAnalysisSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const products = data.costAnalysis.products;
  const itemsPerPage = ROWS_PER_PAGE.costAnalysis;
  const pageCount = Math.ceil(products.length / itemsPerPage) || 1;

  for (let page = 0; page < pageCount; page++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageItems = products.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const subtitle = `환율: $1 = ₩${formatNumber(data.costAnalysis.exchangeRates.USD)} (${page + 1}/${pageCount})`;

    addSlideHeader(slide, '소싱 원가 분석', subtitle);
    addSlideFooter(slide, startPage + page, totalPages);

    const cardW = 5.8;

    pageItems.forEach((product, idx) => {
      const x = 0.6 + idx * (cardW + 0.5);
      const y = 1.3;
      const cardH = 4.5;

      slide.addShape('rect', {
        x, y, w: cardW, h: cardH,
        fill: { color: UI.bgSlide },
        line: { color: UI.border, pt: 1 },
        shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.1 },
      });

      slide.addShape('rect', {
        x, y, w: cardW, h: 0.7,
        fill: { color: BRAND.deep },
      });

      slide.addText(product.productName, {
        x: x + 0.2, y: y + 0.15, w: cardW - 0.4, h: 0.4,
        fontSize: 14, bold: true, color: 'FFFFFF',
        fontFace: FONTS.heading,
      });

      const supplierInfo = `최저원가: ${product.lowestCostSupplier.supplierName} (${getCurrencySymbol(product.lowestCostSupplier.originalCurrency)}${formatNumber(product.lowestCostSupplier.originalPrice)} → ₩${formatNumber(product.lowestCostSupplier.costKrw)}/kg)`;

      slide.addShape('rect', {
        x: x + 0.2, y: y + 0.85, w: cardW - 0.4, h: 0.55,
        fill: { color: UI.bgLightGray },
      });

      slide.addShape('rect', {
        x: x + 0.2, y: y + 0.85, w: 0.08, h: 0.55,
        fill: { color: BRAND.mid },
      });

      slide.addText(supplierInfo, {
        x: x + 0.4, y: y + 0.9, w: cardW - 0.6, h: 0.45,
        fontSize: 10, color: UI.textSub, valign: 'middle',
        fontFace: FONTS.body,
      });

      const tableData = [
        ['거래처', '판매가', '이익률', '수량', '매출'],
        ...product.accounts.slice(0, 6).map((a) => [
          a.accountName,
          `₩${formatNumber(a.sellingPriceKrw)}`,
          formatPercent(a.profitMargin),
          formatNumber(a.quantity),
          formatBillionKRW(a.estRevenue),
        ]),
      ];

      addCompactTable(slide, tableData, x + 0.15, y + 1.5, [1.6, 1.1, 0.9, 0.9, 1.1]);
    });

    slide.addText('※ 이익률 = (판매단가 - 원가) / 판매단가 × 100', {
      x: 0.6, y: 6.2, w: 12, h: 0.3,
      fontSize: 9, color: UI.textSub,
      fontFace: FONTS.body,
    });
  }

  return startPage + pageCount;
}

function addOwnerDistributionSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const owners = data.ownerDistribution.owners;
  const rowsPerPage = ROWS_PER_PAGE.ownerDistribution;
  const pageCount = Math.ceil(owners.length / rowsPerPage) || 1;

  for (let page = 0; page < pageCount; page++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageItems = owners.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const subtitle = pageCount > 1
      ? `전체 ${data.ownerDistribution.totalCount}건 (${page + 1}/${pageCount})`
      : `전체 ${data.ownerDistribution.totalCount}건`;

    addSlideHeader(slide, '담당자별 현황', subtitle);
    addSlideFooter(slide, startPage + page, totalPages);

    const tableData = [
      ['담당자', '품목수', '평균진행률', '완료건수', '예상매출'],
      ...pageItems.map((o) => [
        o.ownerName,
        `${o.targetCount}건`,
        formatPercent(o.avgProgress),
        `${o.completedCount}건`,
        formatBillionKRW(o.totalRevenue),
      ]),
    ];

    addModernTable(slide, tableData, 0.6, 1.3, [3, 1.8, 2.2, 1.8, 3.2]);
  }

  return startPage + pageCount;
}

function addDetailTableSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const items = data.detailTable.items;
  const rowsPerPage = ROWS_PER_PAGE.detailTable;
  const pageCount = Math.ceil(items.length / rowsPerPage) || 1;

  for (let page = 0; page < pageCount; page++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageItems = items.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    addSlideHeader(slide, '전체 품목 상세 현황', `총 ${items.length}건 (${page + 1}/${pageCount})`);
    addSlideFooter(slide, startPage + page, totalPages);

    const tableData = [
      ['거래처', '품목', '담당자', '단계', '진행률', '예상매출', '세그'],
      ...pageItems.map((item) => [
        item.accountName,
        item.productName,
        item.ownerName,
        item.stageName,
        formatPercent(item.progress),
        formatBillionKRW(item.estRevenue),
        item.segment,
      ]),
    ];

    addModernTable(slide, tableData, 0.6, 1.3, [2.2, 2.2, 1.5, 1.8, 1.2, 1.8, 1.3]);
  }

  return startPage + pageCount;
}

function addActionItemsSlides(pptx: PptxGenJS, data: ReportData, startPage: number, totalPages: number): number {
  const pages = data.actionItems.pages;
  const pageCount = pages.length || 1;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
    const pageData = pages[pageIdx];

    const subtitle = pageCount > 1
      ? `우선 처리 필요 사항 (${pageIdx + 1}/${pageCount})`
      : '우선 처리 필요 사항';

    addSlideHeader(slide, '액션 아이템', subtitle);
    addSlideFooter(slide, startPage + pageIdx, totalPages);

    const colW = 5.8;

    slide.addText('긴급 - 소싱요청 대기 (5억+)', {
      x: 0.6, y: 1.3, w: colW, h: 0.45,
      fontSize: 14, bold: true, color: UI.danger,
      fontFace: FONTS.heading,
    });

    slide.addShape('rect', {
      x: 0.6, y: 1.75, w: colW, h: 0.05,
      fill: { color: UI.danger },
    });

    if (pageData.highPriority.length > 0) {
      pageData.highPriority.slice(0, 5).forEach((item, idx) => {
        const y = 1.95 + idx * 0.85;
        addActionCard(slide, 0.6, y, colW, item.accountName, item.productName, item.issue, UI.danger);
      });
    } else {
      slide.addText('해당 항목 없음', {
        x: 0.6, y: 2.0, w: colW, h: 0.4,
        fontSize: 11, color: UI.textSub, fontFace: FONTS.body,
      });
    }

    slide.addText('주의 - 소싱완료 후 대기 (7일+)', {
      x: 6.9, y: 1.3, w: colW, h: 0.45,
      fontSize: 14, bold: true, color: UI.warning,
      fontFace: FONTS.heading,
    });

    slide.addShape('rect', {
      x: 6.9, y: 1.75, w: colW, h: 0.05,
      fill: { color: UI.warning },
    });

    if (pageData.mediumPriority.length > 0) {
      pageData.mediumPriority.slice(0, 5).forEach((item, idx) => {
        const y = 1.95 + idx * 0.85;
        addActionCard(slide, 6.9, y, colW, item.accountName, item.productName, item.issue, UI.warning);
      });
    } else {
      slide.addText('해당 항목 없음', {
        x: 6.9, y: 2.0, w: colW, h: 0.4,
        fontSize: 11, color: UI.textSub, fontFace: FONTS.body,
      });
    }
  }

  return startPage + pageCount;
}

function addClosingSlide(pptx: PptxGenJS, data: ReportData, pageNum: number, totalPages: number): void {
  const slide = pptx.addSlide({ masterName: SLIDE_MASTER.title });
  slide.background = { color: BRAND.deep };

  slide.addText('감사합니다', {
    x: 0, y: 2.5, w: SLIDE_WIDTH, h: 1.2,
    fontSize: 64, bold: true, color: 'FFFFFF', align: 'center',
    fontFace: FONTS.heading,
  });

  slide.addText('Thank You', {
    x: 0, y: 3.7, w: SLIDE_WIDTH, h: 0.6,
    fontSize: 28, color: 'FFFFFF', align: 'center',
    transparency: 50,
    fontFace: FONTS.body,
  });

  slide.addShape('rect', {
    x: SLIDE_WIDTH / 2 - 0.6, y: 4.5, w: 1.2, h: 0.08,
    fill: { color: BRAND.main },
  });

  slide.addText('기획전략실', {
    x: 0, y: 5.0, w: SLIDE_WIDTH, h: 0.5,
    fontSize: 18, bold: true, color: BRAND.main, align: 'center',
    fontFace: FONTS.heading,
  });


  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 11.5, y: 6.8, w: 1.5, h: 0.4,
    fontSize: 10, color: 'FFFFFF', align: 'right',
    transparency: 50,
    fontFace: FONTS.body,
  });
}

// ============ Utility Functions ============

function addSlideHeader(slide: PptxGenJS.Slide, title: string, subtitle?: string): void {
  slide.addShape('rect', {
    x: 0, y: 0, w: SLIDE_WIDTH, h: 1.15,
    fill: { color: UI.bgSlide },
  });

  slide.addShape('rect', {
    x: 0, y: 1.1, w: SLIDE_WIDTH, h: 0.05,
    fill: { color: BRAND.main },
  });

  slide.addText(title, {
    x: 0.6, y: 0.25, w: 10, h: 0.5,
    fontSize: 22, bold: true, color: BRAND.deep,
    fontFace: FONTS.heading,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6, y: 0.7, w: 10, h: 0.35,
      fontSize: 12, color: UI.textSub,
      fontFace: FONTS.body,
    });
  }

}

function addSlideFooter(slide: PptxGenJS.Slide, pageNum: number, totalPages: number): void {
  slide.addShape('rect', {
    x: 0, y: 6.85, w: SLIDE_WIDTH, h: 0.65,
    fill: { color: UI.bgLightGray },
  });

  slide.addText('HUXEED V-track', {
    x: 0.6, y: 7.0, w: 3, h: 0.35,
    fontSize: 10, color: UI.textSub,
    fontFace: FONTS.body,
  });

  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 11, y: 7.0, w: 2, h: 0.35,
    fontSize: 10, color: UI.textSub, align: 'right',
    fontFace: FONTS.body,
  });
}

function addModernTable(
  slide: PptxGenJS.Slide,
  data: string[][],
  x: number,
  y: number,
  colW: number[]
): void {
  const rows: PptxGenJS.TableRow[] = data.map((row, rowIdx) => {
    return row.map((cell) => ({
      text: cell,
      options: {
        fill: { color: rowIdx === 0 ? 'F1F3F5' : UI.bgSlide },
        color: rowIdx === 0 ? BRAND.deep : UI.textMain,
        bold: rowIdx === 0,
        fontSize: rowIdx === 0 ? 11 : 10,
        fontFace: FONTS.body,
        border: { type: 'solid' as const, pt: 0.5, color: UI.border },
        valign: 'middle' as const,
      },
    }));
  });

  slide.addTable(rows, { x, y, colW, rowH: 0.42 });
}

function addCompactTable(
  slide: PptxGenJS.Slide,
  data: string[][],
  x: number,
  y: number,
  colW: number[]
): void {
  const rows: PptxGenJS.TableRow[] = data.map((row, rowIdx) => {
    return row.map((cell) => ({
      text: cell,
      options: {
        fill: { color: rowIdx === 0 ? 'F1F3F5' : UI.bgSlide },
        color: rowIdx === 0 ? BRAND.deep : UI.textMain,
        bold: rowIdx === 0,
        fontSize: 9,
        fontFace: FONTS.body,
        border: { type: 'solid' as const, pt: 0.5, color: UI.border },
        valign: 'middle' as const,
      },
    }));
  });

  slide.addTable(rows, { x, y, colW, rowH: 0.36 });
}

function addStrategyCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  data: {
    name: string;
    targetRevenue: number;
    achievedRevenue: number;
    achievementRate: number;
    targetCount: number;
    completedCount: number;
  }
): void {
  const cardW = 3.8;
  const cardH = 5.2;

  slide.addShape('rect', {
    x, y, w: cardW, h: cardH,
    fill: { color: UI.bgSlide },
    line: { color: UI.border, pt: 1 },
    shadow: { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.1 },
  });

  slide.addText(data.name, {
    x, y: y + 0.15, w: cardW, h: 0.5,
    fontSize: 16, bold: true, color: BRAND.deep, align: 'center',
    fontFace: FONTS.heading,
  });

  const pieX = x + cardW / 2;
  const pieY = y + 1.8;
  const pieR = 1.1;

  slide.addShape('ellipse', {
    x: pieX - pieR, y: pieY - pieR, w: pieR * 2, h: pieR * 2,
    fill: { color: UI.border },
  });

  if (data.achievementRate > 0) {
    slide.addShape('ellipse', {
      x: pieX - pieR, y: pieY - pieR, w: pieR * 2, h: pieR * 2,
      fill: { color: BRAND.main },
    });
  }

  slide.addShape('ellipse', {
    x: pieX - 0.75, y: pieY - 0.75, w: 1.5, h: 1.5,
    fill: { color: UI.bgSlide },
  });

  slide.addText(formatPercent(data.achievementRate), {
    x: pieX - 0.7, y: pieY - 0.35, w: 1.4, h: 0.5,
    fontSize: 22, bold: true, color: BRAND.deep, align: 'center',
    fontFace: FONTS.heading,
  });

  slide.addText('달성률', {
    x: pieX - 0.7, y: pieY + 0.15, w: 1.4, h: 0.3,
    fontSize: 10, color: UI.textSub, align: 'center',
    fontFace: FONTS.body,
  });

  const infoY = y + 3.2;
  const metrics = [
    { label: '목표 매출', value: formatBillionKRW(data.targetRevenue) },
    { label: '달성 매출', value: formatBillionKRW(data.achievedRevenue) },
    { label: '품목수', value: `${data.completedCount} / ${data.targetCount}` },
  ];

  slide.addShape('rect', {
    x: x + 0.2, y: infoY, w: cardW - 0.4, h: 1.7,
    fill: { color: UI.bgLightGray },
  });

  metrics.forEach((m, idx) => {
    const my = infoY + 0.15 + idx * 0.5;
    slide.addText(m.label, {
      x: x + 0.4, y: my, w: 1.8, h: 0.4,
      fontSize: 11, color: UI.textSub, fontFace: FONTS.body,
    });
    slide.addText(m.value, {
      x: x + 2.2, y: my, w: 1.4, h: 0.4,
      fontSize: 11, bold: true, color: UI.textMain, align: 'right',
      fontFace: FONTS.body,
    });
  });
}

function addActionCard(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  accountName: string,
  productName: string,
  issue: string,
  borderColor: string
): void {
  slide.addShape('rect', {
    x, y, w: 0.1, h: 0.75,
    fill: { color: borderColor },
  });

  slide.addShape('rect', {
    x: x + 0.1, y, w: w - 0.1, h: 0.75,
    fill: { color: UI.bgSlide },
    shadow: { type: 'outer', blur: 2, offset: 1, angle: 45, opacity: 0.05 },
  });

  slide.addText(`${accountName} / ${productName}`, {
    x: x + 0.25, y: y + 0.08, w: w - 0.4, h: 0.35,
    fontSize: 11, bold: true, color: UI.textMain,
    fontFace: FONTS.body,
  });

  slide.addText(issue, {
    x: x + 0.25, y: y + 0.4, w: w - 0.4, h: 0.3,
    fontSize: 10, color: UI.textSub,
    fontFace: FONTS.body,
  });
}
