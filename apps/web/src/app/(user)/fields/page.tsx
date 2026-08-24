'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { FieldCard } from '@/components/fields/field-card';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchFields } from '@/lib/api';
import { Field } from '@/types/field';

// Helper format YYYY-MM-DD -> DD/MM/YYYY
function formatDateDisplay(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

const DISTRICTS = [
  'Tất cả quận/huyện',
  'Quận 1',
  'Quận 3',
  'Quận 7',
  'Quận 10',
  'Tân Bình',
  'Bình Thạnh',
  'Gò Vấp',
  'Phú Nhuận',
  'TP. Thủ Đức',
];

const TIME_SLOTS = [
  'Tất cả',
  '06:00 - 08:00',
  '08:00 - 10:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 19:30',
  '19:30 - 21:00',
  '20:00 - 22:00',
];

const FIELD_TYPES = ['Sân 5', 'Sân 7', 'Sân 11'];

// Helper to generate pagination page numbers
function getPaginationRange(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

function FieldCardSkeleton() {
  return (
    <div className="bg-white border border-[#bccbb9]/60 rounded-2xl overflow-hidden shadow-2xs animate-pulse flex flex-col">
      <div className="aspect-16/10 bg-slate-200" />
      <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4" />
          <div className="h-3.5 bg-slate-200 rounded w-1/2" />
          <div className="h-3.5 bg-slate-200 rounded w-2/3" />
        </div>
        <div className="pt-3 border-t border-[#bccbb9]/40 flex justify-between items-center">
          <div className="h-6 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

function FieldsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [district, setDistrict] = useState(
    () => searchParams.get('district') || 'Tất cả quận/huyện',
  );
  const [date, setDate] = useState(() => searchParams.get('date') || '');
  const [timeSlot, setTimeSlot] = useState(
    () => searchParams.get('timeSlot') || 'Tất cả',
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get('type');
    return t ? t.split(',').filter(Boolean) : [];
  });
  const [maxPrice, setMaxPrice] = useState<number>(
    () => Number(searchParams.get('maxPrice')) || 1000000,
  );
  const [sortBy, setSortBy] = useState(
    () => searchParams.get('sortBy') || 'featured',
  );
  const [page, setPage] = useState<number>(
    () => Number(searchParams.get('page')) || 1,
  );

  const debouncedSearch = useDebounce(search, 350);

  const pushParams = (
    overrides: Record<string, string | number | string[] | undefined>,
  ) => {
    const params = new URLSearchParams();

    const s =
      overrides.search !== undefined ? overrides.search : debouncedSearch;
    const d = overrides.district !== undefined ? overrides.district : district;
    const dt = overrides.date !== undefined ? overrides.date : date;
    const ts = overrides.timeSlot !== undefined ? overrides.timeSlot : timeSlot;
    const st =
      overrides.selectedTypes !== undefined
        ? (overrides.selectedTypes as string[])
        : selectedTypes;
    const mp =
      overrides.maxPrice !== undefined ? Number(overrides.maxPrice) : maxPrice;
    const sb = overrides.sortBy !== undefined ? overrides.sortBy : sortBy;
    const p = overrides.page !== undefined ? Number(overrides.page) : page;

    if (s && String(s).trim()) params.set('search', String(s).trim());
    if (d && d !== 'Tất cả quận/huyện') params.set('district', String(d));
    if (dt) params.set('date', String(dt));
    if (ts && ts !== 'Tất cả') params.set('timeSlot', String(ts));
    if (Array.isArray(st) && st.length > 0) params.set('type', st.join(','));
    if (mp < 1000000) params.set('maxPrice', String(mp));
    if (sb !== 'featured') params.set('sortBy', String(sb));
    if (p > 1) params.set('page', String(p));

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    pushParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const {
    data: apiData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'fields',
      {
        debouncedSearch,
        district,
        date,
        timeSlot,
        selectedTypes: selectedTypes.join(','),
        maxPrice: maxPrice < 1000000 ? maxPrice : undefined,
        sortBy,
        page,
      },
    ],
    queryFn: () =>
      fetchFields({
        search: debouncedSearch.trim() || undefined,
        district: district !== 'Tất cả quận/huyện' ? district : undefined,
        date: date || undefined,
        timeSlot: timeSlot !== 'Tất cả' ? timeSlot : undefined,
        type: selectedTypes.length > 0 ? selectedTypes.join(',') : undefined,
        maxPrice: maxPrice < 1000000 ? maxPrice : undefined,
        sortBy: sortBy !== 'featured' ? sortBy : undefined,
        page,
        limit: 9,
      }),
  });

  const fieldsList = apiData?.data ?? [];
  const meta = apiData?.meta ?? { total: 0, page: 1, limit: 9, totalPages: 0 };
  const totalResults = meta.total;
  const totalPages = meta.totalPages;

  const toggleType = (t: string) => {
    const nextTypes = selectedTypes.includes(t)
      ? selectedTypes.filter((item) => item !== t)
      : [...selectedTypes, t];
    setSelectedTypes(nextTypes);
    setPage(1);
    pushParams({ selectedTypes: nextTypes, page: 1 });
  };

  const handleReset = () => {
    setSearch('');
    setDistrict('Tất cả quận/huyện');
    setDate('');
    setTimeSlot('Tất cả');
    setSelectedTypes([]);
    setMaxPrice(1000000);
    setSortBy('featured');
    setPage(1);
    router.replace(pathname);
  };

  const handleApply = () => {
    setPage(1);
    pushParams({ page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      pushParams({ page: newPage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-8 text-[#191c1d]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ASIDE BỘ LỌC */}
          <aside className="w-full lg:w-1/4">
            <div className="bg-white border border-[#bccbb9]/40 rounded-xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-['Manrope'] text-[#191c1d]">
                  Bộ lọc
                </h2>
                <button
                  onClick={handleReset}
                  className="text-[#006e2f] text-sm font-semibold hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Xóa lọc
                </button>
              </div>

              {/* TỪ KHÓA */}
              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Từ khóa
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#575e70] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tên sân, địa chỉ..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#bccbb9]/60 rounded-lg outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] transition-all bg-white"
                  />
                </div>
              </div>

              {/* KHU VỰC */}
              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Khu vực
                </label>
                <div className="relative">
                  <select
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setPage(1);
                      pushParams({ district: e.target.value, page: 1 });
                    }}
                    className="w-full appearance-none px-3 py-2 text-sm border border-[#bccbb9]/60 rounded-lg outline-none bg-white focus:border-[#006e2f] text-[#191c1d] cursor-pointer"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#575e70] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* NGÀY */}
              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Ngày
                </label>
                <div
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector(
                      'input[type="date"]',
                    ) as HTMLInputElement;
                    if (input) {
                      if ('showPicker' in HTMLInputElement.prototype) {
                        input.showPicker();
                      } else {
                        input.focus();
                      }
                    }
                  }}
                  className="relative border border-[#bccbb9]/60 rounded-lg bg-white px-3 py-2 text-sm cursor-pointer flex items-center justify-between select-none hover:border-[#006e2f] transition-colors"
                >
                  <span
                    className={
                      date ? 'text-[#191c1d] font-medium' : 'text-[#575e70]'
                    }
                  >
                    {date ? formatDateDisplay(date) : 'dd/mm/yyyy'}
                  </span>
                  <Calendar className="w-4 h-4 text-[#575e70] shrink-0 pointer-events-none" />
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setPage(1);
                      pushParams({ date: e.target.value, page: 1 });
                    }}
                    onKeyDown={(e) => e.preventDefault()}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              {/* KHUNG GIỜ */}
              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Khung giờ
                </label>
                <div className="relative">
                  <select
                    value={timeSlot}
                    onChange={(e) => {
                      setTimeSlot(e.target.value);
                      setPage(1);
                      pushParams({ timeSlot: e.target.value, page: 1 });
                    }}
                    className="w-full appearance-none px-3 py-2 text-sm border border-[#bccbb9]/60 rounded-lg outline-none bg-white focus:border-[#006e2f] text-[#191c1d] cursor-pointer"
                  >
                    {TIME_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#575e70] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* LOẠI SÂN */}
              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Loại sân
                </label>
                <div className="flex gap-2">
                  {FIELD_TYPES.map((t) => {
                    const isChecked = selectedTypes.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleType(t)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${isChecked
                            ? 'bg-[#22c55e] text-[#004b1e] border-[#006e2f]'
                            : 'bg-white text-[#191c1d] border-[#bccbb9]/60 hover:bg-[#f3f4f5]'
                          }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KHOẢNG GIÁ */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-semibold text-[#575e70]">
                  <span>Khoảng giá</span>
                  <span className="text-[#006e2f] font-bold">
                    {maxPrice >= 1000000
                      ? 'Tất cả mức giá'
                      : `Dưới ${maxPrice.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={1000000}
                  step={50000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#006e2f] h-2 bg-[#edeeef] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#575e70] pt-1">
                  <span>100.000đ</span>
                  <span>1.000.000đ+</span>
                </div>
              </div>

              <Button
                onClick={handleApply}
                className="w-full py-2.5 bg-[#006e2f] hover:bg-[#005321] text-white rounded-lg font-semibold text-sm transition-colors mt-2"
              >
                Áp dụng bộ lọc
              </Button>
            </div>
          </aside>

          {/* MAIN NỘI DUNG DANH SÁCH */}
          <main className="w-full lg:w-3/4 space-y-4">
            {/* THANH THỐNG KÊ & SẮP XẾP */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-[#bccbb9]/40 rounded-xl shadow-sm">
              <h1 className="text-lg font-bold font-['Manrope'] text-[#191c1d]">
                {isLoading
                  ? 'Đang tải danh sách sân bóng...'
                  : `${totalResults} sân bóng khả dụng`}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#575e70]">Sắp xếp:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      pushParams({ sortBy: e.target.value });
                    }}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold border border-[#bccbb9]/60 rounded-lg outline-none bg-white text-[#191c1d] cursor-pointer"
                  >
                    <option value="featured">Đề xuất / Mới nhất</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#575e70] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ERROR STATE */}
            {isError ? (
              <div className="bg-white border border-red-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Không thể tải dữ liệu sân bóng
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {error instanceof Error
                      ? error.message
                      : 'Đã xảy ra lỗi kết nối tới máy chủ. Vui lòng thử lại.'}
                  </p>
                </div>
                <Button
                  onClick={() => refetch()}
                  className="bg-[#006e2f] hover:bg-[#005321] text-white text-xs px-5 py-2 rounded-lg"
                >
                  Thử lại
                </Button>
              </div>
            ) : isLoading ? (
              /* LOADING SKELETON STATE */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <FieldCardSkeleton key={idx} />
                ))}
              </div>
            ) : fieldsList.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white border border-[#bccbb9]/40 rounded-xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-[#f3f4f5] rounded-full flex items-center justify-center mx-auto text-[#575e70]">
                  <Search className="w-8 h-8 text-[#575e70]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191c1d]">
                    Không tìm thấy sân bóng nào phù hợp
                  </h3>
                  <p className="text-sm text-[#575e70] mt-1">
                    Hãy thử thay đổi từ khóa hoặc mở rộng tiêu chí bộ lọc của bạn.
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="text-xs border-[#006e2f] text-[#006e2f] hover:bg-[#006e2f]/5"
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            ) : (
              /* FIELD GRID LIST */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {fieldsList.map((field: Field) => (
                  <FieldCard key={field.id} field={field} />
                ))}
              </div>
            )}

            {/* PHÂN TRANG ĐỘNG (PAGINATION) */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center pt-8 pb-10 gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || isFetching}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPaginationRange(page, totalPages).map((pageNum, idx) => {
                  if (pageNum === '...') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="text-[#575e70] text-sm px-1 select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNumber = Number(pageNum);
                  const isCurrent = page === pageNumber;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={isFetching}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${isCurrent
                          ? 'bg-[#006e2f] text-white shadow-sm'
                          : 'border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9]'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || isFetching}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// TẮT SSR VỚI dynamic() ĐỂ TRÁNH LỖI CSR BAILOUT TRÊN NEXT.JS KHI DÙNG useSearchParams
const DynamicFieldsSearchPage = dynamic(() => Promise.resolve(FieldsContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center text-[#006e2f] font-semibold text-sm">
      Đang tải dữ liệu sân bóng...
    </div>
  ),
});

export default function FieldsSearchPageWrapper() {
  return <DynamicFieldsSearchPage />;
}
