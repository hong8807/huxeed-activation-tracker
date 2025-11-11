-- suppliers 테이블 생성 (제조원 정보)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES public.targets(id) ON DELETE CASCADE,

  -- 제조원 기본 정보
  supplier_name TEXT NOT NULL,

  -- 가격 정보
  currency TEXT NOT NULL,  -- USD, EUR, CNY, JPY, KRW
  unit_price_foreign NUMERIC NOT NULL,
  fx_rate NUMERIC NOT NULL,
  unit_price_krw NUMERIC NOT NULL,  -- 자동 계산

  -- DMF 및 연계심사 정보
  dmf_registered BOOLEAN DEFAULT false,  -- O/X
  linkage_status TEXT DEFAULT 'PREPARING',  -- PREPARING, IN_PROGRESS, COMPLETED

  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 복합 인덱스 (target_id로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_suppliers_target_id ON public.suppliers(target_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON public.suppliers
  FOR SELECT
  USING (true);

-- RLS 정책: 모든 사용자가 삽입 가능
CREATE POLICY "Enable insert for all users" ON public.suppliers
  FOR INSERT
  WITH CHECK (true);

-- RLS 정책: 모든 사용자가 업데이트 가능
CREATE POLICY "Enable update for all users" ON public.suppliers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS 정책: 모든 사용자가 삭제 가능
CREATE POLICY "Enable delete for all users" ON public.suppliers
  FOR DELETE
  USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
