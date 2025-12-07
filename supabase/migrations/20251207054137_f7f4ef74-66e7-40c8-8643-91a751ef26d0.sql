-- Create storage bucket for settings/config images (UPI QR, etc.)
INSERT INTO storage.buckets (id, name, public) VALUES ('settings', 'settings', true);

-- Allow anyone to view settings images (public bucket)
CREATE POLICY "Anyone can view settings images"
ON storage.objects FOR SELECT
USING (bucket_id = 'settings');

-- Only admins can upload/update/delete settings images
CREATE POLICY "Admins can manage settings images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'settings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'settings' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings images"
ON storage.objects FOR DELETE
USING (bucket_id = 'settings' AND public.has_role(auth.uid(), 'admin'));

-- Create a simple settings table to store key-value pairs
CREATE TABLE IF NOT EXISTS public.app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view settings"
ON public.app_settings FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.app_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));