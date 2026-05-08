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
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["action_type"]
          created_at: string
          description: string
          entite_id: string | null
          entite_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["action_type"]
          created_at?: string
          description: string
          entite_id?: string | null
          entite_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["action_type"]
          created_at?: string
          description?: string
          entite_id?: string | null
          entite_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bus_center: {
        Row: {
          created_at: string
          date_dimanche: string
          heure_depart: string
          id: string
          nom: string
          nombre_anciens: number
          nombre_nouveaux: number
          prenom: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          date_dimanche?: string
          heure_depart: string
          id?: string
          nom: string
          nombre_anciens?: number
          nombre_nouveaux?: number
          prenom: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          date_dimanche?: string
          heure_depart?: string
          id?: string
          nom?: string
          nombre_anciens?: number
          nombre_nouveaux?: number
          prenom?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_center_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "bus_center_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_center_zones: {
        Row: {
          created_at: string
          id: string
          nom: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
        }
        Relationships: []
      }
      membres: {
        Row: {
          created_at: string
          created_by: string | null
          date_inscription: string
          est_actif: boolean
          id: string
          lieu_habitation: string | null
          nom_complet: string
          photo_url: string | null
          service_id: string | null
          statut_bapteme: Database["public"]["Enums"]["statut_bapteme"]
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_inscription?: string
          est_actif?: boolean
          id?: string
          lieu_habitation?: string | null
          nom_complet: string
          photo_url?: string | null
          service_id?: string | null
          statut_bapteme?: Database["public"]["Enums"]["statut_bapteme"]
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_inscription?: string
          est_actif?: boolean
          id?: string
          lieu_habitation?: string | null
          nom_complet?: string
          photo_url?: string | null
          service_id?: string | null
          statut_bapteme?: Database["public"]["Enums"]["statut_bapteme"]
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membres_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      presences: {
        Row: {
          created_at: string
          date_presence: string
          est_present: boolean
          id: string
          marked_by: string | null
          membre_id: string
          service_id: string | null
          type_activite: Database["public"]["Enums"]["type_activite"]
        }
        Insert: {
          created_at?: string
          date_presence: string
          est_present?: boolean
          id?: string
          marked_by?: string | null
          membre_id: string
          service_id?: string | null
          type_activite: Database["public"]["Enums"]["type_activite"]
        }
        Update: {
          created_at?: string
          date_presence?: string
          est_present?: boolean
          id?: string
          marked_by?: string | null
          membre_id?: string
          service_id?: string | null
          type_activite?: Database["public"]["Enums"]["type_activite"]
        }
        Relationships: [
          {
            foreignKeyName: "presences_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presences_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nom_complet: string
          service_id: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nom_complet: string
          service_id?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom_complet?: string
          service_id?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          couleur: string | null
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_service_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_berger: { Args: never; Returns: boolean }
      is_responsable_of_service: {
        Args: { _service_id: string }
        Returns: boolean
      }
    }
    Enums: {
      action_type:
        | "connexion"
        | "ajout_membre"
        | "modification_membre"
        | "suppression_membre"
        | "marquage_presence"
        | "creation_service"
        | "modification_service"
      app_role: "berger" | "responsable_service"
      statut_bapteme: "baptise" | "non_baptise"
      type_activite: "culte" | "reunion" | "activite_speciale"
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
      action_type: [
        "connexion",
        "ajout_membre",
        "modification_membre",
        "suppression_membre",
        "marquage_presence",
        "creation_service",
        "modification_service",
      ],
      app_role: ["berger", "responsable_service"],
      statut_bapteme: ["baptise", "non_baptise"],
      type_activite: ["culte", "reunion", "activite_speciale"],
    },
  },
} as const
