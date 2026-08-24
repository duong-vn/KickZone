import { Review, ReviewSummary } from './review';

export type FieldStatus = 'ACTIVE' | 'INACTIVE';

export interface FieldType {
  id: string;
  name: string;
  description?: string | null;
}

export interface FieldImage {
  id: string;
  field_id?: string;
  storagePath?: string;
  storage_path?: string;
  altText?: string | null;
  alt_text?: string | null;
  sortOrder?: number;
  sort_order?: number;
  isPrimary?: boolean;
  is_primary?: boolean;
  created_at?: string;
}

export interface OperatingHours {
  dayOfWeek?: number;
  day_of_week?: number;
  openTime?: string | null;
  open_time?: string | null;
  closeTime?: string | null;
  close_time?: string | null;
  isClosed?: boolean;
  is_closed?: boolean;
}

export interface FieldOperatingHours {
  id: string;
  field_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface PriceRule {
  id: string;
  field_id: string;
  name?: string | null;
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
  field_type_id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  address: string;
  city?: string;
  district?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  basePricePerHour?: number;
  base_price_per_hour?: number;
  status?: FieldStatus;
  deleted_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  type?: FieldType | string | null;
  types?: string[];
  field_type?: FieldType;
  field_types?: FieldType;
  image?: string;
  images?: string[] | FieldImage[];
  primary_image_url?: string;
  field_images?: FieldImage[];
  field_operating_hours?: OperatingHours[];
  operatingHours?: string | OperatingHours[];
  price_rules?: PriceRule[];
  rating?: number;
  rating_avg?: number;
  reviews_count?: number;
  reviewCount?: number;
  is_available_today?: boolean;
  supported_types?: string[];
  location?: string;
  pricePerHour?: number;
  available?: boolean;
  amenities?: Amenity[];
  rules?: string[];
  subPitches?: SubPitch[];
  reviews?: Review[];
}

export interface FieldDetail extends Field {
  basePricePerHour: number;
  base_price_per_hour: number;
  images: string[] | FieldImage[];
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
}

export interface AvailabilityResponse {
  fieldId: string;
  date: string;
  timeZone: string;
  slots: AvailabilitySlot[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
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
