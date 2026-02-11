/**
 * Report-specific format utility functions
 * Copied from vtrack-ppt-generator/src/utils/format.ts
 */

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMillionKRW(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const million = value / 1_000_000;
  if (million >= 100) {
    return `${Math.round(million).toLocaleString('ko-KR')}백만원`;
  }
  return `${million.toFixed(1)}백만원`;
}

export function formatBillionKRW(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const billion = value / 100_000_000;
  if (billion >= 10) {
    return `${Math.round(billion).toLocaleString('ko-KR')}억원`;
  }
  return `${billion.toFixed(1)}억원`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '-';
  const percent = Math.abs(value) > 1 ? value : value * 100;
  return `${percent.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('ko-KR');
}

export function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('ko-KR')}kg`;
}

export function formatDecimal(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '-';
  return value.toFixed(decimals);
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    CNY: '¥',
    JPY: '¥',
    KRW: '₩',
  };
  return symbols[currency] || currency;
}

export function formatForeignCurrency(
  value: number | null | undefined,
  currency: string
): string {
  if (value === null || value === undefined) return '-';
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}`;
}
