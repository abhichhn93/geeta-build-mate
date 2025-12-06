import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ProductStock = Tables<'product_stocks'>;

export function useProductStocks(branchId?: string | null) {
  return useQuery({
    queryKey: ['product_stocks', branchId],
    queryFn: async () => {
      let query = supabase.from('product_stocks').select('*');
      
      if (branchId && branchId !== 'all') {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Get aggregated stock for a product across branches
export function getAggregatedStock(
  productId: string,
  stocks: ProductStock[],
  branchId?: string | null
): { stock_qty: number; stock_status: string } {
  const relevantStocks = branchId && branchId !== 'all'
    ? stocks.filter(s => s.product_id === productId && s.branch_id === branchId)
    : stocks.filter(s => s.product_id === productId);

  if (relevantStocks.length === 0) {
    return { stock_qty: 0, stock_status: 'out_of_stock' };
  }

  const totalQty = relevantStocks.reduce((sum, s) => sum + (s.stock_qty || 0), 0);
  
  // Derive status from total quantity
  let status = 'in_stock';
  if (totalQty === 0) {
    status = 'out_of_stock';
  } else if (totalQty < 10) {
    status = 'low_stock';
  }

  return { stock_qty: totalQty, stock_status: status };
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      branchId,
      updates,
    }: {
      productId: string;
      branchId: string;
      updates: Partial<TablesUpdate<'product_stocks'>>;
    }) => {
      // Upsert: update if exists, insert if not
      const { data: existing } = await supabase
        .from('product_stocks')
        .select('id')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('product_stocks')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('product_stocks')
          .insert({
            product_id: productId,
            branch_id: branchId,
            stock_qty: updates.stock_qty ?? 0,
            stock_status: updates.stock_status ?? 'in_stock',
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_stocks'] });
    },
  });
}
