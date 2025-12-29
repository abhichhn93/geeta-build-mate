-- Create ENUMs for draft system
CREATE TYPE draft_status AS ENUM (
  'DRAFT', 'NEEDS_CLARIFICATION', 'CONFIRMED', 'POSTED_TO_TALLY', 'REJECTED'
);

CREATE TYPE parse_source AS ENUM ('REGEX_RULE', 'LLM_FALLBACK', 'MANUAL_ENTRY');

CREATE TYPE product_category AS ENUM (
  'TMT', 'CEMENT', 'PIPE', 'STRUCTURAL', 'SHEET', 'WIRE', 'SERVICE'
);

-- GODOWNS table for multi-location inventory
CREATE TABLE public.godowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tally_guid TEXT UNIQUE,
  tally_name TEXT NOT NULL,
  canonical_id TEXT,
  app_alias TEXT,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.godowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view godowns" ON public.godowns
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage godowns" ON public.godowns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default godowns per spec
INSERT INTO public.godowns (tally_name, canonical_id, app_alias, aliases) VALUES
  ('Main Location', '7738', 'Calendar (Shop)', ARRAY['calendar', 'shop', 'dukan', 'counter', 'main', 'city', 'tiraha']),
  ('Sutrahi Godown', '7739', 'Sutrahi (Yard)', ARRAY['sutrahi', 'yard', 'godown', 'bada godown', 'site', 'bahar']);

-- PRODUCT ALIASES for regex matching
CREATE TABLE public.product_aliases (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  alias_term TEXT NOT NULL,
  priority INT DEFAULT 1
);

CREATE INDEX idx_product_aliases_term ON public.product_aliases (alias_term);
CREATE INDEX idx_product_aliases_product ON public.product_aliases (product_id);

ALTER TABLE public.product_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product aliases" ON public.product_aliases
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage product aliases" ON public.product_aliases
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- INVENTORY SNAPSHOT for quick stock lookup by godown
CREATE TABLE public.inventory_snapshot (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  godown_id UUID NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
  closing_balance_qty NUMERIC(12,3) DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (product_id, godown_id)
);

ALTER TABLE public.inventory_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view inventory" ON public.inventory_snapshot
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.inventory_snapshot
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- DRAFT CARDS - state machine for all voice/text commands
CREATE TABLE public.draft_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  raw_input TEXT,
  intent TEXT NOT NULL,
  parse_source parse_source NOT NULL,
  parse_confidence REAL NOT NULL DEFAULT 0,
  parsed_json JSONB NOT NULL,
  status draft_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_draft_cards_status ON public.draft_cards (status);
CREATE INDEX idx_draft_cards_created ON public.draft_cards (created_at DESC);
CREATE INDEX idx_draft_cards_user ON public.draft_cards (user_id);

ALTER TABLE public.draft_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts" ON public.draft_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create drafts" ON public.draft_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON public.draft_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all drafts" ON public.draft_cards
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- DRAFT CLARIFICATIONS - what user must answer
CREATE TABLE public.draft_clarifications (
  id BIGSERIAL PRIMARY KEY,
  draft_id UUID NOT NULL REFERENCES public.draft_cards(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_draft_clarifications_draft ON public.draft_clarifications (draft_id);
CREATE INDEX idx_draft_clarifications_resolved ON public.draft_clarifications (resolved);

ALTER TABLE public.draft_clarifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clarifications for own drafts" ON public.draft_clarifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.draft_cards WHERE id = draft_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update clarifications for own drafts" ON public.draft_clarifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.draft_cards WHERE id = draft_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all clarifications" ON public.draft_clarifications
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ROUTING RULES for godown defaults
CREATE TABLE public.routing_rules (
  id BIGSERIAL PRIMARY KEY,
  category product_category NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('INWARD', 'OUTWARD')),
  condition_json JSONB NOT NULL,
  default_godown_canonical_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('DEFAULT', 'ASK_USER', 'FORCE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view routing rules" ON public.routing_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage routing rules" ON public.routing_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default routing rules per spec
INSERT INTO public.routing_rules (category, direction, condition_json, default_godown_canonical_id, action) VALUES
  ('CEMENT', 'INWARD', '{}', '7739', 'DEFAULT'),
  ('CEMENT', 'OUTWARD', '{}', '7739', 'FORCE'),
  ('TMT', 'INWARD', '{"min_weight_kg": 5000}', '7739', 'DEFAULT'),
  ('TMT', 'OUTWARD', '{"max_weight_kg": 100}', '7738', 'DEFAULT'),
  ('TMT', 'OUTWARD', '{"min_weight_kg": 500}', NULL, 'ASK_USER'),
  ('STRUCTURAL', 'INWARD', '{}', '7738', 'DEFAULT'),
  ('PIPE', 'INWARD', '{}', '7738', 'DEFAULT'),
  ('SHEET', 'OUTWARD', '{}', '7738', 'DEFAULT');