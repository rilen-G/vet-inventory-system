export type Database = {
  public: {
    Tables: {
      inventory_items: {
        Row: {
          id: number;
          item_name: string;
          company_category: string | null;
          lot_number: string;
          expiration_date: string;
          stock_quantity: number;
          low_stock_threshold: number;
          unit_price: number;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: never;
          item_name: string;
          company_category?: string | null;
          lot_number: string;
          expiration_date: string;
          stock_quantity?: number;
          low_stock_threshold?: number;
          unit_price?: number;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: number;
          invoice_number: string;
          customer_name: string;
          customer_address: string | null;
          customer_contact: string | null;
          invoice_date: string;
          due_date: string | null;
          status: "Draft" | "Finalized" | "Cancelled" | "Voided";
          subtotal: number;
          total: number;
          notes: string | null;
          void_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: never;
          invoice_number: string;
          customer_name: string;
          customer_address?: string | null;
          customer_contact?: string | null;
          invoice_date: string;
          due_date?: string | null;
          status: "Draft" | "Finalized" | "Cancelled" | "Voided";
          subtotal?: number;
          total?: number;
          notes?: string | null;
          void_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: number;
          invoice_id: number;
          inventory_item_id: number;
          item_name_snapshot: string;
          lot_number_snapshot: string | null;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: never;
          invoice_id: number;
          inventory_item_id: number;
          item_name_snapshot: string;
          lot_number_snapshot?: string | null;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: number;
          invoice_id: number;
          receipt_number: string;
          payment_date: string;
          payment_method: "Cash" | "GCash" | "Bank Transfer" | "Check";
          amount_paid: number;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: never;
          invoice_id: number;
          receipt_number: string;
          payment_date: string;
          payment_method: "Cash" | "GCash" | "Bank Transfer" | "Check";
          amount_paid: number;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: number;
          inventory_item_id: number;
          movement_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "VOID_REVERSAL";
          quantity: number;
          reference_type: string | null;
          reference_id: number | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: never;
          inventory_item_id: number;
          movement_type: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "VOID_REVERSAL";
          quantity: number;
          reference_type?: string | null;
          reference_id?: number | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      finalize_invoice: {
        Args: {
          p_invoice_id: number;
        };
        Returns: Database["public"]["Tables"]["invoices"]["Row"];
      };
      void_invoice: {
        Args: {
          p_invoice_id: number;
          p_void_reason: string;
        };
        Returns: Database["public"]["Tables"]["invoices"]["Row"];
      };
      record_payment: {
        Args: {
          p_invoice_id: number;
          p_receipt_number: string;
          p_payment_date: string;
          p_payment_method: "Cash" | "GCash" | "Bank Transfer" | "Check";
          p_amount_paid: number;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
