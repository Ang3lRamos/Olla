// Tipos de la base en el formato de `supabase gen types typescript`.
// Al enlazar el proyecto se regeneran completos con `npm run db:types`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          default_people: number;
          weekly_budget_cop: number | null;
          preferences: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_people?: number;
          weekly_budget_cop?: number | null;
          preferences?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_people?: number;
          weekly_budget_cop?: number | null;
          preferences?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: { household_id: string; user_id: string; role: string; created_at: string };
        Insert: { household_id: string; user_id: string; role?: string; created_at?: string };
        Update: { household_id?: string; user_id?: string; role?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_household: {
        Args: { household_name: string; people: number; budget_cop: number | null; household_preferences: Json };
        Returns: string;
      };
      is_household_member: { Args: { target_household_id: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
