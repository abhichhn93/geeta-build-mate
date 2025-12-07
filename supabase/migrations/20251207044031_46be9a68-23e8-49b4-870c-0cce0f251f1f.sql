
-- Drop existing restrictive policies and create permissive ones for categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
TO public
USING (true);

-- Drop existing restrictive policies and create permissive ones for brands
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
CREATE POLICY "Anyone can view brands" 
ON public.brands 
FOR SELECT 
TO public
USING (true);

-- Drop existing restrictive policies and create permissive ones for branches
DROP POLICY IF EXISTS "Anyone can view branches" ON public.branches;
CREATE POLICY "Anyone can view branches" 
ON public.branches 
FOR SELECT 
TO public
USING (true);

-- Drop existing restrictive policies and create permissive ones for products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
TO public
USING (true);

-- Drop existing restrictive policies and create permissive ones for product_stocks
DROP POLICY IF EXISTS "Anyone can view product stocks" ON public.product_stocks;
CREATE POLICY "Anyone can view product stocks" 
ON public.product_stocks 
FOR SELECT 
TO public
USING (true);

-- Drop existing restrictive policies and create permissive ones for daily_rates
DROP POLICY IF EXISTS "Anyone can view daily rates" ON public.daily_rates;
CREATE POLICY "Anyone can view daily rates" 
ON public.daily_rates 
FOR SELECT 
TO public
USING (true);
