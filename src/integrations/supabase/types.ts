export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bond_analysis: {
        Row: {
          bond_id: string
          convexity: number | null
          created_at: string | null
          duration: number | null
          effective_cost_rate: number | null
          effective_yield_rate: number | null
          id: string
          market_price: number | null
          modified_duration: number | null
          updated_at: string | null
        }
        Insert: {
          bond_id: string
          convexity?: number | null
          created_at?: string | null
          duration?: number | null
          effective_cost_rate?: number | null
          effective_yield_rate?: number | null
          id?: string
          market_price?: number | null
          modified_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          bond_id?: string
          convexity?: number | null
          created_at?: string | null
          duration?: number | null
          effective_cost_rate?: number | null
          effective_yield_rate?: number | null
          id?: string
          market_price?: number | null
          modified_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bond_analysis_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      bond_offerings: {
        Row: {
          available_amount: number
          bond_id: string
          created_at: string | null
          description: string | null
          id: string
          max_investment: number | null
          min_investment: number
          offering_end_date: string
          offering_start_date: string
          status: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          available_amount: number
          bond_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_investment?: number | null
          min_investment: number
          offering_end_date: string
          offering_start_date: string
          status?: string
          terms_and_conditions?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          available_amount?: number
          bond_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          max_investment?: number | null
          min_investment?: number
          offering_end_date?: string
          offering_start_date?: string
          status?: string
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bond_offerings_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      bond_ratings: {
        Row: {
          bond_id: string
          created_at: string | null
          id: string
          notes: string | null
          outlook: string | null
          rating: string
          rating_agency: string
          rating_date: string
        }
        Insert: {
          bond_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          outlook?: string | null
          rating: string
          rating_agency: string
          rating_date?: string
        }
        Update: {
          bond_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          outlook?: string | null
          rating?: string
          rating_agency?: string
          rating_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bond_ratings_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      bonds: {
        Row: {
          amortization_type: string
          capitalization: string | null
          created_at: string | null
          currency: string
          emission_date: string
          frequency: number
          grace_periods: number
          grace_type: string
          id: string
          interest_rate: number
          interest_rate_type: string
          name: string
          nominal_value: number
          term: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amortization_type: string
          capitalization?: string | null
          created_at?: string | null
          currency: string
          emission_date: string
          frequency: number
          grace_periods?: number
          grace_type: string
          id?: string
          interest_rate: number
          interest_rate_type: string
          name: string
          nominal_value: number
          term: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amortization_type?: string
          capitalization?: string | null
          created_at?: string | null
          currency?: string
          emission_date?: string
          frequency?: number
          grace_periods?: number
          grace_type?: string
          id?: string
          interest_rate?: number
          interest_rate_type?: string
          name?: string
          nominal_value?: number
          term?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cash_flows: {
        Row: {
          amortization: number
          bond_id: string
          created_at: string | null
          date: string
          final_balance: number
          id: string
          initial_balance: number
          interest: number
          payment: number
          period: number
        }
        Insert: {
          amortization: number
          bond_id: string
          created_at?: string | null
          date: string
          final_balance: number
          id?: string
          initial_balance: number
          interest: number
          payment: number
          period: number
        }
        Update: {
          amortization?: number
          bond_id?: string
          created_at?: string | null
          date?: string
          final_balance?: number
          id?: string
          initial_balance?: number
          interest?: number
          payment?: number
          period?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_flows_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          bond_id: string
          created_at: string | null
          id: string
          investment_date: string
          investor_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          bond_id: string
          created_at?: string | null
          id?: string
          investment_date?: string
          investor_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bond_id?: string
          created_at?: string | null
          id?: string
          investment_date?: string
          investor_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_bond_id_fkey"
            columns: ["bond_id"]
            isOneToOne: false
            referencedRelation: "bonds"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["role_type"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["role_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          investment_id: string
          period_number: number | null
          status: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          investment_id: string
          period_number?: number | null
          status?: string
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          investment_id?: string
          period_number?: number | null
          status?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_reinvest: boolean | null
          created_at: string | null
          default_capitalization: string | null
          default_currency: string
          default_interest_rate_type: string
          id: string
          notification_preferences: Json | null
          preferred_term: string | null
          risk_tolerance: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_reinvest?: boolean | null
          created_at?: string | null
          default_capitalization?: string | null
          default_currency?: string
          default_interest_rate_type?: string
          id?: string
          notification_preferences?: Json | null
          preferred_term?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_reinvest?: boolean | null
          created_at?: string | null
          default_capitalization?: string | null
          default_currency?: string
          default_interest_rate_type?: string
          id?: string
          notification_preferences?: Json | null
          preferred_term?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role_type: "investor" | "issuer" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      role_type: ["investor", "issuer", "admin"],
    },
  },
} as const
