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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json | null
          school_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json | null
          school_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions_inquiries: {
        Row: {
          applicant_name: string
          created_at: string
          desired_class: string | null
          id: string
          message: string | null
          parent_email: string
          parent_name: string
          parent_phone: string | null
          school_id: string
          status: Database["public"]["Enums"]["inquiry_status"]
        }
        Insert: {
          applicant_name: string
          created_at?: string
          desired_class?: string | null
          id?: string
          message?: string | null
          parent_email: string
          parent_name: string
          parent_phone?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["inquiry_status"]
        }
        Update: {
          applicant_name?: string
          created_at?: string
          desired_class?: string | null
          id?: string
          message?: string | null
          parent_email?: string
          parent_name?: string
          parent_phone?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "admissions_inquiries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string | null
          school_id: string
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          school_id: string
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_types: {
        Row: {
          id: string
          is_exam: boolean
          name: string
          school_id: string
          weight: number
        }
        Insert: {
          id?: string
          is_exam?: boolean
          name: string
          school_id: string
          weight?: number
        }
        Update: {
          id?: string
          is_exam?: boolean
          name?: string
          school_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          assessment_type_id: string
          class_id: string
          created_at: string
          created_by: string | null
          date: string | null
          id: string
          max_score: number
          school_id: string
          subject_id: string
          term_id: string
          title: string
        }
        Insert: {
          assessment_type_id: string
          class_id: string
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          max_score: number
          school_id: string
          subject_id: string
          term_id: string
          title: string
        }
        Update: {
          assessment_type_id?: string
          class_id?: string
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          max_score?: number
          school_id?: string
          subject_id?: string
          term_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assessment_type_id_fkey"
            columns: ["assessment_type_id"]
            isOneToOne: false
            referencedRelation: "assessment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          term_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          term_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          class_teacher_id: string | null
          created_at: string
          id: string
          level: string
          name: string
          school_id: string
        }
        Insert: {
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level: string
          name: string
          school_id: string
        }
        Update: {
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string
          id?: string
          level?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports_parent: {
        Row: {
          ate_before_school: boolean | null
          comments: string | null
          created_at: string
          created_by: string | null
          date: string
          feeding_time: string | null
          food: string | null
          had_medication: boolean | null
          id: string
          medication_details: string | null
          medication_reason: string | null
          parent_comments: string | null
          pickup_info: string | null
          portion: string | null
          school_id: string
          seems: Database["public"]["Enums"]["daily_child_mood"] | null
          slept: Database["public"]["Enums"]["daily_sleep"] | null
          special_requests: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          ate_before_school?: boolean | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          feeding_time?: string | null
          food?: string | null
          had_medication?: boolean | null
          id?: string
          medication_details?: string | null
          medication_reason?: string | null
          parent_comments?: string | null
          pickup_info?: string | null
          portion?: string | null
          school_id: string
          seems?: Database["public"]["Enums"]["daily_child_mood"] | null
          slept?: Database["public"]["Enums"]["daily_sleep"] | null
          special_requests?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          ate_before_school?: boolean | null
          comments?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          feeding_time?: string | null
          food?: string | null
          had_medication?: boolean | null
          id?: string
          medication_details?: string | null
          medication_reason?: string | null
          parent_comments?: string | null
          pickup_info?: string | null
          portion?: string | null
          school_id?: string
          seems?: Database["public"]["Enums"]["daily_child_mood"] | null
          slept?: Database["public"]["Enums"]["daily_sleep"] | null
          special_requests?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_parent_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_parent_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_parent_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports_teacher: {
        Row: {
          activities: string[]
          breakfast: Database["public"]["Enums"]["daily_portion"] | null
          created_at: string
          created_by: string | null
          date: string
          id: string
          lunch: Database["public"]["Enums"]["daily_portion"] | null
          medication_given: string | null
          mood_lessons: Database["public"]["Enums"]["daily_lesson_mood"] | null
          mood_play: Database["public"]["Enums"]["daily_play_mood"] | null
          nap_start: string | null
          nap_wake: string | null
          school_id: string
          snack: Database["public"]["Enums"]["daily_portion"] | null
          student_id: string
          teacher_comments: string | null
          toileting: Json
          updated_at: string
        }
        Insert: {
          activities?: string[]
          breakfast?: Database["public"]["Enums"]["daily_portion"] | null
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          lunch?: Database["public"]["Enums"]["daily_portion"] | null
          medication_given?: string | null
          mood_lessons?: Database["public"]["Enums"]["daily_lesson_mood"] | null
          mood_play?: Database["public"]["Enums"]["daily_play_mood"] | null
          nap_start?: string | null
          nap_wake?: string | null
          school_id: string
          snack?: Database["public"]["Enums"]["daily_portion"] | null
          student_id: string
          teacher_comments?: string | null
          toileting?: Json
          updated_at?: string
        }
        Update: {
          activities?: string[]
          breakfast?: Database["public"]["Enums"]["daily_portion"] | null
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          lunch?: Database["public"]["Enums"]["daily_portion"] | null
          medication_given?: string | null
          mood_lessons?: Database["public"]["Enums"]["daily_lesson_mood"] | null
          mood_play?: Database["public"]["Enums"]["daily_play_mood"] | null
          nap_start?: string | null
          nap_wake?: string | null
          school_id?: string
          snack?: Database["public"]["Enums"]["daily_portion"] | null
          student_id?: string
          teacher_comments?: string | null
          toileting?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_teacher_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_teacher_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_teacher_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          enrolled_at: string
          id: string
          school_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          enrolled_at?: string
          id?: string
          school_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          enrolled_at?: string
          id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          location: string | null
          school_id: string
          start_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          school_id: string
          start_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          location?: string | null
          school_id?: string
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_fee_assignments: {
        Row: {
          amount: number
          created_at: string
          extra_fee_item_id: string
          id: string
          school_id: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          extra_fee_item_id: string
          id?: string
          school_id: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          extra_fee_item_id?: string
          id?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_fee_assignments_extra_fee_item_id_fkey"
            columns: ["extra_fee_item_id"]
            isOneToOne: false
            referencedRelation: "extra_fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_fee_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_fee_items: {
        Row: {
          amount: number
          class_id: string | null
          created_at: string
          description: string | null
          frequency: Database["public"]["Enums"]["extra_fee_frequency"]
          id: string
          name: string
          school_id: string
        }
        Insert: {
          amount: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["extra_fee_frequency"]
          id?: string
          name: string
          school_id: string
        }
        Update: {
          amount?: number
          class_id?: string | null
          created_at?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["extra_fee_frequency"]
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_fee_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_fee_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_items: {
        Row: {
          academic_year_id: string
          amount: number
          class_id: string
          description: string | null
          due_date: string | null
          fee_term: Database["public"]["Enums"]["fee_term"]
          id: string
          is_mandatory: boolean
          late_fee: number | null
          name: string
          school_id: string
        }
        Insert: {
          academic_year_id: string
          amount: number
          class_id: string
          description?: string | null
          due_date?: string | null
          fee_term?: Database["public"]["Enums"]["fee_term"]
          id?: string
          is_mandatory?: boolean
          late_fee?: number | null
          name: string
          school_id: string
        }
        Update: {
          academic_year_id?: string
          amount?: number
          class_id?: string
          description?: string | null
          due_date?: string | null
          fee_term?: Database["public"]["Enums"]["fee_term"]
          id?: string
          is_mandatory?: boolean
          late_fee?: number | null
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_bands: {
        Row: {
          grade: string
          id: string
          max_score: number
          min_score: number
          remark: string
          school_id: string
        }
        Insert: {
          grade: string
          id?: string
          max_score: number
          min_score: number
          remark: string
          school_id: string
        }
        Update: {
          grade?: string
          id?: string
          max_score?: number
          min_score?: number
          remark?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_bands_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string
          fee_item_id: string | null
          id: string
          invoice_id: string
          school_id: string
        }
        Insert: {
          amount: number
          description: string
          fee_item_id?: string | null
          id?: string
          invoice_id: string
          school_id: string
        }
        Update: {
          amount?: number
          description?: string
          fee_item_id?: string | null
          id?: string
          invoice_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_fee_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year_id: string
          arrears: number
          created_at: string
          discount: number
          due_date: string | null
          fee_term: Database["public"]["Enums"]["fee_term"]
          id: string
          scholarship_type: Database["public"]["Enums"]["scholarship_type"]
          school_id: string
          student_id: string
          term_id: string | null
          total_amount: number
        }
        Insert: {
          academic_year_id: string
          arrears?: number
          created_at?: string
          discount?: number
          due_date?: string | null
          fee_term?: Database["public"]["Enums"]["fee_term"]
          id?: string
          scholarship_type?: Database["public"]["Enums"]["scholarship_type"]
          school_id: string
          student_id: string
          term_id?: string | null
          total_amount?: number
        }
        Update: {
          academic_year_id?: string
          arrears?: number
          created_at?: string
          discount?: number
          due_date?: string | null
          fee_term?: Database["public"]["Enums"]["fee_term"]
          id?: string
          scholarship_type?: Database["public"]["Enums"]["scholarship_type"]
          school_id?: string
          student_id?: string
          term_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          extra_fee_assignment_id: string | null
          id: string
          invoice_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string
          recorded_by: string | null
          reference: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          amount: number
          extra_fee_assignment_id?: string | null
          id?: string
          invoice_id?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          amount?: number
          extra_fee_assignment_id?: string | null
          id?: string
          invoice_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string
          recorded_by?: string | null
          reference?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_extra_fee_assignment_id_fkey"
            columns: ["extra_fee_assignment_id"]
            isOneToOne: false
            referencedRelation: "extra_fee_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_extra_fee_assignment_id_fkey"
            columns: ["extra_fee_assignment_id"]
            isOneToOne: false
            referencedRelation: "extra_fee_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_fee_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          hire_date: string | null
          id: string
          is_active: boolean
          last_name: string
          must_change_password: boolean
          occupation: string | null
          password_changed_at: string | null
          phone: string | null
          position: string | null
          qualification: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string | null
          staff_no: string | null
          temp_password_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email: string
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          hire_date?: string | null
          id: string
          is_active?: boolean
          last_name: string
          must_change_password?: boolean
          occupation?: string | null
          password_changed_at?: string | null
          phone?: string | null
          position?: string | null
          qualification?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          staff_no?: string | null
          temp_password_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          must_change_password?: boolean
          occupation?: string | null
          password_changed_at?: string | null
          phone?: string | null
          position?: string | null
          qualification?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string | null
          staff_no?: string | null
          temp_password_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          assessment_id: string
          created_at: string
          entered_by: string | null
          grade: string | null
          id: string
          is_submitted: boolean
          remark: string | null
          school_id: string
          score: number
          student_id: string
          teacher_comment: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          entered_by?: string | null
          grade?: string | null
          id?: string
          is_submitted?: boolean
          remark?: string | null
          school_id: string
          score: number
          student_id: string
          teacher_comment?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          entered_by?: string | null
          grade?: string | null
          id?: string
          is_submitted?: boolean
          remark?: string | null
          school_id?: string
          score?: number
          student_id?: string
          teacher_comment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          active_academic_year_id: string | null
          active_term_id: string | null
          address: string | null
          ca_weight: number
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          pass_mark: number
          phone: string | null
          slug: string
        }
        Insert: {
          active_academic_year_id?: string | null
          active_term_id?: string | null
          address?: string | null
          ca_weight?: number
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pass_mark?: number
          phone?: string | null
          slug: string
        }
        Update: {
          active_academic_year_id?: string | null
          active_term_id?: string | null
          address?: string | null
          ca_weight?: number
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pass_mark?: number
          phone?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_active_term_fk"
            columns: ["active_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_active_year_fk"
            columns: ["active_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          id: string
          is_primary: boolean
          parent_profile_id: string
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          school_id: string
          student_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          parent_profile_id: string
          relationship: Database["public"]["Enums"]["guardian_relationship"]
          school_id: string
          student_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          parent_profile_id?: string
          relationship?: Database["public"]["Enums"]["guardian_relationship"]
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_parent_profile_id_fkey"
            columns: ["parent_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_no: string
          allergies: string | null
          blood_group: Database["public"]["Enums"]["blood_group"] | null
          city: string | null
          created_at: string
          date_of_birth: string
          email: string | null
          enrollment_date: string | null
          enrollment_status: Database["public"]["Enums"]["enrollment_status"]
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          initial_academic_year_id: string | null
          initial_term_id: string | null
          last_name: string
          medical_conditions: string | null
          other_names: string | null
          phone: string | null
          photo_url: string | null
          prev_average_score: string | null
          prev_class_ended: string | null
          prev_school_name: string | null
          prev_year_attended: string | null
          school_id: string
          town: string | null
        }
        Insert: {
          address?: string | null
          admission_no: string
          allergies?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          city?: string | null
          created_at?: string
          date_of_birth: string
          email?: string | null
          enrollment_date?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status"]
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          initial_academic_year_id?: string | null
          initial_term_id?: string | null
          last_name: string
          medical_conditions?: string | null
          other_names?: string | null
          phone?: string | null
          photo_url?: string | null
          prev_average_score?: string | null
          prev_class_ended?: string | null
          prev_school_name?: string | null
          prev_year_attended?: string | null
          school_id: string
          town?: string | null
        }
        Update: {
          address?: string | null
          admission_no?: string
          allergies?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group"] | null
          city?: string | null
          created_at?: string
          date_of_birth?: string
          email?: string | null
          enrollment_date?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status"]
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          initial_academic_year_id?: string | null
          initial_term_id?: string | null
          last_name?: string
          medical_conditions?: string | null
          other_names?: string | null
          phone?: string | null
          photo_url?: string | null
          prev_average_score?: string | null
          prev_class_ended?: string | null
          prev_school_name?: string | null
          prev_year_attended?: string | null
          school_id?: string
          town?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_initial_academic_year_id_fkey"
            columns: ["initial_academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_initial_term_id_fkey"
            columns: ["initial_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
        }
        Insert: {
          code?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
        }
        Update: {
          code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_report_subjects: {
        Row: {
          class_average: number | null
          class_highest: number | null
          class_lowest: number | null
          class_score: number | null
          exam_score: number | null
          grade: string | null
          id: string
          position: number | null
          remark: string | null
          report_id: string
          school_id: string
          short_code: string | null
          student_id: string
          subject_id: string | null
          subject_name: string
          total: number | null
        }
        Insert: {
          class_average?: number | null
          class_highest?: number | null
          class_lowest?: number | null
          class_score?: number | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          position?: number | null
          remark?: string | null
          report_id: string
          school_id: string
          short_code?: string | null
          student_id: string
          subject_id?: string | null
          subject_name: string
          total?: number | null
        }
        Update: {
          class_average?: number | null
          class_highest?: number | null
          class_lowest?: number | null
          class_score?: number | null
          exam_score?: number | null
          grade?: string | null
          id?: string
          position?: number | null
          remark?: string | null
          report_id?: string
          school_id?: string
          short_code?: string | null
          student_id?: string
          subject_id?: string | null
          subject_name?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "terminal_report_subjects_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "terminal_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_report_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_report_subjects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_report_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      terminal_reports: {
        Row: {
          academic_year_id: string
          attendance_present: number
          attendance_total: number
          attitude: string | null
          average_score: number | null
          class_average: number | null
          class_highest_average: number | null
          class_lowest_average: number | null
          class_id: string
          class_teacher_comment: string | null
          conduct: string | null
          enrolled_count: number | null
          generated_at: string
          head_teacher_comment: string | null
          id: string
          interest: string | null
          is_published: boolean
          level_position: number | null
          level_size: number | null
          passes: number | null
          pdf_url: string | null
          position: number | null
          promoted_to: string | null
          school_id: string
          student_id: string
          term_id: string
          total_score: number | null
        }
        Insert: {
          academic_year_id: string
          attendance_present?: number
          attendance_total?: number
          attitude?: string | null
          average_score?: number | null
          class_average?: number | null
          class_highest_average?: number | null
          class_lowest_average?: number | null
          class_id: string
          class_teacher_comment?: string | null
          conduct?: string | null
          enrolled_count?: number | null
          generated_at?: string
          head_teacher_comment?: string | null
          id?: string
          interest?: string | null
          is_published?: boolean
          level_position?: number | null
          level_size?: number | null
          passes?: number | null
          pdf_url?: string | null
          position?: number | null
          promoted_to?: string | null
          school_id: string
          student_id: string
          term_id: string
          total_score?: number | null
        }
        Update: {
          academic_year_id?: string
          attendance_present?: number
          attendance_total?: number
          attitude?: string | null
          average_score?: number | null
          class_average?: number | null
          class_highest_average?: number | null
          class_lowest_average?: number | null
          class_id?: string
          class_teacher_comment?: string | null
          conduct?: string | null
          enrolled_count?: number | null
          generated_at?: string
          head_teacher_comment?: string | null
          id?: string
          interest?: string | null
          is_published?: boolean
          level_position?: number | null
          level_size?: number | null
          passes?: number | null
          pdf_url?: string | null
          position?: number | null
          promoted_to?: string | null
          school_id?: string
          student_id?: string
          term_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "terminal_reports_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_reports_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminal_reports_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          ordinal: number
          reopening_date: string | null
          school_id: string
          start_date: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          ordinal: number
          reopening_date?: string | null
          school_id: string
          start_date: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          ordinal?: number
          reopening_date?: string | null
          school_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      extra_fee_positions: {
        Row: {
          amount: number | null
          balance: number | null
          class_id: string | null
          class_name: string | null
          fee_name: string | null
          id: string | null
          paid: number | null
          school_id: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_fee_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_positions: {
        Row: {
          academic_year_id: string | null
          arrears: number | null
          balance: number | null
          class_id: string | null
          class_name: string | null
          discount: number | null
          expected: number | null
          fee_term: Database["public"]["Enums"]["fee_term"] | null
          id: string | null
          paid: number | null
          scholarship_type:
            | Database["public"]["Enums"]["scholarship_type"]
            | null
          school_id: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      class_performance: {
        Args: never
        Returns: {
          average_score: number
          class_id: string
          class_name: string
          level: string
          students: number
        }[]
      }
      complete_password_change: { Args: never; Returns: undefined }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      current_school_id: { Args: never; Returns: string }
      dashboard_stats: {
        Args: never
        Returns: {
          attendance_rate: number
          total_revenue: number
          total_staff: number
          total_students: number
        }[]
      }
      dashboard_trends: {
        Args: never
        Returns: {
          attendance: number
          revenue: number
          staff: number
          students: number
        }[]
      }
      enrollment_trend: {
        Args: never
        Returns: {
          count: number
          month: string
        }[]
      }
      fee_collection_trend: {
        Args: never
        Returns: {
          month: string
          total: number
        }[]
      }
      is_school_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      parent_of_student: { Args: { p_student_id: string }; Returns: boolean }
      sidebar_counts: {
        Args: never
        Returns: {
          new_inquiries: number
          staff: number
          students: number
        }[]
      }
      student_attendance_summary: {
        Args: { p_student_id: string; p_term_id: string }
        Returns: {
          percentage: number
          present: number
          total: number
        }[]
      }
      teacher_teaches: {
        Args: { p_class_id: string; p_subject_id: string }
        Returns: boolean
      }
      teacher_teaches_class: { Args: { p_class_id: string }; Returns: boolean }
    }
    Enums: {
      announcement_audience: "everyone" | "parents" | "teachers"
      attendance_status: "present" | "absent" | "late"
      blood_group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      daily_child_mood: "happy" | "funny" | "other"
      daily_lesson_mood: "attentive" | "fidgeting" | "unwell"
      daily_play_mood: "mingled" | "did_not_mingle" | "unwell"
      daily_portion: "all" | "some" | "none"
      daily_sleep: "good" | "ok" | "not_well"
      enrollment_status:
        | "active"
        | "inactive"
        | "graduated"
        | "withdrawn"
        | "transferred"
      extra_fee_frequency: "one_time" | "termly" | "monthly" | "annual"
      fee_term: "full_year" | "first" | "second" | "third"
      gender: "male" | "female" | "other"
      guardian_relationship: "mother" | "father" | "guardian" | "other"
      inquiry_status:
        | "new"
        | "reviewing"
        | "accepted"
        | "rejected"
        | "converted"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "cheque"
        | "other"
      scholarship_type: "none" | "partial" | "full" | "bursary"
      user_role: "super_admin" | "school_admin" | "teacher" | "parent"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      announcement_audience: ["everyone", "parents", "teachers"],
      attendance_status: ["present", "absent", "late"],
      blood_group: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      daily_child_mood: ["happy", "funny", "other"],
      daily_lesson_mood: ["attentive", "fidgeting", "unwell"],
      daily_play_mood: ["mingled", "did_not_mingle", "unwell"],
      daily_portion: ["all", "some", "none"],
      daily_sleep: ["good", "ok", "not_well"],
      enrollment_status: [
        "active",
        "inactive",
        "graduated",
        "withdrawn",
        "transferred",
      ],
      extra_fee_frequency: ["one_time", "termly", "monthly", "annual"],
      fee_term: ["full_year", "first", "second", "third"],
      gender: ["male", "female", "other"],
      guardian_relationship: ["mother", "father", "guardian", "other"],
      inquiry_status: ["new", "reviewing", "accepted", "rejected", "converted"],
      payment_method: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "cheque",
        "other",
      ],
      scholarship_type: ["none", "partial", "full", "bursary"],
      user_role: ["super_admin", "school_admin", "teacher", "parent"],
    },
  },
} as const
