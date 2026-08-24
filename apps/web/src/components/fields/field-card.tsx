/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Star, Users } from 'lucide-react';
import { Field } from '@/types/field';

export const DEFAULT_FIELD_IMAGE =
  'https://images.unsplash.com/photo-1529900240051-5120302b7405?auto=format&fit=crop&w=800&q=80';

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
    return field.supported_types.join(' • ');
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
    return rawTypes
      .map((name) => {
        if (!name) return 'Sân 7 người';
        const clean = name.toLowerCase().trim();
        if (clean.includes('5')) return 'Sân 5 người';
        if (clean.includes('7')) return 'Sân 7 người';
        if (clean.includes('11')) return 'Sân 11 người';
        return name;
      })
      .join(' • ');
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
  isFavorite = false,
  onToggleFavorite,
  showFavoriteButton = true,
}: FieldCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [imgSrc, setImgSrc] = useState(
    field.primary_image_url || field.image || DEFAULT_FIELD_IMAGE,
  );

  const price = field.base_price_per_hour ?? field.pricePerHour ?? 0;
  const rating = field.rating_avg ?? field.rating ?? 5.0;
  const reviewsCount = field.reviews_count ?? 0;
  const isAvailable = field.is_available_today ?? field.available ?? true;
  const location = field.location || field.address || `${field.district}, TP.HCM`;
  const typeDisplay = formatFieldTypes(field);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !favorite;
    setFavorite(nextState);
    if (onToggleFavorite) {
      onToggleFavorite(field);
    }
  };

  return (
    <article className="bg-white border border-[#bccbb9]/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      {/* Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-[#e1e3e4]">
        <img
          src={imgSrc}
          alt={field.name}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_FIELD_IMAGE;
            setImgSrc(DEFAULT_FIELD_IMAGE);
          }}
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
            title={favorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            aria-label={`Yêu thích ${field.name}`}
            className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs rounded-full p-2 flex items-center justify-center cursor-pointer hover:bg-white shadow-xs transition-all hover:scale-110 active:scale-95 z-10"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                favorite
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
            <span className="font-['Inter',sans-serif] text-[11px] font-bold text-[#191c1d]">
              {rating.toFixed(1)}
            </span>
            <span className="font-['Inter',sans-serif] text-[10px] text-[#575e70]">
              ({reviewsCount})
            </span>
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
