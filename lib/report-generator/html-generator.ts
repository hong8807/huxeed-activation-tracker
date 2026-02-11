/**
 * HTML 보고서 생성기
 * Adapted from vtrack-ppt-generator/src/html/generator.ts
 */
import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import type { ReportData } from './types';
import {
  formatCurrency,
  formatBillionKRW,
  formatPercent,
  formatNumber,
  formatKg,
  getCurrencySymbol,
} from './format';
import { COLORS, STAGES } from './config';

// Handlebars 헬퍼 등록
function registerHelpers(): void {
  Handlebars.registerHelper('formatCurrency', (value: number) => formatCurrency(value));
  Handlebars.registerHelper('formatBillion', (value: number) => formatBillionKRW(value));
  Handlebars.registerHelper('formatPercent', (value: number) => formatPercent(value));
  Handlebars.registerHelper('formatNumber', (value: number) => formatNumber(value));
  Handlebars.registerHelper('formatKg', (value: number) => formatKg(value));
  Handlebars.registerHelper('getCurrencySymbol', (currency: string) =>
    getCurrencySymbol(currency)
  );

  Handlebars.registerHelper('formatBillionNumber', (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    const billions = value / 100000000;
    return Math.round(billions).toLocaleString('ko-KR');
  });

  Handlebars.registerHelper('formatPercentNumber', (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return value.toFixed(1);
  });

  Handlebars.registerHelper('getStageBadgeClass', (stage: string) => {
    const stageClasses: Record<string, string> = {
      MARKET_RESEARCH: 'bg-warning',
      SOURCING_REQUEST: 'bg-warning',
      SOURCING_COMPLETED: 'bg-brand',
      QUOTE_SENT: 'bg-info',
      SAMPLE_SHIPPED: 'bg-info',
      QUALIFICATION: 'bg-info',
      DMF_RA_REVIEW: 'bg-dark',
      PRICE_AGREED: 'bg-dark',
      TRIAL_PO: 'bg-dark',
      REGISTRATION: 'bg-dark',
      COMMERCIAL_PO: 'bg-success',
      WON: 'bg-success',
      LOST: 'bg-danger',
      ON_HOLD: 'bg-warning',
    };
    return stageClasses[stage] || 'bg-dark';
  });

  Handlebars.registerHelper('getStageName', (stage: string) => {
    return STAGES[stage as keyof typeof STAGES]?.label || stage;
  });
  Handlebars.registerHelper('getStageColor', (stage: string) => {
    return COLORS.stages[stage as keyof typeof COLORS.stages] || COLORS.secondary;
  });
  Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
  Handlebars.registerHelper('divide', (a: number, b: number) => (b !== 0 ? a / b : 0));
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
  Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('ifCond', function (
    this: unknown,
    v1: unknown,
    operator: string,
    v2: unknown,
    options: Handlebars.HelperOptions
  ) {
    switch (operator) {
      case '==':
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case '===':
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '!=':
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case '!==':
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 as number) < (v2 as number)
          ? options.fn(this)
          : options.inverse(this);
      case '<=':
        return (v1 as number) <= (v2 as number)
          ? options.fn(this)
          : options.inverse(this);
      case '>':
        return (v1 as number) > (v2 as number)
          ? options.fn(this)
          : options.inverse(this);
      case '>=':
        return (v1 as number) >= (v2 as number)
          ? options.fn(this)
          : options.inverse(this);
      default:
        return options.inverse(this);
    }
  });
  Handlebars.registerHelper('range', function (count: number) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(i);
    }
    return result;
  });
  Handlebars.registerHelper('slice', function (arr: unknown[], start: number, end: number) {
    return arr.slice(start, end);
  });
  Handlebars.registerHelper('json', function (context: unknown) {
    return JSON.stringify(context, null, 2);
  });
  Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
  Handlebars.registerHelper('add', (a: number, b: number) => a + b);
}

/**
 * HTML 보고서 생성
 */
export function generateHtml(data: ReportData, templatePath?: string): string {
  registerHelpers();

  const defaultTemplatePath = path.join(process.cwd(), 'lib/report-generator/templates/base.html');
  const actualTemplatePath = templatePath || defaultTemplatePath;

  if (!fs.existsSync(actualTemplatePath)) {
    throw new Error(`Template file not found: ${actualTemplatePath}`);
  }

  const templateSource = fs.readFileSync(actualTemplatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);

  return template(data);
}
