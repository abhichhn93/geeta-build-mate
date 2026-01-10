import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DailyRate = Tables<'daily_rates'>;

// Fetch rates for a specific date
export function useDailyRates(date?: string) {
  const today = date || new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['daily_rates', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_rates')
        .select('*')
        .eq('rate_date', today)
        .order('category')
        .order('brand')
        .order('size');
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (rates change frequently)
  });
}

// Fetch the latest available rates (for homepage Rate Board)
// NOTE: We intentionally do NOT pick a single latest day for the entire table.
// If an admin updates only one brand today, the "latest day" would become today and
// all other brands would disappear from the homepage. Instead, we return the latest
// entry per (category, brand, size).
export function useLatestRates() {
  return useQuery({
    queryKey: ['daily_rates', 'latest'],
    queryFn: async () => {
      // Pull recent history and collapse to the latest record per key.
      // Default query limit is 1000; our dataset is small.
      const { data, error } = await supabase
        .from('daily_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .order('category')
        .order('brand')
        .order('size')
        .limit(1000);

      if (error) throw error;

      const rows = data || [];
      const latestByKey = new Map<string, DailyRate>();

      for (const r of rows) {
        const key = `${r.category}__${r.brand}__${r.size ?? ''}`;
        if (!latestByKey.has(key)) {
          latestByKey.set(key, r);
        }
      }

      const rates = Array.from(latestByKey.values());

      const parseSize = (s: string | null) => {
        if (!s) return Number.POSITIVE_INFINITY;
        const m = s.match(/(\d+(?:\.\d+)?)/);
        return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
      };

      // Sort for consistent UI display
      rates.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
        return parseSize(a.size) - parseSize(b.size);
      });

      // Latest date among returned rows (used only as a header hint)
      const maxDate = rates.reduce<string | null>((max, r) => {
        if (!max) return r.rate_date;
        return r.rate_date > max ? r.rate_date : max;
      }, null);

      return { rates, date: maxDate };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateDailyRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      category, 
      brand, 
      size, 
      price, 
      unit = 'kg' 
    }: { 
      category: string; 
      brand: string; 
      size?: string; 
      price: number; 
      unit?: string;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Try to update existing rate first
      const { data: existing } = await supabase
        .from('daily_rates')
        .select('id')
        .eq('rate_date', today)
        .eq('category', category)
        .eq('brand', brand)
        .eq('size', size || '')
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('daily_rates')
          .update({ price, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Insert new rate
        const { data, error } = await supabase
          .from('daily_rates')
          .insert({
            category,
            brand,
            size: size || null,
            price,
            unit,
            rate_date: today,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_rates'] });
    },
  });
}
