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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action_type: string
          actor_avatar_url: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          deleted_at: string | null
          description: string
          entity_type: string
          family_id: string
          id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description: string
          entity_type: string
          family_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          entity_type?: string
          family_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_events: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          event_date: string
          event_type: string
          family_id: string
          id: string
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_date: string
          event_type?: string
          family_id: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          event_date?: string
          event_type?: string
          family_id?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          deleted_at: string | null
          family_id: string
          id: string
          notes: string | null
          paid_at: string
          paid_by: string | null
          paid_by_name: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          deleted_at?: string | null
          family_id: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          paid_by_name?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          deleted_at?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          paid_at?: string
          paid_by?: string | null
          paid_by_name?: string | null
        }
        Relationships: []
      }
      bills: {
        Row: {
          bill_name: string
          bill_type: string | null
          created_at: string
          deleted_at: string | null
          due_date: string
          family_id: string
          google_calendar_event_id: string | null
          id: string
          is_paid: boolean
          is_recurring: boolean
          nominal: number
          notes: string | null
          paid_at: string | null
          recurrence_interval: string | null
          reminder_days: number | null
          updated_at: string
        }
        Insert: {
          bill_name: string
          bill_type?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date: string
          family_id: string
          google_calendar_event_id?: string | null
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          nominal: number
          notes?: string | null
          paid_at?: string | null
          recurrence_interval?: string | null
          reminder_days?: number | null
          updated_at?: string
        }
        Update: {
          bill_name?: string
          bill_type?: string | null
          created_at?: string
          deleted_at?: string | null
          due_date?: string
          family_id?: string
          google_calendar_event_id?: string | null
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          nominal?: number
          notes?: string | null
          paid_at?: string | null
          recurrence_interval?: string | null
          reminder_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          done_at: string | null
          done_by: string | null
          family_id: string
          id: string
          is_done: boolean
          is_recurring: boolean
          notes: string | null
          priority: string | null
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          done_at?: string | null
          done_by?: string | null
          family_id: string
          id?: string
          is_done?: boolean
          is_recurring?: boolean
          notes?: string | null
          priority?: string | null
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          done_at?: string | null
          done_by?: string | null
          family_id?: string
          id?: string
          is_done?: boolean
          is_recurring?: boolean
          notes?: string | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      debts_credits: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          family_id: string
          id: string
          monthly_installment: number
          person_name: string
          phone_number: string | null
          proof_image_url: string | null
          start_date: string
          total_amount: number
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          family_id: string
          id?: string
          monthly_installment?: number
          person_name: string
          phone_number?: string | null
          proof_image_url?: string | null
          start_date: string
          total_amount: number
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          family_id?: string
          id?: string
          monthly_installment?: number
          person_name?: string
          phone_number?: string | null
          proof_image_url?: string | null
          start_date?: string
          total_amount?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_credits_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          family_id: string
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          family_id: string
          id?: string
          name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          deleted_at: string | null
          family_name: string
          id: string
          invite_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          family_name: string
          id?: string
          invite_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          family_name?: string
          id?: string
          invite_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      household_documents: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          drive_url: string | null
          family_id: string
          id: string
          notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          family_id: string
          id?: string
          notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          drive_url?: string | null
          family_id?: string
          id?: string
          notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      installment_logs: {
        Row: {
          amount_paid: number
          created_at: string
          debt_credit_id: string
          deleted_at: string | null
          id: string
          installment_number: number
          payment_date: string
          payment_date_input: string | null
          payment_method: string | null
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          debt_credit_id: string
          deleted_at?: string | null
          id?: string
          installment_number: number
          payment_date: string
          payment_date_input?: string | null
          payment_method?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          debt_credit_id?: string
          deleted_at?: string | null
          id?: string
          installment_number?: number
          payment_date?: string
          payment_date_input?: string | null
          payment_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installment_logs_debt_credit_id_fkey"
            columns: ["debt_credit_id"]
            isOneToOne: false
            referencedRelation: "debts_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_boards: {
        Row: {
          assigned_pic_id: string | null
          category: string | null
          created_at: string
          created_by_id: string | null
          created_by_label: string | null
          deleted_at: string | null
          description: string | null
          family_id: string
          id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_pic_id?: string | null
          category?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_label?: string | null
          deleted_at?: string | null
          description?: string | null
          family_id: string
          id?: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_pic_id?: string | null
          category?: string | null
          created_at?: string
          created_by_id?: string | null
          created_by_label?: string | null
          deleted_at?: string | null
          description?: string | null
          family_id?: string
          id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_boards_assigned_pic_id_fkey"
            columns: ["assigned_pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_boards_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_boards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          family_id: string | null
          full_name: string
          id: string
          last_active_at: string | null
          phone_number: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          family_id?: string | null
          full_name: string
          id: string
          last_active_at?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          family_id?: string | null
          full_name?: string
          id?: string
          last_active_at?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          deleted_at: string | null
          family_id: string
          id: string
          is_pinned: boolean
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          family_id: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          deleted_at?: string | null
          family_id?: string
          id?: string
          is_pinned?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      shopping_categories: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          family_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          family_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          family_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          deleted_at: string | null
          family_id: string
          id: string
          item_name: string
          last_updated_by: string | null
          last_updated_by_name: string | null
          min_stock: number
          quantity_decimal: number | null
          status: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          family_id: string
          id?: string
          item_name: string
          last_updated_by?: string | null
          last_updated_by_name?: string | null
          min_stock?: number
          quantity_decimal?: number | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          deleted_at?: string | null
          family_id?: string
          id?: string
          item_name?: string
          last_updated_by?: string | null
          last_updated_by_name?: string | null
          min_stock?: number
          quantity_decimal?: number | null
          status?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          estimated_price: number | null
          family_id: string
          id: string
          item_name: string
          notes: string | null
          priority: string
          purchased_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          estimated_price?: number | null
          family_id: string
          id?: string
          item_name: string
          notes?: string | null
          priority?: string
          purchased_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          estimated_price?: number | null
          family_id?: string
          id?: string
          item_name?: string
          notes?: string | null
          priority?: string
          purchased_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_family: {
        Args: { _family_name: string; _invite_code: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          family_name: string
          id: string
          invite_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "families"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_policy_if_not_exists: {
        Args: {
          _cmd: string
          _name: string
          _role: string
          _table: string
          _using?: string
          _with_check?: string
        }
        Returns: undefined
      }
      current_family_id: { Args: never; Returns: string }
      join_family_by_code: {
        Args: { _invite_code: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          family_name: string
          id: string
          invite_code: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "families"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
