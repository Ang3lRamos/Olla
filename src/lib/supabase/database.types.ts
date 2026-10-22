
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_usage": {
                  Row: {
                    "household_id": string,"requests": number,"used_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id": string,"requests"?: number,"used_on": string
                  }
                  Update: {
                    "household_id"?: string,"requests"?: number,"used_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_usage_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_entitlements": {
                  Row: {
                    "ai_daily_limit": number | null,"expires_at": string | null,"household_id": string,"plan": string,"trial_used": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_daily_limit"?: number | null,"expires_at"?: string | null,"household_id": string,"plan"?: string,"trial_used"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "ai_daily_limit"?: number | null,"expires_at"?: string | null,"household_id"?: string,"plan"?: string,"trial_used"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_entitlements_household_id_fkey"
      columns: ["household_id"]
isOneToOne: true
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"household_members": {
                  Row: {
                    "created_at": string,"household_id": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"household_id": string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"household_id"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_members_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "created_at": string,"default_people": number,"id": string,"name": string,"preferences": NonNullable<Json>,"weekly_budget_cop": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_people"?: number,"id"?: string,"name": string,"preferences"?: NonNullable<Json>,"weekly_budget_cop"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"default_people"?: number,"id"?: string,"name"?: string,"preferences"?: NonNullable<Json>,"weekly_budget_cop"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"ingredient_prices": {
                  Row: {
                    "household_id": string | null,"id": string,"ingredient_id": string,"package_label": string | null,"per_amount": number,"per_unit": string,"piece_label": string | null,"pieces": number | null,"price_cop": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id"?: string | null,"id"?: string,"ingredient_id": string,"package_label"?: string | null,"per_amount": number,"per_unit": string,"piece_label"?: string | null,"pieces"?: number | null,"price_cop": number,"updated_at"?: string
                  }
                  Update: {
                    "household_id"?: string | null,"id"?: string,"ingredient_id"?: string,"package_label"?: string | null,"per_amount"?: number,"per_unit"?: string,"piece_label"?: string | null,"pieces"?: number | null,"price_cop"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredient_prices_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ingredient_prices_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"ingredients": {
                  Row: {
                    "base_unit": string,"category": string,"grams_per_unit": number | null,"household_id": string | null,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "base_unit": string,"category": string,"grams_per_unit"?: number | null,"household_id"?: string | null,"id"?: string,"name": string
                  }
                  Update: {
                    "base_unit"?: string,"category"?: string,"grams_per_unit"?: number | null,"household_id"?: string | null,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ingredients_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"meal_slots": {
                  Row: {
                    "cooked_at": string | null,"cooked_deductions": NonNullable<Json>,"day": number,"id": string,"meal": string,"people_override": number | null,"recipe_id": string,"week_plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cooked_at"?: string | null,"cooked_deductions"?: NonNullable<Json>,"day": number,"id"?: string,"meal": string,"people_override"?: number | null,"recipe_id": string,"week_plan_id": string
                  }
                  Update: {
                    "cooked_at"?: string | null,"cooked_deductions"?: NonNullable<Json>,"day"?: number,"id"?: string,"meal"?: string,"people_override"?: number | null,"recipe_id"?: string,"week_plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_slots_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meal_slots_week_plan_id_fkey"
      columns: ["week_plan_id"]
isOneToOne: false
      referencedRelation: "week_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "body": string,"created_at": string,"date": string,"household_id": string,"id": string,"meal": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"date": string,"household_id": string,"id"?: string,"meal"?: string | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"date"?: string,"household_id"?: string,"id"?: string,"meal"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"pantry_items": {
                  Row: {
                    "household_id": string,"id": string,"ingredient_id": string,"quantity": number,"unit": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "household_id": string,"id"?: string,"ingredient_id": string,"quantity": number,"unit": string,"updated_at"?: string
                  }
                  Update: {
                    "household_id"?: string,"id"?: string,"ingredient_id"?: string,"quantity"?: number,"unit"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pantry_items_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pantry_items_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    }
                  ]
                },"payment_events": {
                  Row: {
                    "event": string | null,"id": number,"outcome": string,"received_at": string,"reference": string | null,"signature_valid": boolean,"status": string | null,"transaction_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "event"?: string | null,"id"?: never,"outcome": string,"received_at"?: string,"reference"?: string | null,"signature_valid": boolean,"status"?: string | null,"transaction_id"?: string | null
                  }
                  Update: {
                    "event"?: string | null,"id"?: never,"outcome"?: string,"received_at"?: string,"reference"?: string | null,"signature_valid"?: boolean,"status"?: string | null,"transaction_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount_in_cents": number,"applied_at": string | null,"created_at": string,"household_id": string,"payment_method_type": string | null,"period": string,"plan": string,"reference": string,"status": string,"updated_at": string,"wompi_transaction_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_in_cents": number,"applied_at"?: string | null,"created_at"?: string,"household_id": string,"payment_method_type"?: string | null,"period": string,"plan": string,"reference": string,"status"?: string,"updated_at"?: string,"wompi_transaction_id"?: string | null
                  }
                  Update: {
                    "amount_in_cents"?: number,"applied_at"?: string | null,"created_at"?: string,"household_id"?: string,"payment_method_type"?: string | null,"period"?: string,"plan"?: string,"reference"?: string,"status"?: string,"updated_at"?: string,"wompi_transaction_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_plan_period_fkey"
      columns: ["plan","period"]
isOneToOne: false
      referencedRelation: "plan_prices"
      referencedColumns: ["plan","period"]
    }
                  ]
                },"plan_prices": {
                  Row: {
                    "ai_daily_limit": number,"amount_in_cents": number,"days": number,"period": string,"plan": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_daily_limit": number,"amount_in_cents": number,"days": number,"period": string,"plan": string
                  }
                  Update: {
                    "ai_daily_limit"?: number,"amount_in_cents"?: number,"days"?: number,"period"?: string,"plan"?: string
                  }
                  Relationships: [
                    
                  ]
                },"recipe_ingredients": {
                  Row: {
                    "id": string,"ingredient_id": string,"note": string | null,"position": number,"quantity": number,"recipe_id": string,"unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"ingredient_id": string,"note"?: string | null,"position"?: number,"quantity": number,"recipe_id": string,"unit": string
                  }
                  Update: {
                    "id"?: string,"ingredient_id"?: string,"note"?: string | null,"position"?: number,"quantity"?: number,"recipe_id"?: string,"unit"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recipe_ingredients_recipe_id_fkey"
      columns: ["recipe_id"]
isOneToOne: false
      referencedRelation: "recipes"
      referencedColumns: ["id"]
    }
                  ]
                },"recipes": {
                  Row: {
                    "base_servings": number,"category": string,"created_at": string,"household_id": string | null,"id": string,"name": string,"prep_minutes": number | null,"steps": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "base_servings": number,"category": string,"created_at"?: string,"household_id"?: string | null,"id"?: string,"name": string,"prep_minutes"?: number | null,"steps"?: (string)[]
                  }
                  Update: {
                    "base_servings"?: number,"category"?: string,"created_at"?: string,"household_id"?: string | null,"id"?: string,"name"?: string,"prep_minutes"?: number | null,"steps"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "recipes_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_extras": {
                  Row: {
                    "category": string,"checked": boolean,"created_at": string,"id": string,"name": string,"week_plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"checked"?: boolean,"created_at"?: string,"id"?: string,"name": string,"week_plan_id": string
                  }
                  Update: {
                    "category"?: string,"checked"?: boolean,"created_at"?: string,"id"?: string,"name"?: string,"week_plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_extras_week_plan_id_fkey"
      columns: ["week_plan_id"]
isOneToOne: false
      referencedRelation: "week_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"shopping_purchases": {
                  Row: {
                    "ingredient_id": string,"purchased_at": string,"quantity": number,"unit": string,"week_plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ingredient_id": string,"purchased_at"?: string,"quantity": number,"unit": string,"week_plan_id": string
                  }
                  Update: {
                    "ingredient_id"?: string,"purchased_at"?: string,"quantity"?: number,"unit"?: string,"week_plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shopping_purchases_ingredient_id_fkey"
      columns: ["ingredient_id"]
isOneToOne: false
      referencedRelation: "ingredients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shopping_purchases_week_plan_id_fkey"
      columns: ["week_plan_id"]
isOneToOne: false
      referencedRelation: "week_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"week_plans": {
                  Row: {
                    "created_at": string,"household_id": string,"id": string,"people": number,"week_start": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"household_id": string,"id"?: string,"people": number,"week_start": string
                  }
                  Update: {
                    "created_at"?: string,"household_id"?: string,"id"?: string,"people"?: number,"week_start"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "week_plans_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "ai_today":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"apply_payment":
{ Args: { "method_type": string,"paid_amount_in_cents": number,"paid_currency": string,"target_reference": string,"transaction_id": string,"transaction_status": string }; Returns: {
              "expires_at": string,"plan": string,"status": string
            }[]
                           },
"can_access_week_plan":
{ Args: { "target_week_plan_id": string }; Returns: boolean
                           },
"consume_ai_request":
{ Args: { "target_household_id": string }; Returns: {
              "allowed": boolean,"daily_limit": number,"plan": string,"used": number
            }[]
                           },
"create_household":
{ Args: { "budget_cop"?: number,"household_name": string,"household_preferences"?: Json,"people": number }; Returns: string
                           },
"create_payment":
{ Args: { "target_household_id": string,"target_period": string,"target_plan": string }; Returns: {
              "amount_in_cents": number,"reference": string
            }[]
                           },
"effective_plan":
{ Args: { "target_household_id": string }; Returns: {
              "daily_limit": number,"expires_at": string,"plan": string,"trial_used": boolean
            }[]
                           },
"get_ai_quota":
{ Args: { "target_household_id": string }; Returns: {
              "daily_limit": number,"expires_at": string,"plan": string,"trial_used": boolean,"used": number
            }[]
                           },
"is_household_member":
{ Args: { "target_household_id": string }; Returns: boolean
                           },
"refund_ai_request":
{ Args: { "target_household_id": string }; Returns: undefined
                           },
"save_household_recipe":
{ Args: { "ingredients": Json,"minutes": number,"recipe_category": string,"recipe_name": string,"recipe_steps": (string)[],"servings": number,"target_household_id": string,"target_recipe_id": string }; Returns: string
                           },
"start_trial":
{ Args: { "target_household_id": string }; Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
