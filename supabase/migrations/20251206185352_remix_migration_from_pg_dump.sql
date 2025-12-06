CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'customer'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    category_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_hi text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text NOT NULL,
    phone text,
    address text,
    customer_type text DEFAULT 'individual'::text,
    is_regular boolean DEFAULT false,
    credit_limit numeric(12,2) DEFAULT 0,
    current_balance numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT customers_customer_type_check CHECK ((customer_type = ANY (ARRAY['contractor'::text, 'individual'::text, 'dealer'::text])))
);


--
-- Name: daily_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category text NOT NULL,
    brand text NOT NULL,
    size text,
    price numeric(10,2) NOT NULL,
    unit text DEFAULT 'kg'::text NOT NULL,
    rate_date date DEFAULT CURRENT_DATE NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT daily_rates_category_check CHECK ((category = ANY (ARRAY['sariya'::text, 'cement'::text])))
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit text NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    user_id uuid,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    delivery_address text,
    status text DEFAULT 'pending'::text,
    payment_status text DEFAULT 'unpaid'::text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_payment_status_check CHECK ((payment_status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'dispatched'::text, 'delivered'::text, 'cancelled'::text])))
);


--
-- Name: product_stocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_stocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    branch_id uuid NOT NULL,
    stock_qty integer DEFAULT 0 NOT NULL,
    stock_status text DEFAULT 'in_stock'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_en text NOT NULL,
    name_hi text NOT NULL,
    category_id uuid,
    brand_id uuid,
    size text,
    unit text DEFAULT 'kg'::text NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    weight_per_piece numeric(10,4),
    hsn_code text,
    image_url text,
    stock_qty integer DEFAULT 0,
    min_stock integer DEFAULT 5,
    stock_status text DEFAULT 'in_stock'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    branch_id uuid,
    CONSTRAINT products_stock_status_check CHECK ((stock_status = ANY (ARRAY['in_stock'::text, 'low_stock'::text, 'out_of_stock'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'customer'::public.app_role NOT NULL
);


--
-- Name: branches branches_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_name_key UNIQUE (name);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: daily_rates daily_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rates
    ADD CONSTRAINT daily_rates_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_stocks product_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_pkey PRIMARY KEY (id);


--
-- Name: product_stocks product_stocks_product_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_product_id_branch_id_key UNIQUE (product_id, branch_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: brands brands_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: daily_rates daily_rates_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_rates
    ADD CONSTRAINT daily_rates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: product_stocks product_stocks_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: product_stocks product_stocks_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: branches Admins can manage branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage branches" ON public.branches USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: brands Admins can manage brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage brands" ON public.brands USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: customers Admins can manage customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage customers" ON public.customers USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: daily_rates Admins can manage daily rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage daily rates" ON public.daily_rates USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: order_items Admins can manage order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage order items" ON public.order_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Admins can manage orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage orders" ON public.orders USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_stocks Admins can manage product stocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage product stocks" ON public.product_stocks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage products" ON public.products USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: branches Anyone can view branches; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT USING (true);


--
-- Name: brands Anyone can view brands; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);


--
-- Name: categories Anyone can view categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);


--
-- Name: daily_rates Anyone can view daily rates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view daily rates" ON public.daily_rates FOR SELECT USING (true);


--
-- Name: product_stocks Anyone can view product stocks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view product stocks" ON public.product_stocks FOR SELECT USING (true);


--
-- Name: products Anyone can view products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);


--
-- Name: orders Users can create own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: customers Users can view own customer record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own customer record" ON public.customers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: order_items Users can view own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_rates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: product_stocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


