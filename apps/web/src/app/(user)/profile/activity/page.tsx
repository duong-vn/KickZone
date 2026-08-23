'use client';

import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Heart,
  Star,
  ChevronRight,
  ArrowLeft,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityItem {
  id: string;
  type:
    | 'BOOKING_CREATED'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'FAVORITE'
    | 'REVIEW';
  title: string;
  description: string;
  time: string;
  code?: string;
  linkHref?: string;
  linkText?: string;
}

const ACTIVITIES_TODAY: ActivityItem[] = [
  {
    id: 'a1',
    type: 'BOOKING_CREATED',
    title: 'Đã tạo đơn đặt sân',
    description: 'Bạn đã gửi yêu cầu đặt Sân 7 - B1 tại Sân bóng đá Chảo Lửa.',
    time: '14:30',
    code: '#KZ-8921',
    linkHref: '/bookings/b1',
    linkText: 'Xem chi tiết đơn',
  },
  {
    id: 'a2',
    type: 'BOOKING_CONFIRMED',
    title: 'Đơn đặt sân đã được xác nhận',
    description:
      'Quản lý sân đã duyệt và khóa lịch thi đấu cho bạn tại Sân bóng đá Chảo Lửa.',
    time: '09:15',
    code: '#KZ-8905',
    linkHref: '/bookings/b2',
    linkText: 'Xem chi tiết đơn',
  },
];

const ACTIVITIES_YESTERDAY: ActivityItem[] = [
  {
    id: 'a3',
    type: 'BOOKING_CANCELLED',
    title: 'Đã hủy đơn đặt sân',
    description:
      'Bạn đã hủy đơn đặt sân tại Sân bóng K34 (Lý do: Đội bận đột xuất).',
    time: '18:45',
    code: '#KZ-8612',
    linkHref: '/bookings/b4',
    linkText: 'Xem chi tiết đơn',
  },
  {
    id: 'a4',
    type: 'FAVORITE',
    title: 'Đã thêm vào danh sách yêu thích',
    description:
      'Bạn đã lưu Sân ĐH Tôn Đức Thắng vào danh sách sân bóng yêu thích của mình.',
    time: '10:20',
    linkHref: '/fields/3',
    linkText: 'Xem thông tin sân',
  },
];

const ACTIVITIES_OLDER: ActivityItem[] = [
  {
    id: 'a5',
    type: 'REVIEW',
    title: 'Đã gửi đánh giá sân bóng',
    description:
      'Bạn đã để lại đánh giá 5 sao cho Sân ĐH Tôn Đức Thắng: "Mặt cỏ êm, đèn sáng chuẩn thi đấu".',
    time: '15/08/2026',
    linkHref: '/fields/3',
    linkText: 'Xem đánh giá',
  },
  {
    id: 'a6',
    type: 'BOOKING_CONFIRMED',
    title: 'Hoàn thành trận đấu',
    description:
      'Trận đấu 120 phút tại Sân ĐH Tôn Đức Thắng đã hoàn thành xuất sắc.',
    time: '15/08/2026',
    code: '#KZ-8750',
    linkHref: '/bookings/b3',
    linkText: 'Xem chi tiết đơn',
  },
];

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'BOOKING_CREATED':
      return (
        <div className="w-10 h-10 rounded-full bg-[#006e2f]/10 border border-[#006e2f]/30 text-[#006e2f] flex items-center justify-center shrink-0 shadow-sm">
          <Calendar className="w-4 h-4" />
        </div>
      );
    case 'BOOKING_CONFIRMED':
      return (
        <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#006e2f] flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    case 'BOOKING_CANCELLED':
      return (
        <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
          <XCircle className="w-4 h-4" />
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
  }
}

export default function MyActivityPage() {
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
                Theo dõi toàn bộ lịch sử tương tác, giao dịch và thao tác tài
                khoản gần đây của bạn.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-2xl border border-[#bccbb9]/40 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Group 1: Hôm nay */}
          <div>
            <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#006e2f]" /> Hôm nay
            </h2>

            <div className="space-y-4">
              {ACTIVITIES_TODAY.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 hover:border-[#006e2f]/40 transition-colors group"
                >
                  {getActivityIcon(item.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xs text-[#191c1d]">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-[#575e70] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
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
                          {item.linkText}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Hôm qua */}
          <div>
            <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#575e70]" /> Hôm qua
            </h2>

            <div className="space-y-4">
              {ACTIVITIES_YESTERDAY.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 hover:border-[#006e2f]/40 transition-colors group"
                >
                  {getActivityIcon(item.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xs text-[#191c1d]">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-[#575e70] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
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
                          {item.linkText}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 3: Trước đó */}
          <div>
            <h2 className="text-xs font-bold text-[#575e70] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#575e70]" /> Các hoạt động
              trước đó
            </h2>

            <div className="space-y-4">
              {ACTIVITIES_OLDER.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#bccbb9]/30 hover:border-[#006e2f]/40 transition-colors group"
                >
                  {getActivityIcon(item.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xs text-[#191c1d]">
                        {item.title}
                      </h3>
                      <span className="text-[11px] text-[#575e70] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.time}
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
                          {item.linkText}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
