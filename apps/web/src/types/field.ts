import { Review, ReviewSummary } from './review';

export type FieldStatus = 'ACTIVE' | 'INACTIVE';

export interface FieldType {
  id: string;
  name: string;
  description?: string | null;
}

export interface FieldImage {
  id: string;
  field_id: string;
  storage_path: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface FieldOperatingHours {
  id: string;
  field_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open_time: string | null; // HH:mm or ISO
  close_time: string | null; // HH:mm or ISO
  is_closed: boolean;
}

export interface PriceRule {
  id: string;
  field_id: string;
  name: string;
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  price_per_hour: number;
  effective_from?: string | null;
  effective_to?: string | null;
  priority: number;
  is_active: boolean;
}

export interface SubPitch {
  id: string;
  name: string;
  type: string;
  pricePerHour: number;
}

export interface Amenity {
  icon: string;
  label: string;
  desc: string;
}

export interface Field {
  id: string;
  field_type_id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  base_price_per_hour: number;
  status: FieldStatus;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  field_type?: FieldType;
  field_types?: FieldType;
  field_images?: FieldImage[];
  field_operating_hours?: FieldOperatingHours[];
  price_rules?: PriceRule[];

  // Frontend & UI computed helpers
  rating_avg?: number;
  reviews_count?: number;
  reviewCount?: number;
  is_available_today?: boolean;
  primary_image_url?: string;
  supported_types?: string[];
  location?: string;
  pricePerHour?: number;
  image?: string;
  images?: string[];
  rating?: number;
  available?: boolean;
  type?: string;
  types?: string[];
  operatingHours?: string;
  amenities?: Amenity[];
  rules?: string[];
  subPitches?: SubPitch[];
  reviews?: Review[];
}

export interface FieldsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FieldsResponse {
  data: Field[];
  meta: FieldsMeta;
}

export interface FieldReviewsResponse {
  data: Review[];
  meta: FieldsMeta;
  summary: ReviewSummary;
}
