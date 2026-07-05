export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          email: string
          full_name: string
          password_hash: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          image: string
          is_featured: boolean
          created_at: string
          updated_at: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          collection_id: string | null
          price: number
          compare_at_price: number | null
          description: string
          material: string
          colors: string[] | null
          sizes: string[] | null
          stock: number
          is_best_seller: boolean
          image: string
          created_at: string
          updated_at: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          phone: string
          commune: string
          notes: string | null
          subtotal: number
          shipping: number
          total: number
          status: string
          created_at: string
          updated_at: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: string
          product_id: string | null
          name: string
          price: number
          color: string
          size: string
          quantity: number
          image: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          author: string
          rating: number
          title: string
          body: string
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          name: string
          phone: string
          topic: string
          message: string
          is_read: boolean
          created_at: string
        }
      }
      shipping_rates: {
        Row: {
          commune: string
          amount: number
          created_at: string
          updated_at: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
