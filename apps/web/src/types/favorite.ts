import type { Field } from './field';

export interface Favorite {
  id: string;
  user_id: string;
  field_id: string;
  created_at: string;
  field: Field;
}

export interface FavoritesResponse {
  data: Favorite[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ToggleFavoriteResponse {
  is_favorite: boolean;
  message: string;
}
