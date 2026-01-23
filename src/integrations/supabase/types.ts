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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      call_logs: {
        Row: {
          call_type: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          receiver_id: string
          room_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          call_type: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id: string
          room_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          receiver_id?: string
          room_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string | null
          id: string
          last_message: string | null
          last_message_time: string | null
          last_sender_id: string | null
          participant_1: string
          participant_2: string
          unread_count_1: number | null
          unread_count_2: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          last_sender_id?: string | null
          participant_1: string
          participant_2: string
          unread_count_1?: number | null
          unread_count_2?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message?: string | null
          last_message_time?: string | null
          last_sender_id?: string | null
          participant_1?: string
          participant_2?: string
          unread_count_1?: number | null
          unread_count_2?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_last_sender_id_fkey"
            columns: ["last_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string | null
          created_at: string | null
          file_name: string | null
          id: string
          media_url: string | null
          message_type: string | null
          receiver_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          receiver_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          file_name?: string | null
          id?: string
          media_url?: string | null
          message_type?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          last_seen: string | null
          name: string | null
          phone_number: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          chat_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_terms_acceptance: {
        Row: {
          accepted_at: string
          device_hash: string | null
          id: string
          ip_address: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          device_hash?: string | null
          id?: string
          ip_address?: string | null
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          device_hash?: string | null
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          counterparty_wallet_id: string | null
          created_at: string
          description: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          status: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          counterparty_wallet_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          counterparty_wallet_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_counterparty_wallet_id_fkey"
            columns: ["counterparty_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["wallet_status"]
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["wallet_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["wallet_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_or_create_chat: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          id: string
          is_active: boolean
          is_online: boolean
          last_seen: string
          name: string
          username: string
        }[]
      }
      get_user_wallet: {
        Args: { p_user_id: string }
        Returns: {
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["wallet_status"]
          terms_accepted_at: string
          user_id: string
        }[]
      }
      get_wallet_balance: { Args: { p_wallet_id: string }; Returns: number }
      has_accepted_wallet_terms: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      search_users_public: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string
          bio: string
          id: string
          is_active: boolean
          is_online: boolean
          last_seen: string
          name: string
          username: string
        }[]
      }
    }
    Enums: {
      wallet_status: "active" | "suspended" | "pending_activation"
      wallet_transaction_status: "pending" | "completed" | "failed" | "reversed"
      wallet_transaction_type:
        | "deposit"
        | "withdrawal"
        | "transfer_in"
        | "transfer_out"
        | "adjustment"
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
      wallet_status: ["active", "suspended", "pending_activation"],
      wallet_transaction_status: ["pending", "completed", "failed", "reversed"],
      wallet_transaction_type: [
        "deposit",
        "withdrawal",
        "transfer_in",
        "transfer_out",
        "adjustment",
      ],
    },
  },
} as const
