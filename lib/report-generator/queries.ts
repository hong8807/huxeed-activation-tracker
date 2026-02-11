/**
 * Supabase data queries for report generation
 * Adapted from vtrack-ppt-generator/src/data/queries.ts
 * Key change: accepts SupabaseClient as parameter instead of singleton import
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Target, Supplier, StageHistory } from './types';

export async function fetchAllTargets(supabase: SupabaseClient): Promise<Target[]> {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .order('our_est_revenue_krw', { ascending: false });

  if (error) {
    console.error('Error fetching targets:', error);
    throw error;
  }

  return data || [];
}

export async function fetchAllSuppliers(supabase: SupabaseClient): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('product_name', { ascending: true });

  if (error) {
    console.error('Error fetching suppliers:', error);
    throw error;
  }

  return data || [];
}

export async function fetchAllStageHistory(supabase: SupabaseClient): Promise<StageHistory[]> {
  const { data, error } = await supabase
    .from('stage_history')
    .select('*')
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Error fetching stage history:', error);
    throw error;
  }

  return data || [];
}
