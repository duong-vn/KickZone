/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Star, Users } from 'lucide-react';
import { Field } from '@/types/field';
import { formatFieldTypeName } from '@/lib/utils';
import {
  useFavoriteStatusQuery,
  useFavoritesQuery,
  useToggleFavoriteMutation,
} from '@/hooks/use-favorites';

export const DEFAULT_FIELD_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';

// Helper to extract primary representative image for a field
export function getFieldPrimaryImage(field?: Field | null): string {
  if (!field) return DEFAULT_FIELD_IMAGE;

  // 1. Search in field_images for is_primary === true or isPrimary === true
  if (field.field_images && Array.isArray(field.field_images)) {
    const primary = field.field_images.find(
      (img) => img.is_primary === true || img.isPrimary === true,
    );
    if (primary?.storage_path) return primary.storage_path;
    if (primary?.storagePath) return primary.storagePath;
  }

  // 2. Check explicit primary_image_url
  if (field.primary_image_url) return field.primary_image_url;

  // 3. Check image property
  if (field.image) return field.image;

  // 4. Check image_url property (used in some API responses)
  if ((field as unknown as { image_url?: string }).image_url) {
    return (field as unknown as { image_url?: string }).image_url!;
  }

  // 5. Check first image in field_images
  if (
    field.field_images &&
    Array.isArray(field.field_images) &&
    field.field_images.length > 0
  ) {
    const first = field.field_images[0];
    if (first?.storage_path) return first.storage_path;
    if (first?.storagePath) return first.storagePath;
  }

  // 6. Check images array
  if (field.images && Array.isArray(field.images) && field.images.length > 0) {
    const first = field.images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      if ('storage_path' in first && first.storage_path)
        return first.storage_path;
      if ('storagePath' in first && first.storagePath)
        return first.storagePath as string;
    }
  }

  return DEFAULT_FIELD_IMAGE;
}

// Format currency VND
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', 'đ');
}

// Helper to format field type display
export function formatFieldTypes(field: Field): string {
  if (field.supported_types && field.supported_types.length > 0) {
    return field.supported_types
      .map((name) => formatFieldTypeName(name))
      .join(' • ');
  }

  const rawTypes =
    field.types && field.types.length > 0
      ? field.types
      : field.field_type?.name
        ? [field.field_type.name]
        : typeof field.type === 'string'
          ? [field.type]
          : field.type?.name
            ? [field.type.name]
            : [];

  if (rawTypes.length > 0) {
    return rawTypes.map((name) => formatFieldTypeName(name)).join(' • ');
  }

  return 'Sân 7 người';
}

interface FieldCardProps {
  field: Field;
  isFavorite?: boolean;
  onToggleFavorite?: (field: Field) => void;
  showFavoriteButton?: boolean;
}

export function FieldCard({
  field,
  isFavorite,
  onToggleFavorite,
  showFavoriteButton = true,
}: FieldCardProps) {
  const { data: favoritesData } = useFavoritesQuery();
  const { data: favoriteStatus } = useFavoriteStatusQuery(field.id, false);
  const toggleFavMutation = useToggleFavoriteMutation(field.id);

  const isFavorited =
    isFavorite ??
    favoriteStatus?.is_favorite ??
    Boolean(
      favoritesData?.data?.some(
        (fav) => fav.field_id === field.id || fav.field?.id === field.id,
      ),
    );

  const [hasImageError, setHasImageError] = useState(false);
  const primaryImage = getFieldPrimaryImage(field);
  const imageSrc = hasImageError ? DEFAULT_FIELD_IMAGE : primaryImage;

  const price = field.base_price_per_hour ?? field.pricePerHour ?? 0;
  const rating = field.rating_avg ?? field.rating ?? 0;
  const reviewsCount = field.reviews_count ?? field.reviewCount ?? 0;
  const isAvailable = field.is_available_today ?? field.available ?? true;
  const location =
    field.location || field.address || `${field.district}, TP.HCM`;
  const typeDisplay = formatFieldTypes(field);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(field);
    } else if (field?.id) {
      toggleFavMutation.mutate();
    }
  };

  return (
    <article className="bg-white border border-[#bccbb9]/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      {/* Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#e1e3e4]">
        <img
          src={imageSrc}
          alt={field.name}
          onError={() => setHasImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

        {/* Single Favorite Heart Button (Top-Right) */}
        {showFavoriteButton && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={toggleFavMutation.isPending}
            title={isFavorited ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            aria-label={`Yêu thích ${field.name}`}
            className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs rounded-full p-2 flex items-center justify-center cursor-pointer hover:bg-white shadow-xs transition-all hover:scale-110 active:scale-95 z-10"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited
                  ? 'fill-[#ba1a1a] text-[#ba1a1a]'
                  : 'text-[#575e70] hover:text-[#ba1a1a]'
              }`}
            />
          </button>
        )}

        {/* Status Pill Bottom-Left */}
        {isAvailable ? (
          <div className="absolute bottom-2.5 left-2.5 bg-[#22c55e] text-[#004b1e] px-2.5 py-0.5 rounded-md font-['Inter',sans-serif] text-[11px] font-bold shadow-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004b1e] animate-pulse" />
            Còn sân
          </div>
        ) : (
          <div className="absolute bottom-2.5 left-2.5 bg-[#e1e3e4]/95 text-[#575e70] px-2.5 py-0.5 rounded-md font-['Inter',sans-serif] text-[11px] font-semibold shadow-xs">
            Hết sân
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title and Rating */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <Link
            href={`/fields/${field.id}`}
            className="hover:text-[#006e2f] transition-colors flex-1"
          >
            <h2 className="font-['Manrope',sans-serif] text-base font-bold text-[#191c1d] line-clamp-1">
              {field.name}
            </h2>
          </Link>

          {/* Rating pill */}
          <div className="flex items-center gap-1 bg-[#edeeef] py-0.5 px-1.5 rounded-md shrink-0">
            <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
            {reviewsCount > 0 ? (
              <>
                <span className="font-['Inter',sans-serif] text-[11px] font-bold text-[#191c1d]">
                  {Number(rating).toFixed(1)}
                </span>
                <span className="font-['Inter',sans-serif] text-[10px] text-[#575e70]">
                  ({reviewsCount})
                </span>
              </>
            ) : (
              <span className="font-['Inter',sans-serif] text-[10px] font-medium text-[#575e70]">
                Chưa có đánh giá
              </span>
            )}
          </div>
        </div>

        {/* Location & Types */}
        <div className="space-y-1.5 mb-4 flex-grow text-xs text-[#575e70]">
          <div className="flex items-start gap-1.5 leading-relaxed">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#006e2f] mt-0.5" />
            <p className="line-clamp-2">{location}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 shrink-0 text-[#575e70]" />
            <span className="line-clamp-1 font-medium">{typeDisplay}</span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#bccbb9]/40">
          <div>
            <span className="font-['Inter',sans-serif] text-[11px] text-[#575e70] block leading-none mb-0.5">
              Từ
            </span>
            <div className="font-['Manrope',sans-serif] text-base font-extrabold text-[#006e2f]">
              {formatVND(price)}
              <span className="font-['Inter',sans-serif] text-[11px] font-normal text-[#575e70]">
                /giờ
              </span>
            </div>
          </div>

          <div>
            <Link href={`/fields/${field.id}`}>
              <button
                type="button"
                className={`px-4 py-1.5 font-['Inter',sans-serif] text-xs font-semibold rounded-lg transition-all shadow-2xs active:scale-95 cursor-pointer ${
                  isAvailable
                    ? 'bg-[#006e2f] text-white hover:bg-[#005321]'
                    : 'border border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/10'
                }`}
              >
                {isAvailable ? 'Đặt ngay' : 'Xem chi tiết'}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
