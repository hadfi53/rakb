
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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          postal_code: string
          street: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          postal_code: string
          street: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          postal_code?: string
          street?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          base_price: number
          created_at: string
          deposit_amount: number | null
          duration_days: number | null
          end_date: string
          id: string
          insurance_fee: number | null
          owner_id: string
          payment_amount: number | null
          payment_currency: string | null
          payment_date: string | null
          payment_intent_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          pickup_location: string
          renter_id: string
          return_location: string
          service_fee: number | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          base_price: number
          created_at?: string
          deposit_amount?: number | null
          duration_days?: number | null
          end_date: string
          id?: string
          insurance_fee?: number | null
          owner_id: string
          payment_amount?: number | null
          payment_currency?: string | null
          payment_date?: string | null
          payment_intent_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pickup_location: string
          renter_id: string
          return_location: string
          service_fee?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          base_price?: number
          created_at?: string
          deposit_amount?: number | null
          duration_days?: number | null
          end_date?: string
          id?: string
          insurance_fee?: number | null
          owner_id?: string
          payment_amount?: number | null
          payment_currency?: string | null
          payment_date?: string | null
          payment_intent_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          pickup_location?: string
          renter_id?: string
          return_location?: string
          service_fee?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_price?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_owner"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_renter"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vehicle"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          related_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          related_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          related_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          created_at: string
          error_message: string | null
          html_content: string
          id: string
          recipient_email: string
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          status: string
          subject: string
          text_content: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          html_content: string
          id?: string
          recipient_email: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          text_content?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          html_content?: string
          id?: string
          recipient_email?: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthdate: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_email_verified: boolean | null
          is_identity_verified: boolean | null
          is_phone_verified: boolean | null
          languages: Database["public"]["Enums"]["user_language"][] | null
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birthdate?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_email_verified?: boolean | null
          is_identity_verified?: boolean | null
          is_phone_verified?: boolean | null
          languages?: Database["public"]["Enums"]["user_language"][] | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birthdate?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_email_verified?: boolean | null
          is_identity_verified?: boolean | null
          is_phone_verified?: boolean | null
          languages?: Database["public"]["Enums"]["user_language"][] | null
          last_name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"] | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          rental_id: string | null
          reviewed_id: string | null
          reviewer_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          rental_id?: string | null
          reviewed_id?: string | null
          reviewer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          rental_id?: string | null
          reviewed_id?: string | null
          reviewer_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_profiles: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_url?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["vehicle_category"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_premium?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          luggage?: number | null
          make: string
          mileage?: number | null
          model: string
          owner_id?: string | null
          price_per_day: number
          rating?: number | null
          reviews_count?: number | null
          seats?: number | null
          status?: string
          transmission?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          category?: Database["public"]["Enums"]["vehicle_category"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_premium?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          luggage?: number | null
          make?: string
          mileage?: number | null
          model?: string
          owner_id?: string | null
          price_per_day?: number
          rating?: number | null
          reviews_count?: number | null
          seats?: number | null
          status?: string
          transmission?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_vehicle_availability:
        | {
            Args: {
              p_vehicle_id: string
              p_start_date: string
              p_end_date: string
            }
            Returns: boolean
          }
        | {
            Args: {
              vehicle_id: string
              start_date: string
              end_date: string
            }
            Returns: boolean
          }
      check_vehicle_availability_v2: {
        Args: {
          p_vehicle_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_message: string
          p_related_id?: string
        }
        Returns: string
      }
      create_user_profile: {
        Args: {
          user_first_name?: string
          user_last_name?: string
          user_avatar_url?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          avatar_url: string | null
          birthdate: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_email_verified: boolean | null
          is_identity_verified: boolean | null
          is_phone_verified: boolean | null
          languages: Database["public"]["Enums"]["user_language"][] | null
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_reviews: number | null
          updated_at: string
        }[]
      }
      create_vehicle: {
        Args: {
          p_make: string
          p_model: string
          p_year: number
          p_price_per_day: number
          p_location: string
          p_description?: string
          p_images?: string[]
          p_fuel_type?: Database["public"]["Enums"]["vehicle_fuel_type"]
          p_luggage?: number
          p_mileage?: number
          p_color?: string
          p_transmission?: Database["public"]["Enums"]["vehicle_transmission"]
          p_seats?: number
          p_features?: string[]
          p_category?: string
          p_latitude?: number
          p_longitude?: number
          p_is_premium?: boolean
        }
        Returns: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }
      }
      create_vehicle_v2: {
        Args: {
          p_make: string
          p_model: string
          p_year: number
          p_price_per_day: number
          p_location: string
          p_description?: string
          p_images?: string[]
          p_fuel_type?: Database["public"]["Enums"]["vehicle_fuel_type"]
          p_luggage?: number
          p_mileage?: number
          p_color?: string
          p_transmission?: Database["public"]["Enums"]["vehicle_transmission"]
          p_seats?: number
          p_features?: string[]
          p_category?: Database["public"]["Enums"]["vehicle_category"]
          p_latitude?: number
          p_longitude?: number
          p_is_premium?: boolean
        }
        Returns: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }
      }
      get_available_vehicles:
        | {
            Args: {
              location_filter?: string
              min_price?: number
              max_price?: number
              category_filter?: Database["public"]["Enums"]["vehicle_category"]
              start_date?: string
              end_date?: string
            }
            Returns: {
              category: Database["public"]["Enums"]["vehicle_category"] | null
              color: string | null
              created_at: string
              description: string | null
              features: string[] | null
              fuel_type: string | null
              id: string
              images: string[] | null
              is_premium: boolean | null
              latitude: number | null
              location: string
              longitude: number | null
              luggage: number | null
              make: string
              mileage: number | null
              model: string
              owner_id: string | null
              price_per_day: number
              rating: number | null
              reviews_count: number | null
              seats: number | null
              status: string
              transmission: string | null
              updated_at: string
              year: number
            }[]
          }
        | {
            Args: {
              location_filter?: string
              min_price?: number
              max_price?: number
              category_filter?: string
              start_date?: string
              end_date?: string
            }
            Returns: {
              category: Database["public"]["Enums"]["vehicle_category"] | null
              color: string | null
              created_at: string
              description: string | null
              features: string[] | null
              fuel_type: string | null
              id: string
              images: string[] | null
              is_premium: boolean | null
              latitude: number | null
              location: string
              longitude: number | null
              luggage: number | null
              make: string
              mileage: number | null
              model: string
              owner_id: string | null
              price_per_day: number
              rating: number | null
              reviews_count: number | null
              seats: number | null
              status: string
              transmission: string | null
              updated_at: string
              year: number
            }[]
          }
      get_or_create_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          birthdate: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_email_verified: boolean | null
          is_identity_verified: boolean | null
          is_phone_verified: boolean | null
          languages: Database["public"]["Enums"]["user_language"][] | null
          last_name: string | null
          notification_preferences: Json | null
          phone: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_reviews: number | null
          updated_at: string
        }[]
      }
      get_owner_vehicles: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }[]
      }
      get_user_addresses: {
        Args: {
          user_id: string
        }
        Returns: {
          city: string
          country: string
          created_at: string
          id: string
          postal_code: string
          street: string
          updated_at: string
          user_id: string | null
        }[]
      }
      get_user_profile: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      profile_update_v1: {
        Args: {
          p_user_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_birthdate?: string
          p_languages?: string[]
          p_notification_preferences?: Json
        }
        Returns: Json
      }
      request_booking: {
        Args: {
          p_vehicle_id: string
          p_start_date: string
          p_end_date: string
          p_pickup_location: string
          p_return_location: string
          p_insurance_option?: string
        }
        Returns: string
      }
      search_vehicles: {
        Args: {
          location_text?: string
          start_date?: string
          end_date?: string
          min_price?: number
          max_price?: number
          category_text?: string
          fuel_type_text?: string
          transmission_text?: string
          min_seats?: number
          is_premium?: boolean
        }
        Returns: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }[]
      }
      update_user_avatar: {
        Args: {
          user_id: string
          new_avatar_url: string
        }
        Returns: boolean
      }
      update_user_profile: {
        Args: {
          profile_data: Json
          address_data?: Json
        }
        Returns: boolean
      }
      update_vehicle: {
        Args: {
          p_vehicle_id: string
          p_make?: string
          p_model?: string
          p_year?: number
          p_price_per_day?: number
          p_location?: string
          p_description?: string
          p_images?: string[]
          p_status?: string
          p_fuel_type?: string
          p_luggage?: number
          p_mileage?: number
          p_color?: string
          p_transmission?: string
          p_seats?: number
          p_features?: string[]
          p_category?: string
          p_latitude?: number
          p_longitude?: number
          p_is_premium?: boolean
        }
        Returns: {
          category: Database["public"]["Enums"]["vehicle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          features: string[] | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_premium: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          luggage: number | null
          make: string
          mileage: number | null
          model: string
          owner_id: string | null
          price_per_day: number
          rating: number | null
          reviews_count: number | null
          seats: number | null
          status: string
          transmission: string | null
          updated_at: string
          year: number
        }
      }
      upsert_user_address: {
        Args: {
          p_user_id: string
          p_street: string
          p_city: string
          p_postal_code: string
          p_country?: string
        }
        Returns: {
          city: string
          country: string
          created_at: string
          id: string
          postal_code: string
          street: string
          updated_at: string
          user_id: string | null
        }
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rejected"
      document_status: "pending" | "approved" | "rejected"
      document_type:
        | "driver_license"
        | "identity_card"
        | "vehicle_registration"
        | "insurance"
        | "proof_of_address"
      payment_status:
        | "pending"
        | "preauthorized"
        | "paid"
        | "refunded"
        | "failed"
      social_platform: "facebook" | "instagram" | "linkedin" | "twitter"
      user_language: "ar" | "fr" | "en"
      user_role: "owner" | "renter" | "admin"
      vehicle_category:
        | "SUV"
        | "Berline"
        | "Sportive"
        | "Luxe"
        | "Électrique"
        | "Familiale"
        | "Compacte"
        | "Utilitaire"
      vehicle_fuel_type: "diesel" | "essence" | "hybrid" | "electric"
      vehicle_status: "available" | "rented" | "maintenance" | "unavailable"
      vehicle_transmission: "automatic" | "manual" | "semi-automatic"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
