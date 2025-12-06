-- Create branches table for Sutrahi and Calendar branches
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  address text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Anyone can view branches
CREATE POLICY "Anyone can view branches" ON public.branches
FOR SELECT USING (true);

-- Admins can manage branches
CREATE POLICY "Admins can manage branches" ON public.branches
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add branch_id to products table
ALTER TABLE public.products ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- Seed the two branches
INSERT INTO public.branches (name, address) VALUES 
  ('Sutrahi', 'Sutrahi Branch, Mohammadabad Gohna, Mau'),
  ('Calendar', 'Calendar Branch, Mohammadabad Gohna, Mau');