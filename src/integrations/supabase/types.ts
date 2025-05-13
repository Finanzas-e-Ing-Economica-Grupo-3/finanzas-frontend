export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          default_capitalization: string | null
          default_currency: string
          default_interest_rate_type: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_capitalization?: string | null
          default_currency?: string
          default_interest_rate_type?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_capitalization?: string | null
          default_currency?: string
          default_interest_rate_type?: string
          id?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
