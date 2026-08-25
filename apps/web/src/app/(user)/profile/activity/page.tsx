'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Activity as ActivityIcon,
  Search,
  X,
  Filter,
  ArrowUpDown,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserActivities, type ActivityItem } from '@/lib/api';
import { getSupabaseBrowserClient } from '@/lib/supabase';

type ActivityFilterType = 'ALL' | 'BOOKING' | 'REVIEW' | 'FAVORITE';
type ActivitySortType = 'newest' | 'oldest';

function getActivityIcon(type: string) {
  switch (type) {
    case 'BOOKING_CREATED':
      return (
        <div className="w-10 h-10 rounded-full bg-[#006e2f]/10 border border-[#006e2f]/30 text-[#006e2f] flex items-center justify-center shrink-0 shadow-sm">
          <Calendar className="w-4 h-4" />
        </div>
      );
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_COMPLETED':
      return (
        <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#006e2f] flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    case 'BOOKING_CANCELLED':
    case 'BOOKING_REJECTED':
      return (
        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
          <XCircle className="w-4 h-4" />
        </div>
      );
    case 'NEW_FIELD':
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-700" />
        </div>
      );
    case 'NEW_VOUCHER':
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 shadow-sm">
          <Ticket className="w-4 h-4 text-emerald-700" />
        </div>
      );
    case 'FAVORITE':
      return (
        <div className="w-10 h-10 rounded-full bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center shrink-0 shadow-sm">
          <Heart className="w-4 h-4 fill-pink-600" />
        </div>
      );
    case 'REVIEW':
      return (
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
        </div>
      );
    default:
      return (
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
          <ActivityIcon className="w-4 h-4" />
        </div>
      );
  }
}

function formatActivityTime(timeStr: string) {
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday || isYesterday) {
    return `${hours}:${minutes}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): (number | string)[] {
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

export default function MyActivityPage() {
  const router = useRouter();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>('ALL');
  const [activeSort, setActiveSort] = useState<ActivitySortType>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadActivities = async (
    currentPage = page,
    currentSearch = search,
    currentType = activeFilter,
    currentSort = activeSort,
    currentPageSize = pageSize,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace('/login?redirect=/profile/activity');
        return;
      }

      const res = await fetchUserActivities({
        page: currentPage,
        limit: currentPageSize,
        search: currentSearch.trim() || undefined,
        type: currentType === 'ALL' ? undefined : currentType,
        sort: currentSort,
      });

      setActivities(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
      setPage(currentPage);
    } catch (err: unknown) {
      setError(
        (err as Error)?.message || 'Không thể tải danh sách hoạt động gần đây.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadActivities(1, search, activeFilter, activeSort, pageSize);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeFilter, activeSort, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    void loadActivities(newPage, search, activeFilter, activeSort, pageSize);
    if (timelineRef.current) {
      timelineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    void loadActivities(1, search, activeFilter, activeSort, newSize);
  };

  // Group activities into Today, Yesterday, Older
  const { todayList, yesterdayList, olderList } = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayItems: ActivityItem[] = [];
    const yesterdayItems: ActivityItem[] = [];
    const olderItems: ActivityItem[] = [];

    for (const item of activities) {
      const d = new Date(item.time);
      if (isNaN(d.getTime())) {
        olderItems.push(item);
        continue;
      }

      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      if (isToday) {
        todayItems.push(item);
      } else if (isYesterday) {
        yesterdayItems.push(item);
      } else {
        olderItems.push(item);
      }
    }

    return {
      todayList: todayItems,
      yesterdayList: yesterdayItems,
      olderList: olderItems,
    };
  }, [activities]);

  const renderActivityCard = (item: ActivityItem) => (
    <div
      key={item.id}
      className="flex gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 hover:border-[#006e2f]/40 transition-colors group"
    >
      {getActivityIcon(item.type)}
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-xs text-[#191c1d]">{item.title}</h3>
          <span className="text-[11px] text-[#575e70] flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatActivityTime(item.time)}
          </span>
        </div>

        <p className="text-xs text-[#575e70]">{item.description}</p>

        <div className="pt-2 flex items-center justify-between">
          {item.code ? (
            <span className="text-[11px] font-bold text-[#575e70] bg-white border border-[#bccbb9]/40 px-2 py-0.5 rounded-md">
              Mã đơn: {item.code}
            </span>
          ) : (
            <div />
          )}

          {item.linkHref && (
            <Link
              href={item.linkHref}
              className="text-xs font-bold text-[#006e2f] hover:underline flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
            >
              {item.linkText || 'Xem chi tiết'}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  const filterOptions: Array<{ key: ActivityFilterType; label: string }> = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'BOOKING', label: 'Đặt sân' },
    { key: 'REVIEW', label: 'Đánh giá' },
    { key: 'FAVORITE', label: 'Yêu thích' },
  ];

  const hasActiveFilters =
    search.trim() !== '' || activeFilter !== 'ALL' || activeSort !== 'newest';

  const handleResetFilters = () => {
    setSearch('');
    setActiveFilter('ALL');
    setActiveSort('newest');
    setPage(1);
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen pb-16 font-sans">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#bccbb9]/40 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-[#575e70] mb-2">
                <Link
                  href="/"
                  className="hover:text-[#006e2f] transition-colors"
                >
                  Trang chủ
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href="/profile"
                  className="hover:text-[#006e2f] transition-colors"
                >
                  Hồ sơ cá nhân
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#191c1d] font-semibold">
                  Hoạt động của tôi
                </span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1d] font-['Manrope']">
                Hoạt động của tôi
              </h1>
              <p className="text-xs text-[#575e70] mt-1">
                Theo dõi toàn bộ lịch sử tương tác, đặt sân và đánh giá gần đây
                của bạn.
              </p>
            </div>

            <Link href="/profile">
              <Button
                variant="outline"
                className="text-xs font-semibold border-[#bccbb9]/60 hover:bg-slate-50 flex items-center gap-1.5 rounded-xl py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại Hồ sơ
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div
        ref={timelineRef}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6"
      >
        {/* Search, Filter & Sort Toolbar */}
        <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#575e70] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sân, mã đơn..."
                className="w-full bg-[#f8f9fa] border border-[#bccbb9]/50 rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#191c1d] outline-none focus:border-[#006e2f] transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575e70] hover:text-[#191c1d]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#575e70] absolute left-3 pointer-events-none" />
                <select
                  value={activeSort}
                  onChange={(e) =>
                    setActiveSort(e.target.value as ActivitySortType)
                  }
                  aria-label="Sắp xếp hoạt động"
                  className="bg-[#f8f9fa] border border-[#bccbb9]/50 rounded-xl pl-8 pr-7 py-2.5 text-xs text-[#191c1d] font-semibold outline-none focus:border-[#006e2f] appearance-none cursor-pointer"
                >
                  <option value="newest">Mới nhất trước</option>
                  <option value="oldest">Cũ nhất trước</option>
                </select>
                <ChevronRight className="w-3.5 h-3.5 text-[#575e70] rotate-90 absolute right-2.5 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <Button
                  onClick={handleResetFilters}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#575e70] hover:text-[#006e2f] px-2.5 h-9 rounded-xl"
                >
                  Đặt lại
                </Button>
              )}
            </div>
          </div>

          {/* Filter Pills & Stats */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 pt-1 border-t border-[#bccbb9]/20">
            <span className="text-xs text-[#575e70] font-semibold flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setActiveFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'bg-[#f8f9fa] text-[#575e70] border border-[#bccbb9]/40 hover:border-[#006e2f]/50 hover:text-[#191c1d]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            <span className="text-xs text-[#575e70] ml-auto hidden sm:inline">
              Tổng cộng:{' '}
              <strong className="text-[#191c1d]">{totalCount}</strong> hoạt động
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6 sm:p-8 space-y-8">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-[#575e70] flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#006e2f]" />
              <span>Đang tải dòng thời gian hoạt động...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-[#191c1d] font-semibold">{error}</p>
              <Button
                onClick={() =>
                  void loadActivities(
                    page,
                    search,
                    activeFilter,
                    activeSort,
                    pageSize,
                  )
                }
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Thử lại
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#f8f9fa] border border-[#bccbb9]/40 flex items-center justify-center mx-auto text-[#575e70]">
                <ActivityIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#191c1d]">
                  {hasActiveFilters
                    ? 'Không tìm thấy hoạt động nào phù hợp'
                    : 'Chưa có hoạt động nào'}
                </h3>
                <p className="text-xs text-[#575e70] mt-1 max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn.'
                    : 'Bạn chưa có lịch đặt sân, đánh giá hoặc sân bóng yêu thích nào.'}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  className="text-xs font-semibold rounded-xl"
                >
                  Xóa bộ lọc
                </Button>
              ) : (
                <Link href="/fields">
                  <Button className="bg-[#006e2f] hover:bg-[#005a26] text-white text-xs font-semibold rounded-xl">
                    Khám phá sân bóng
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Group 1: Hôm nay */}
              {todayList.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#006e2f]" /> Hôm nay
                  </h2>
                  <div className="space-y-3">
                    {todayList.map(renderActivityCard)}
                  </div>
                </div>
              )}

              {/* Group 2: Hôm qua */}
              {yesterdayList.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#575e70]" /> Hôm qua
                  </h2>
                  <div className="space-y-3">
                    {yesterdayList.map(renderActivityCard)}
                  </div>
                </div>
              )}

              {/* Group 3: Các hoạt động trước đó */}
              {olderList.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#575e70]" /> Các hoạt
                    động trước đó
                  </h2>
                  <div className="space-y-3">
                    {olderList.map(renderActivityCard)}
                  </div>
                </div>
              )}

              {/* Full Pagination Bar */}
              <div className="pt-6 border-t border-[#bccbb9]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="text-xs text-[#575e70]">
                  Hiển thị{' '}
                  <strong className="text-[#191c1d]">
                    {startRecord} - {endRecord}
                  </strong>{' '}
                  trên <strong className="text-[#191c1d]">{totalCount}</strong>{' '}
                  hoạt động
                </div>

                {/* Center: Page numbers */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    {/* Prev button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1 || isLoading}
                      aria-label="Trang trước"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#f8f9fa] hover:text-[#191c1d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Number buttons */}
                    {getPaginationRange(page, totalPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="w-8 h-8 flex items-center justify-center text-xs text-[#575e70] select-none"
                          >
                            ...
                          </span>
                        );
                      }

                      const pageNum = Number(p);
                      const isCurrent = page === pageNum;

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={isLoading}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-[#006e2f] text-white shadow-sm'
                              : 'border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#f8f9fa] hover:text-[#191c1d]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next button */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages || isLoading}
                      aria-label="Trang sau"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#bccbb9]/60 text-[#575e70] hover:bg-[#f8f9fa] hover:text-[#191c1d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Right: Page Size Selector */}
                <div className="flex items-center gap-2 text-xs text-[#575e70]">
                  <span>Hiển thị:</span>
                  <select
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    aria-label="Số hoạt động mỗi trang"
                    className="bg-[#f8f9fa] border border-[#bccbb9]/50 rounded-lg px-2 py-1 text-xs text-[#191c1d] font-semibold outline-none focus:border-[#006e2f] cursor-pointer"
                  >
                    <option value={10}>10 / trang</option>
                    <option value={20}>20 / trang</option>
                    <option value={50}>50 / trang</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
