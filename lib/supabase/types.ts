// Database type definitions for Manhattan Mint
// These mirror the tables defined in schema.sql

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type CleanerStatus = "active" | "inactive" | "pending_onboarding";

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          stripe_customer_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          address: string;
          apt_no: string | null;
          key_access: boolean;
          access_notes: string | null;
          sms_reminder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          customer_id: string;
          status: BookingStatus;
          frequency: string;
          bedrooms: number | null;
          bathrooms: number | null;
          service_summary: string | null;
          service_date: string;
          preferred_time_ranges: string[];
          selected_extras: Array<{ label: string; price: number }>;
          cleaning_notes: string | null;
          coupon_code: string | null;
          pricing_total: number;
          pricing_subtotal: number;
          pricing_next_clean_total: number | null;
          stripe_payment_method_id: string | null;
          stripe_customer_id: string | null;
          assigned_cleaner_id: string | null;
          calendar_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      cleaners: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string;
          status: CleanerStatus;
          zones: string[];
          rating: number | null;
          pay_rate_pct: number;
          stripe_account_id: string | null;
          certn_report_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cleaners"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cleaners"]["Insert"]>;
      };
      email_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          source?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_subscribers"]["Insert"]>;
      };
    };
  };
}
