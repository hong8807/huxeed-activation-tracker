export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          target_id: string | null
          product_name: string
          supplier_name: string | null
          created_by_name: string | null  // v2.5: 입력자명
          currency: string | null
          unit_price_foreign: number | null
          fx_rate: number | null
          tariff_rate: number | null  // v2.5: 관세율 (%)
          additional_cost_rate: number | null  // v2.5: 부대비용율 (%)
          unit_price_krw: number | null
          dmf_registered: boolean | null
          linkage_status: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          target_id?: string | null
          product_name: string
          supplier_name?: string | null
          created_by_name?: string | null  // v2.5: 입력자명
          currency?: string | null
          unit_price_foreign?: number | null
          fx_rate?: number | null
          tariff_rate?: number | null  // v2.5: 관세율 (%)
          additional_cost_rate?: number | null  // v2.5: 부대비용율 (%)
          unit_price_krw?: number | null
          dmf_registered?: boolean | null
          linkage_status?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          target_id?: string | null
          product_name?: string
          supplier_name?: string | null
          created_by_name?: string | null  // v2.5: 입력자명
          currency?: string | null
          unit_price_foreign?: number | null
          fx_rate?: number | null
          tariff_rate?: number | null  // v2.5: 관세율 (%)
          additional_cost_rate?: number | null  // v2.5: 부대비용율 (%)
          unit_price_krw?: number | null
          dmf_registered?: boolean | null
          linkage_status?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      targets: {
        Row: {
          id: string
          year: number | null
          account_name: string | null
          product_name: string | null
          est_qty_kg: number | null
          owner_name: string | null
          sales_2025_krw: number | null

          // 거래처 현재 매입가
          curr_currency: string | null
          curr_unit_price_foreign: number | null
          curr_fx_rate_input: number | null
          curr_tariff_rate: number | null  // v2.10: 현재매입 관세율 (%)
          curr_additional_cost_rate: number | null  // v2.10: 현재매입 부대비용율 (%)
          curr_unit_price_krw: number | null
          curr_total_krw: number | null

          // 우리 예상 판매가
          our_currency: string | null
          our_unit_price_foreign: number | null
          our_fx_rate_input: number | null
          our_tariff_rate: number | null  // v2.10: 우리예상 관세율 (%)
          our_additional_cost_rate: number | null  // v2.10: 우리예상 부대비용율 (%)
          our_unit_price_krw: number | null
          our_est_revenue_krw: number | null

          // 절감 지표
          saving_per_kg: number | null
          total_saving_krw: number | null
          saving_rate: number | null

          // 진도관리
          current_stage: string | null
          stage_updated_at: string | null
          stage_progress_rate: number | null

          // 거래처 세그먼트
          segment: string | null

          note: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year?: number | null
          account_name?: string | null
          product_name?: string | null
          est_qty_kg?: number | null
          owner_name?: string | null
          sales_2025_krw?: number | null
          curr_currency?: string | null
          curr_unit_price_foreign?: number | null
          curr_fx_rate_input?: number | null
          curr_tariff_rate?: number | null  // v2.10
          curr_additional_cost_rate?: number | null  // v2.10
          curr_unit_price_krw?: number | null
          curr_total_krw?: number | null
          our_currency?: string | null
          our_unit_price_foreign?: number | null
          our_fx_rate_input?: number | null
          our_tariff_rate?: number | null  // v2.10
          our_additional_cost_rate?: number | null  // v2.10
          our_unit_price_krw?: number | null
          our_est_revenue_krw?: number | null
          saving_per_kg?: number | null
          total_saving_krw?: number | null
          saving_rate?: number | null
          current_stage?: string | null
          stage_updated_at?: string | null
          stage_progress_rate?: number | null
          segment?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          year?: number | null
          account_name?: string | null
          product_name?: string | null
          est_qty_kg?: number | null
          owner_name?: string | null
          sales_2025_krw?: number | null
          curr_currency?: string | null
          curr_unit_price_foreign?: number | null
          curr_fx_rate_input?: number | null
          curr_tariff_rate?: number | null  // v2.10
          curr_additional_cost_rate?: number | null  // v2.10
          curr_unit_price_krw?: number | null
          curr_total_krw?: number | null
          our_currency?: string | null
          our_unit_price_foreign?: number | null
          our_fx_rate_input?: number | null
          our_tariff_rate?: number | null  // v2.10
          our_additional_cost_rate?: number | null  // v2.10
          our_unit_price_krw?: number | null
          our_est_revenue_krw?: number | null
          saving_per_kg?: number | null
          total_saving_krw?: number | null
          saving_rate?: number | null
          current_stage?: string | null
          stage_updated_at?: string | null
          stage_progress_rate?: number | null
          segment?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stage_history: {
        Row: {
          id: string
          target_id: string | null
          stage: string | null
          changed_at: string
          actor_name: string | null
          comment: string | null
        }
        Insert: {
          id?: string
          target_id?: string | null
          stage?: string | null
          changed_at?: string
          actor_name?: string | null
          comment?: string | null
        }
        Update: {
          id?: string
          target_id?: string | null
          stage?: string | null
          changed_at?: string
          actor_name?: string | null
          comment?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Target = Database['public']['Tables']['targets']['Row']
export type TargetInsert = Database['public']['Tables']['targets']['Insert']
export type TargetUpdate = Database['public']['Tables']['targets']['Update']

export type StageHistory = Database['public']['Tables']['stage_history']['Row']
export type StageHistoryInsert = Database['public']['Tables']['stage_history']['Insert']
export type StageHistoryUpdate = Database['public']['Tables']['stage_history']['Update']

export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']

// Stage enum
export enum Stage {
  MARKET_RESEARCH = 'MARKET_RESEARCH',
  SOURCING_REQUEST = 'SOURCING_REQUEST',
  SOURCING_COMPLETED = 'SOURCING_COMPLETED',
  QUOTE_SENT = 'QUOTE_SENT',
  SAMPLE_SHIPPED = 'SAMPLE_SHIPPED',
  QUALIFICATION = 'QUALIFICATION',
  DMF_RA_REVIEW = 'DMF_RA_REVIEW',
  PRICE_AGREED = 'PRICE_AGREED',
  TRIAL_PO = 'TRIAL_PO',
  REGISTRATION = 'REGISTRATION',
  COMMERCIAL_PO = 'COMMERCIAL_PO',
  WON = 'WON',
  LOST = 'LOST',
  ON_HOLD = 'ON_HOLD',
}

// Stage labels (Korean)
export const STAGE_LABELS: Record<Stage, string> = {
  [Stage.MARKET_RESEARCH]: '시장조사',
  [Stage.SOURCING_REQUEST]: '소싱요청',
  [Stage.SOURCING_COMPLETED]: '소싱완료',
  [Stage.QUOTE_SENT]: '견적발송',
  [Stage.SAMPLE_SHIPPED]: '샘플배송',
  [Stage.QUALIFICATION]: '품질테스트',
  [Stage.DMF_RA_REVIEW]: 'DMF/RA검토',
  [Stage.PRICE_AGREED]: '가격합의',
  [Stage.TRIAL_PO]: '시험PO',
  [Stage.REGISTRATION]: '완제연계심사중',
  [Stage.COMMERCIAL_PO]: '상업PO',
  [Stage.WON]: '완료',
  [Stage.LOST]: '실패',
  [Stage.ON_HOLD]: '보류',
}

// Stage progress rates (12단계)
export const STAGE_PROGRESS: Record<Stage, number> = {
  [Stage.MARKET_RESEARCH]: 0,
  [Stage.SOURCING_REQUEST]: 5,
  [Stage.SOURCING_COMPLETED]: 10,
  [Stage.QUOTE_SENT]: 20,
  [Stage.SAMPLE_SHIPPED]: 30,
  [Stage.QUALIFICATION]: 40,
  [Stage.DMF_RA_REVIEW]: 50,
  [Stage.PRICE_AGREED]: 60,
  [Stage.TRIAL_PO]: 70,
  [Stage.REGISTRATION]: 80,
  [Stage.COMMERCIAL_PO]: 90,
  [Stage.WON]: 100,
  [Stage.LOST]: 0,
  [Stage.ON_HOLD]: 50,
}
