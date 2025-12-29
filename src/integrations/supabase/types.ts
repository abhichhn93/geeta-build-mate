export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name_en: string
          name_hi: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name_en: string
          name_hi: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name_en?: string
          name_hi?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          customer_type: string | null
          id: string
          is_regular: boolean | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_type?: string | null
          id?: string
          is_regular?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          customer_type?: string | null
          id?: string
          is_regular?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_rates: {
        Row: {
          brand: string
          category: string
          created_at: string
          id: string
          price: number
          rate_date: string
          size: string | null
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          id?: string
          price: number
          rate_date?: string
          size?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          id?: string
          price?: number
          rate_date?: string
          size?: string | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      draft_cards: {
        Row: {
          created_at: string | null
          id: string
          intent: string
          parse_confidence: number
          parse_source: Database["public"]["Enums"]["parse_source"]
          parsed_json: Json
          raw_input: string | null
          status: Database["public"]["Enums"]["draft_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent: string
          parse_confidence?: number
          parse_source: Database["public"]["Enums"]["parse_source"]
          parsed_json: Json
          raw_input?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent?: string
          parse_confidence?: number
          parse_source?: Database["public"]["Enums"]["parse_source"]
          parsed_json?: Json
          raw_input?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      draft_clarifications: {
        Row: {
          created_at: string | null
          draft_id: string
          id: number
          options: Json | null
          prompt: string
          reason_code: string
          resolved: boolean | null
          resolved_value: Json | null
        }
        Insert: {
          created_at?: string | null
          draft_id: string
          id?: number
          options?: Json | null
          prompt: string
          reason_code: string
          resolved?: boolean | null
          resolved_value?: Json | null
        }
        Update: {
          created_at?: string | null
          draft_id?: string
          id?: number
          options?: Json | null
          prompt?: string
          reason_code?: string
          resolved?: boolean | null
          resolved_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "draft_clarifications_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "draft_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      godowns: {
        Row: {
          aliases: string[] | null
          app_alias: string | null
          canonical_id: string | null
          created_at: string | null
          id: string
          tally_guid: string | null
          tally_name: string
        }
        Insert: {
          aliases?: string[] | null
          app_alias?: string | null
          canonical_id?: string | null
          created_at?: string | null
          id?: string
          tally_guid?: string | null
          tally_name: string
        }
        Update: {
          aliases?: string[] | null
          app_alias?: string | null
          canonical_id?: string | null
          created_at?: string | null
          id?: string
          tally_guid?: string | null
          tally_name?: string
        }
        Relationships: []
      }
      inventory_snapshot: {
        Row: {
          closing_balance_qty: number | null
          godown_id: string
          last_updated_at: string | null
          product_id: string
        }
        Insert: {
          closing_balance_qty?: number | null
          godown_id: string
          last_updated_at?: string | null
          product_id: string
        }
        Update: {
          closing_balance_qty?: number | null
          godown_id?: string
          last_updated_at?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_snapshot_godown_id_fkey"
            columns: ["godown_id"]
            isOneToOne: false
            referencedRelation: "godowns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_snapshot_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          delivery_address: string | null
          id: string
          notes: string | null
          order_number: string
          payment_status: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_aliases: {
        Row: {
          alias_term: string
          id: number
          priority: number | null
          product_id: string
        }
        Insert: {
          alias_term: string
          id?: number
          priority?: number | null
          product_id: string
        }
        Update: {
          alias_term?: string
          id?: number
          priority?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_aliases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stocks: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          product_id: string
          stock_qty: number
          stock_status: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          product_id: string
          stock_qty?: number
          stock_status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          product_id?: string
          stock_qty?: number
          stock_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stocks_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          hsn_code: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock: number | null
          name_en: string
          name_hi: string
          price: number
          size: string | null
          stock_qty: number | null
          stock_status: string | null
          unit: string
          updated_at: string
          weight_per_piece: number | null
        }
        Insert: {
          branch_id?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name_en: string
          name_hi: string
          price?: number
          size?: string | null
          stock_qty?: number | null
          stock_status?: string | null
          unit?: string
          updated_at?: string
          weight_per_piece?: number | null
        }
        Update: {
          branch_id?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name_en?: string
          name_hi?: string
          price?: number
          size?: string | null
          stock_qty?: number | null
          stock_status?: string | null
          unit?: string
          updated_at?: string
          weight_per_piece?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          action: string
          category: Database["public"]["Enums"]["product_category"]
          condition_json: Json
          created_at: string | null
          default_godown_canonical_id: string | null
          direction: string
          id: number
        }
        Insert: {
          action: string
          category: Database["public"]["Enums"]["product_category"]
          condition_json: Json
          created_at?: string | null
          default_godown_canonical_id?: string | null
          direction: string
          id?: number
        }
        Update: {
          action?: string
          category?: Database["public"]["Enums"]["product_category"]
          condition_json?: Json
          created_at?: string | null
          default_godown_canonical_id?: string | null
          direction?: string
          id?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      draft_status:
        | "DRAFT"
        | "NEEDS_CLARIFICATION"
        | "CONFIRMED"
        | "POSTED_TO_TALLY"
        | "REJECTED"
      parse_source: "REGEX_RULE" | "LLM_FALLBACK" | "MANUAL_ENTRY"
      product_category:
        | "TMT"
        | "CEMENT"
        | "PIPE"
        | "STRUCTURAL"
        | "SHEET"
        | "WIRE"
        | "SERVICE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      draft_status: [
        "DRAFT",
        "NEEDS_CLARIFICATION",
        "CONFIRMED",
        "POSTED_TO_TALLY",
        "REJECTED",
      ],
      parse_source: ["REGEX_RULE", "LLM_FALLBACK", "MANUAL_ENTRY"],
      product_category: [
        "TMT",
        "CEMENT",
        "PIPE",
        "STRUCTURAL",
        "SHEET",
        "WIRE",
        "SERVICE",
      ],
    },
  },
} as const
