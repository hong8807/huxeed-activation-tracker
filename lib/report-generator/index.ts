/**
 * Report Generator Facade
 * Orchestrates data fetching, transformation, and report generation
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAllTargets, fetchAllSuppliers, fetchAllStageHistory } from './queries';
import { fetchExchangeRates } from './exchange-rate';
import { transformData } from './transform';
import { generatePptBuffer } from './ppt-generator';
import { generateHtml } from './html-generator';

interface ReportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

/**
 * Generate a report in the specified format
 */
export async function generateReport(
  supabase: SupabaseClient,
  format: 'ppt' | 'html'
): Promise<ReportResult> {
  // 1. Fetch data in parallel
  const [targets, suppliers, stageHistory, exchangeRates] = await Promise.all([
    fetchAllTargets(supabase),
    fetchAllSuppliers(supabase),
    fetchAllStageHistory(supabase),
    fetchExchangeRates(),
  ]);

  // 2. Transform data
  const reportData = transformData(targets, suppliers, stageHistory, exchangeRates);

  // 3. Generate report based on format
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'ppt') {
    const buffer = await generatePptBuffer(reportData);

    return {
      buffer,
      filename: `HUXEED_Report_${dateStr}.pptx`,
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
  }

  // HTML format
  const html = generateHtml(reportData);
  const buffer = Buffer.from(html, 'utf-8');

  return {
    buffer,
    filename: `HUXEED_Report_${dateStr}.html`,
    contentType: 'text/html; charset=utf-8',
  };
}
