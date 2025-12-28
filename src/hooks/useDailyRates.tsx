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
export function useLatestRates() {
  return useQuery({
    queryKey: ['daily_rates', 'latest'],
    queryFn: async () => {
      // First get the most recent rate date
      const { data: latestDate, error: dateError } = await supabase
        .from('daily_rates')
        .select('rate_date')
        .order('rate_date', { ascending: false })
        .limit(1)
        .single();
      
      if (dateError || !latestDate) {
        return { rates: [], date: null };
      }

      // Then fetch all rates for that date
      const { data: rates, error } = await supabase
        .from('daily_rates')
        .select('*')
        .eq('rate_date', latestDate.rate_date)
        .order('category')
        .order('brand')
        .order('size');
      
      if (error) throw error;
      return { rates: rates || [], date: latestDate.rate_date };
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
