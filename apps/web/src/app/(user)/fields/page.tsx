/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { fetchFields } from '@/lib/api';

// Helper format YYYY-MM-DD -> DD/MM/YYYY
function formatDateDisplay(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

interface FieldItem {
  id: string;
  name: string;
  location: string;
  district?: string;
  types?: string[];
  type?: string;
  rating: number;
  pricePerHour: number;
  available?: boolean;
  image: string;
}

const MOCK_FIELDS: FieldItem[] = [
  {
    id: '1',
    name: 'Sân Chảo Lửa',
    location: '30 Phan Thúc Duyện, Tân Bình',
    district: 'Tân Bình',
    types: ['Sân 5', 'Sân 7'],
    rating: 4.8,
    pricePerHour: 250000,
    available: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
  },
  {
    id: '2',
    name: 'Sân K34',
    location: 'Nguyễn Thị Minh Khai, Quận 1',
    district: 'Quận 1',
    types: ['Sân 7'],
    rating: 4.5,
    pricePerHour: 300000,
    available: false,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rq8ne4IOVVio5VQy3uaUSlBYmkmgetmT20pt5-fgTOOZgnCBxzUc9RzETSFMsbKADKJZSwChjnHmm_sr-7aKTnl8wkNAZtEcwYF__8UJUJdAzeUDOurOC6k1kWsYiPQVdp31h24McPQ5-4rzObUdgsrTNpsJAA_-3KuLkN342DGPvl8jzGzZshku4eDc86lF7BM8ybPOYP5yojP7TGV8RI_HQAqk0TL_BHfbvXa8h3PlqTTqPEOIVA',
  },
  {
    id: '3',
    name: 'Sân ĐH Tôn Đức Thắng',
    location: 'Nguyễn Hữu Thọ, Quận 7',
    district: 'Quận 7',
    types: ['Sân 11'],
    rating: 4.9,
    pricePerHour: 800000,
    available: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2xE5yic2QHVvAqARF7Bnyi4HqzWmPfrZDHikx8s3unwe_Ge_sVVJ0ClvSMNaoPL8Fe-1xO9NnM19thd8s-h7uSOUkSSCu1gODikd4Gd-P_mza95dVWCZlhwbFlXdhAiY5m1ljnfxxqwx1loSCGMvEs4WOOG9fu5HhvxQR-37aqtHQ76ihT-Yb35-_2J4oT3iJWU8aoPUzGn9eso_QXWawiSKb436K4Lartu7XiFxnF4I08vv9MXyrOA',
  },
  {
    id: '4',
    name: 'Sân bóng mini Lan Anh',
    location: 'Cách Mạng Tháng 8, Quận 10',
    district: 'Quận 10',
    types: ['Sân 5', 'Sân 7'],
    rating: 4.6,
    pricePerHour: 350000,
    available: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrDOm7rj2skKxqydXGm_2fCgpc8cOSpWpfQNWUjSyk-4a8dJ67OgaVYU9_8gXoZ7zVsNGiHktsLNrqgaBE1jMnGFe72lXAoL0bQmZNUNz0h8Wq87FFOo9oVZ2a87dzJkPll6s7TwgQcznmgYmfIyimnqqxY8RK6lLhDcZ4Bit1ySrjYbD52BLS0WIM6cOxPrR_ocu92EJjPiaknq_yREXKh7BKesXc5k_Se9YStukY_4DUzkvKvmPf1Q',
  },
  {
    id: '5',
    name: 'Sân bóng đá Thảo Điền',
    location: 'Nguyễn Văn Hưởng, TP. Thủ Đức',
    district: 'TP. Thủ Đức',
    types: ['Sân 7', 'Sân 11'],
    rating: 4.7,
    pricePerHour: 600000,
    available: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2xE5yic2QHVvAqARF7Bnyi4HqzWmPfrZDHikx8s3unwe_Ge_sVVJ0ClvSMNaoPL8Fe-1xO9NnM19thd8s-h7uSOUkSSCu1gODikd4Gd-P_mza95dVWCZlhwbFlXdhAiY5m1ljnfxxqwx1loSCGMvEs4WOOG9fu5HhvxQR-37aqtHQ76ihT-Yb35-_2J4oT3iJWU8aoPUzGn9eso_QXWawiSKb436K4Lartu7XiFxnF4I08vv9MXyrOA',
  },
  {
    id: '6',
    name: 'Sân vận động Gia Định',
    location: 'Hoàng Minh Giám, Gò Vấp',
    district: 'Gò Vấp',
    types: ['Sân 5'],
    rating: 4.4,
    pricePerHour: 220000,
    available: false,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Rq8ne4IOVVio5VQy3uaUSlBYmkmgetmT20pt5-fgTOOZgnCBxzUc9RzETSFMsbKADKJZSwChjnHmm_sr-7aKTnl8wkNAZtEcwYF__8UJUJdAzeUDOurOC6k1kWsYiPQVdp31h24McPQ5-4rzObUdgsrTNpsJAA_-3KuLkN342DGPvl8jzGzZshku4eDc86lF7BM8ybPOYP5yojP7TGV8RI_HQAqk0TL_BHfbvXa8h3PlqTTqPEOIVA',
  },
];

const DISTRICTS = [
  'Tất cả quận/huyện',
  'Quận 1',
  'Quận 7',
  'Quận 10',
  'Tân Bình',
  'Gò Vấp',
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

// ==========================================
// THÀNH PHẦN CHÍNH (ĐƯỢC ẨN KHỎI TRÌNH BUILD SSR)
// ==========================================
function FieldsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    return t ? t.split(',') : [];
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
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  useEffect(() => {
    pushParams({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data: apiData } = useQuery({
    queryKey: [
      'fields',
      {
        debouncedSearch,
        district,
        date,
        timeSlot,
        selectedTypes,
        maxPrice,
        sortBy,
        page,
      },
    ],
    queryFn: () =>
      fetchFields({
        search: debouncedSearch,
        district: district === 'Tất cả quận/huyện' ? '' : district,
        date,
        timeSlot: timeSlot === 'Tất cả' ? '' : timeSlot,
        type: selectedTypes.join(','),
        maxPrice,
        page,
      }),
    retry: false,
  });

  const filteredMockData = useMemo(() => {
    let result = [...MOCK_FIELDS];

    if (debouncedSearch.trim()) {
      const keyword = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(keyword) ||
          f.location.toLowerCase().includes(keyword),
      );
    }

    if (district && district !== 'Tất cả quận/huyện') {
      result = result.filter((f) => {
        if (f.district) {
          return f.district.toLowerCase() === district.toLowerCase();
        }
        const regex = new RegExp(
          `(^|\\b|[,\\s])${district}($|\\b|[,\\s])`,
          'i',
        );
        return regex.test(f.location);
      });
    }

    if (selectedTypes.length > 0) {
      result = result.filter((f) =>
        selectedTypes.every((t) => f.types?.includes(t) ?? false),
      );
    }

    result = result.filter((f) => f.pricePerHour <= maxPrice);

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [debouncedSearch, district, selectedTypes, maxPrice, sortBy]);

  const displayFields =
    apiData?.data && apiData.data.length > 0 ? apiData.data : filteredMockData;
  const totalResults = apiData?.meta?.total ?? displayFields.length;

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

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-8 text-[#191c1d]">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-1/4">
            <div className="bg-white border border-[#bccbb9]/40 rounded-xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-['Manrope'] text-[#191c1d]">
                  Bộ lọc
                </h2>
                <button
                  onClick={handleReset}
                  className="text-[#006e2f] text-sm font-semibold hover:underline"
                >
                  Xóa lọc
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#575e70] block mb-1.5">
                  Từ khóa
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#575e70] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tên sân, địa điểm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-[#bccbb9]/60 rounded-lg outline-none focus:border-[#006e2f] focus:ring-1 focus:ring-[#006e2f] transition-all bg-white"
                  />
                </div>
              </div>

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
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                          isChecked
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

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-semibold text-[#575e70]">
                  <span>Khoảng giá</span>
                  <span className="text-[#006e2f] font-bold">
                    {maxPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={50000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#006e2f] h-2 bg-[#edeeef] rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#575e70] pt-1">
                  <span>0đ</span>
                  <span>1.000.000đ+</span>
                </div>
              </div>

              <Button
                onClick={handleApply}
                className="w-full py-2.5 bg-[#006e2f] hover:bg-[#005321] text-white rounded-lg font-semibold text-sm transition-colors mt-2"
              >
                Áp dụng
              </Button>
            </div>
          </aside>

          <main className="w-full lg:w-3/4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-[#bccbb9]/40 rounded-xl shadow-sm">
              <h1 className="text-lg font-bold font-['Manrope'] text-[#191c1d]">
                {totalResults} sân bóng tại TP.HCM
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
                    <option value="featured">Đề xuất</option>
                    <option value="rating">Đánh giá cao</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#575e70] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {displayFields.length === 0 ? (
              <div className="bg-white border border-[#bccbb9]/40 rounded-xl p-12 text-center space-y-3">
                <p className="text-[#575e70] font-medium">
                  Không tìm thấy sân bóng nào phù hợp với bộ lọc.
                </p>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="text-xs border-[#006e2f] text-[#006e2f]"
                >
                  Đặt lại bộ lọc
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayFields.map((field: FieldItem) => {
                  const isAvailable = field.available ?? true;
                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-[#bccbb9]/40 rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300 flex flex-col group"
                    >
                      <div className="h-48 relative overflow-hidden bg-slate-100">
                        <img
                          src={field.image}
                          alt={field.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div
                          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-xs font-semibold ${
                            isAvailable
                              ? 'bg-[#22c55e] text-[#004b1e]'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          {isAvailable ? 'Còn sân' : 'Đã đặt'}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                        <div>
                          <h3 className="font-bold text-base text-[#191c1d] line-clamp-1 font-['Manrope'] mb-1">
                            {field.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[#575e70] text-xs mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{field.location}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {field.types?.map((t: string) => (
                              <span
                                key={t}
                                className="bg-[#f3f4f5] text-[#575e70] px-2 py-0.5 rounded text-xs"
                              >
                                {t}
                              </span>
                            ))}
                            <div className="flex items-center text-[#006e2f] ml-auto gap-0.5 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-[#006e2f] text-[#006e2f]" />
                              <span>{field.rating}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-3 border-t border-[#bccbb9]/30 flex justify-between items-center">
                          <div className="font-bold text-lg text-[#006e2f] font-['Manrope']">
                            {field.pricePerHour.toLocaleString('vi-VN')}đ
                            <span className="text-xs font-normal text-[#575e70]">
                              /h
                            </span>
                          </div>
                          <Link href={`/fields/${field.id}`}>
                            <button
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#bccbb9]/60 transition-colors ${
                                isAvailable
                                  ? 'bg-[#edeeef] text-[#191c1d] hover:bg-[#006e2f] hover:text-white hover:border-[#006e2f]'
                                  : 'bg-[#edeeef] text-[#575e70] hover:bg-slate-200'
                              }`}
                            >
                              {isAvailable ? 'Đặt ngay' : 'Chi tiết'}
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center items-center pt-8 pb-10 gap-2">
              <button
                onClick={() => {
                  const prevPage = Math.max(1, page - 1);
                  setPage(prevPage);
                  pushParams({ page: prevPage });
                }}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setPage(num);
                    pushParams({ page: num });
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    page === num
                      ? 'bg-[#006e2f] text-white'
                      : 'border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {num}
                </button>
              ))}

              <span className="text-[#575e70] text-sm px-1">...</span>

              <button
                onClick={() => {
                  setPage(12);
                  pushParams({ page: 12 });
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-semibold border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9] ${
                  page === 12 ? 'bg-[#006e2f] text-white' : ''
                }`}
              >
                12
              </button>

              <button
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  pushParams({ page: nextPage });
                }}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#e7e8e9] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TẮT CHẾ ĐỘ RENDER SERVER (SSR) CHO TRANG NÀY
// Để tránh lỗi "Missing Suspense with CSR Bailout" của Next.js
// ==========================================
const DynamicFieldsSearchPage = dynamic(() => Promise.resolve(FieldsContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-[#006e2f]">
      Đang tải dữ liệu bộ lọc...
    </div>
  ),
});

export default function FieldsSearchPageWrapper() {
  return <DynamicFieldsSearchPage />;
}
