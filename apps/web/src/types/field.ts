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
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}
export interface FieldSummary {
  id: string;
  field_type_id?: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  district: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  basePricePerHour: number;
  base_price_per_hour: number;
  status?: 'ACTIVE' | 'INACTIVE';
  deleted_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  type?: FieldType | null;
  field_type?: FieldType;
  images?: FieldImage[];
  field_images?: FieldImage[];
  operatingHours?: OperatingHours[];
  field_operating_hours?: OperatingHours[];
  rating_avg?: number;
  reviews_count?: number;
  is_available_today?: boolean;
  primary_image_url?: string;
  supported_types?: string[];
}
export type Field = FieldSummary;
export interface FieldDetail extends FieldSummary {
  images: FieldImage[];
  operatingHours: OperatingHours[];
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
