/**
 * Korea Eximbank Exchange Rate API Client
 * Adapted from vtrack-ppt-generator/src/data/exchange-rate.ts
 */
import { formatDateForApi, getKoreanDate } from './date';
import type { ExchangeRates } from './types';

const EXCHANGE_API_URL =
  'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON';

interface ExchangeApiResponse {
  result: number;
  cur_unit: string;
  cur_nm: string;
  ttb: string;
  tts: string;
  deal_bas_r: string;
}

export async function fetchExchangeRates(date?: Date): Promise<ExchangeRates> {
  const apiKey = process.env.EXCHANGE_API_KEY;
  if (!apiKey) {
    console.warn('EXCHANGE_API_KEY not found. Using default exchange rates.');
    return getDefaultRates();
  }

  const MAX_RETRIES = 7;
  const currentDate = date ? new Date(date) : getKoreanDate();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - attempt);

    // Skip weekends
    const dow = targetDate.getDay();
    if (dow === 0 || dow === 6) continue;

    const searchDate = formatDateForApi(targetDate);

    try {
      const url = `${EXCHANGE_API_URL}?authkey=${apiKey}&searchdate=${searchDate}&data=AP01`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Exchange API returned ${response.status} for ${searchDate}.`);
        continue;
      }

      const data: ExchangeApiResponse[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No exchange rate data for ${searchDate}. Trying previous day...`);
        continue;
      }

      console.log(`Exchange rates fetched successfully for date: ${searchDate}`);

      const rates: ExchangeRates = {
        USD: 1430.0,
        EUR: 1550.0,
        CNY: 196.0,
        JPY: 9.45,
        KRW: 1,
        timestamp: new Date().toISOString(),
      };

      for (const item of data) {
        const rate = parseFloat(item.deal_bas_r.replace(/,/g, ''));

        switch (item.cur_unit) {
          case 'USD':
            rates.USD = rate;
            break;
          case 'EUR':
            rates.EUR = rate;
            break;
          case 'CNH':
            rates.CNY = rate;
            break;
          case 'JPY(100)':
            rates.JPY = rate / 100;
            break;
        }
      }

      return rates;
    } catch (error) {
      console.error(`Error fetching exchange rates for ${searchDate}:`, error);
      continue;
    }
  }

  console.warn('All exchange rate fetch attempts failed. Using default rates.');
  return getDefaultRates();
}

function getDefaultRates(): ExchangeRates {
  return {
    USD: 1430.0,
    EUR: 1550.0,
    CNY: 196.0,
    JPY: 9.45,
    KRW: 1,
    timestamp: new Date().toISOString(),
  };
}

export function convertToKrw(
  amount: number,
  currency: string,
  rates: ExchangeRates
): number {
  if (currency === 'KRW') return amount;

  const rate = rates[currency as keyof ExchangeRates];
  if (typeof rate !== 'number') {
    console.warn(`Unknown currency: ${currency}. Using 1:1 conversion.`);
    return amount;
  }

  return amount * rate;
}

export function formatExchangeRate(currency: string, rates: ExchangeRates): string {
  if (currency === 'KRW') return '₩1';

  const symbols: Record<string, string> = {
    USD: '$1',
    EUR: '€1',
    CNY: '¥1',
    JPY: '¥1',
  };

  const rate = rates[currency as keyof ExchangeRates];
  if (typeof rate !== 'number') return '-';

  return `${symbols[currency] || currency} = ₩${rate.toLocaleString('ko-KR')}`;
}
