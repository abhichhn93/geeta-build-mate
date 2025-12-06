-- Create product_stocks table for per-branch stock tracking
CREATE TABLE public.product_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, branch_id)
);

-- Enable RLS
ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;

-- Anyone can view product stocks
CREATE POLICY "Anyone can view product stocks"
ON public.product_stocks
FOR SELECT
USING (true);

-- Admins can manage product stocks
CREATE POLICY "Admins can manage product stocks"
ON public.product_stocks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing stock data from products to product_stocks for both branches
INSERT INTO public.product_stocks (product_id, branch_id, stock_qty, stock_status)
SELECT 
  p.id,
  b.id,
  COALESCE(p.stock_qty, 0),
  COALESCE(p.stock_status, 'in_stock')
FROM public.products p
CROSS JOIN public.branches b
WHERE p.is_active = true;