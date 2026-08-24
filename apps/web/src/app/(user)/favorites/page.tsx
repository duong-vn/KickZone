/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  MapPin,
  Star,
  Search,
  SlidersHorizontal,
  Users,
  Compass,
  RotateCcw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Favorite } from '@/types/favorite';
import { MOCK_FAVORITES } from '@/data/mock-favorites';

// Helper format VND currency
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  })
    .format(amount)
    .replace('₫', 'đ');
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mới lưu' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'price-asc', label: 'Giá thấp → cao' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>(MOCK_FAVORITES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortValue>('recent');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique districts from active favorites
  const districts = useMemo(() => {
    const set = new Set<string>();
    MOCK_FAVORITES.forEach((fav) => {
      if (fav.field.district) set.add(fav.field.district);
    });
    return Array.from(set);
  }, []);

  // Handle Remove Favorite with Toast + Undo
  const handleRemoveFavorite = (favorite: Favorite) => {
    const removedId = favorite.id;
    const removedItem = favorite;

    // Optimistic removal
    setFavorites((prev) => prev.filter((item) => item.id !== removedId));

    toast.success(`Đã xóa "${favorite.field.name}" khỏi danh sách yêu thích`, {
      description: 'Bạn có thể hoàn tác nếu bấm nhầm.',
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          setFavorites((prev) => {
            if (prev.some((item) => item.id === removedId)) return prev;
            return [removedItem, ...prev];
          });
          toast.info(`Đã khôi phục "${favorite.field.name}" vào yêu thích.`);
        },
      },
    });
  };

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    return favorites
      .filter((fav) => {
        const field = fav.field;
        const matchesQuery =
          field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          field.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (field.district &&
            field.district.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDistrict =
          selectedDistrict === 'all' || field.district === selectedDistrict;

        return matchesQuery && matchesDistrict;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.field.rating_avg ?? 0) - (a.field.rating_avg ?? 0);
        }
        if (sortBy === 'price-asc') {
          return (
            (a.field.base_price_per_hour ?? a.field.basePricePerHour ?? 0) -
            (b.field.base_price_per_hour ?? b.field.basePricePerHour ?? 0)
          );
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [favorites, searchQuery, selectedDistrict, sortBy]);

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Mới lưu';

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] font-['Inter',sans-serif] pb-16">
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header Title & Subtitle */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-['Manrope',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#191c1d] tracking-tight">
                Sân yêu thích
              </h1>
              <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-bold text-[#006e2f]">
                {favorites.length} sân đã lưu
              </span>
            </div>
            <p className="mt-1.5 font-['Inter',sans-serif] text-sm text-[#575e70]">
              Danh sách các sân bóng bạn đã lưu lại để đặt nhanh.
            </p>
          </div>

          <Link href="/fields">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#bccbb9] bg-white text-xs font-semibold text-[#191c1d] hover:bg-[#f3f4f5] hover:text-[#006e2f] transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Compass className="w-4 h-4 text-[#006e2f]" />
              Khám phá thêm sân
            </button>
          </Link>
        </div>

        {/* Minimalist Filter & Search Bar */}
        {favorites.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[#bccbb9]/50 bg-white p-3 sm:p-4 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#575e70]" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sân, quận hoặc địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#bccbb9]/70 bg-[#f8f9fa] py-2 pl-10 pr-4 text-xs sm:text-sm text-[#191c1d] placeholder:text-[#575e70]/70 focus:border-[#006e2f] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* District Filter Pills & Custom Sort Dropdown */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                {/* District Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict('all')}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      selectedDistrict === 'all'
                        ? 'bg-[#006e2f] text-white shadow-2xs'
                        : 'bg-[#f3f4f5] text-[#575e70] hover:bg-[#edeeef]'
                    }`}
                  >
                    Tất cả
                  </button>
                  {districts.map((district) => (
                    <button
                      key={district}
                      type="button"
                      onClick={() => setSelectedDistrict(district)}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        selectedDistrict === district
                          ? 'bg-[#006e2f] text-white shadow-2xs'
                          : 'bg-[#f3f4f5] text-[#575e70] hover:bg-[#edeeef]'
                      }`}
                    >
                      {district}
                    </button>
                  ))}
                </div>

                {/* Custom Sort Dropdown (No native select) */}
                <div ref={sortRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSortOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#bccbb9]/70 bg-[#f8f9fa] px-3 py-1.5 text-xs font-semibold text-[#191c1d] hover:bg-white hover:border-[#006e2f] transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#575e70]" />
                    <span>{currentSortLabel}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#575e70] transition-transform duration-200 ${
                        isSortOpen ? 'rotate-180 text-[#006e2f]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#bccbb9]/60 bg-white p-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-150">
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = opt.value === sortBy;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.value);
                              setIsSortOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#006e2f]/10 font-bold text-[#006e2f]'
                                : 'text-[#191c1d] hover:bg-[#f3f4f5]'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#006e2f]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4-Column Favorites Grid (Sleek, Compact & Clean) */}
        {filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFavorites.map((item) => {
              const field = item.field;
              return (
                <article
                  key={item.id}
                  className="bg-white border border-[#bccbb9]/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-[#e1e3e4]">
                    <img
                      src={field.primary_image_url || '/placeholder-pitch.jpg'}
                      alt={field.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

                    {/* Unfavorite Heart Top-Right */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(item)}
                      title="Bỏ khỏi yêu thích"
                      aria-label={`Bỏ yêu thích ${field.name}`}
                      className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs rounded-full p-2 flex items-center justify-center cursor-pointer hover:bg-white shadow-xs transition-all hover:scale-110 active:scale-95"
                    >
                      <Heart className="w-4 h-4 fill-[#ba1a1a] text-[#ba1a1a]" />
                    </button>

                    {/* Status Pill Bottom-Left */}
                    {field.is_available_today ? (
                      <div className="absolute bottom-2.5 left-2.5 bg-[#22c55e] text-[#004b1e] px-2 py-0.5 rounded-md font-['Inter',sans-serif] text-[11px] font-bold shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#004b1e] animate-pulse" />
                        Còn sân hôm nay
                      </div>
                    ) : (
                      <div className="absolute bottom-2.5 left-2.5 bg-[#e1e3e4]/95 text-[#575e70] px-2 py-0.5 rounded-md font-['Inter',sans-serif] text-[11px] font-semibold shadow-xs">
                        Kín lịch hôm nay
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    {/* Title and Rating */}
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <Link
                        href={`/fields/${field.id}`}
                        className="hover:text-[#006e2f] transition-colors"
                      >
                        <h2 className="font-['Manrope',sans-serif] text-base font-bold text-[#191c1d] line-clamp-1">
                          {field.name}
                        </h2>
                      </Link>

                      {/* Rating pill */}
                      <div className="flex items-center gap-1 bg-[#edeeef] py-0.5 px-1.5 rounded-md shrink-0">
                        <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                        <span className="font-['Inter',sans-serif] text-[11px] font-bold text-[#191c1d]">
                          {field.rating_avg?.toFixed(1) || '4.8'}
                        </span>
                        <span className="font-['Inter',sans-serif] text-[10px] text-[#575e70]">
                          ({field.reviews_count || 0})
                        </span>
                      </div>
                    </div>

                    {/* Location & Types */}
                    <div className="space-y-1.5 mb-4 flex-grow text-xs text-[#575e70]">
                      <div className="flex items-start gap-1.5 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#575e70] mt-0.5" />
                        <p className="line-clamp-2">{field.address}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 shrink-0 text-[#575e70]" />
                        <span className="line-clamp-1">
                          {field.supported_types &&
                          field.supported_types.length > 0
                            ? field.supported_types.join(' • ')
                            : 'Sân 5 người • Sân 7 người'}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#bccbb9]/40">
                      <div>
                        <span className="font-['Inter',sans-serif] text-[11px] text-[#575e70] block leading-none mb-0.5">
                          Từ
                        </span>
                        <div className="font-['Manrope',sans-serif] text-base font-extrabold text-[#006e2f]">
                          {formatVND(
                            field.base_price_per_hour ??
                              field.basePricePerHour ??
                              0,
                          )}
                          <span className="font-['Inter',sans-serif] text-[11px] font-normal text-[#575e70]">
                            /giờ
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Secondary heart toggle button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(item)}
                          title="Bỏ thích"
                          className="p-1.5 rounded-lg border border-[#bccbb9] text-[#575e70] hover:bg-[#edeeef] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>

                        {/* CTA button: Đặt ngay (green) hoặc Xem chi tiết (outline) */}
                        {field.is_available_today ? (
                          <Link href={`/fields/${field.id}`}>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-[#006e2f] text-white font-['Inter',sans-serif] text-xs font-semibold rounded-lg hover:bg-[#006e2f]/90 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              Đặt ngay
                            </button>
                          </Link>
                        ) : (
                          <Link href={`/fields/${field.id}`}>
                            <button
                              type="button"
                              className="px-3 py-1.5 border border-[#006e2f] text-[#006e2f] font-['Inter',sans-serif] text-xs font-semibold rounded-lg hover:bg-[#006e2f]/10 transition-all shadow-2xs active:scale-95 cursor-pointer"
                            >
                              Xem chi tiết
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-[#bccbb9] bg-white">
            <div className="w-16 h-16 bg-[#edeeef] rounded-full flex items-center justify-center mb-5 text-[#575e70]">
              <Heart className="w-8 h-8 text-[#575e70] stroke-[1.5]" />
            </div>

            {searchQuery || selectedDistrict !== 'all' ? (
              <>
                <h3 className="font-['Manrope',sans-serif] text-xl font-bold text-[#191c1d] mb-2">
                  Không tìm thấy sân phù hợp
                </h3>
                <p className="font-['Inter',sans-serif] text-sm text-[#575e70] max-w-md mb-6">
                  Không có sân bóng nào khớp với từ khóa tìm kiếm hoặc bộ lọc
                  khu vực bạn đã chọn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDistrict('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#bccbb9] bg-white text-xs font-semibold text-[#191c1d] hover:bg-[#f3f4f5] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại bộ lọc
                </button>
              </>
            ) : (
              <>
                <h2 className="font-['Manrope',sans-serif] text-xl font-bold text-[#191c1d] mb-2">
                  Bạn chưa lưu sân nào
                </h2>
                <p className="font-['Inter',sans-serif] text-sm text-[#575e70] max-w-md mb-6">
                  Hãy thả tim các sân bóng bạn thích để dễ dàng đặt lại trong
                  tương lai.
                </p>
                <Link href="/fields">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006e2f] text-white font-['Inter',sans-serif] text-xs font-semibold rounded-xl hover:bg-[#006e2f]/90 transition-colors shadow-md active:scale-95 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    Khám phá sân bóng
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
