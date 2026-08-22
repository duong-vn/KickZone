/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper format YYYY-MM-DD -> DD/MM/YYYY
function formatDateDisplay(isoDate: string) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

const FEATURED_FIELDS = [
  {
    id: '1',
    name: 'Sân bóng cỏ nhân tạo ABC',
    location: 'Quận 7, TP.HCM',
    type: 'Sân 7 người',
    rating: 4.8,
    reviewsCount: 120,
    pricePerHour: 400000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANovgxyrcGYeOL6TPjw9A9ZZJ-IvrvQbiL1m2mraAG_JALs09yHIuUxL1WovU9bWNRJHVP8_bHWk8LR3N45wTxzw0GPf3hD3cmh0EI1w7shsW-PTkefZE6_7AfXG_ZsEcehpi3ynlfXuZjUYRyMjooSUxfFQrQttwknuFsPLohGOffaUCqq37wCvNQ1n7XPkir8vz2omErzHt2KdkpRL2DEaQnZP_wQUZ3Qz-eNfUHzR2NiakLax6HPQ',
  },
  {
    id: '2',
    name: 'Futsal Arena Chảo Lửa',
    location: 'Tân Bình, TP.HCM',
    type: 'Sân 5 người',
    rating: 4.9,
    reviewsCount: 85,
    pricePerHour: 350000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOe3kouLR8qo191f-LiDKy7M7GPPqm7hPs7bxIyQ_c9J5axjv93uomA5qaYFYDo_f5Z521iwcSCOqD58ZbnPYI-O267f4eN6540fypxYaGVNkHDbAoehoohlCUmymRubuyJCjqXyhCZuuycICMO88LohXfwCtemvVUmKn0T5KFVbpDumUlUhzQT3FJXxpK3VM6gKzaaxtdOGHOt6maB3S9-zB0tKc1kIvZ0WE6jdFZ45YHIXNOFLDOvw',
  },
  {
    id: '3',
    name: 'Sân vận động Mini K34',
    location: 'Quận 10, TP.HCM',
    type: 'Sân 7 người',
    rating: 4.7,
    reviewsCount: 210,
    pricePerHour: 450000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfMU8_YHKjJYoer4phvrmpsW1AF0RVa8j2Em6hX1BPFJmqdoi6Fm3R2LOx4MuYey7NOTsytctNWdyf58B23aFoRHvdLfAR2olmEij3fcQtqVRpiUu55SAPL-vvSaUxIYbOytDsGSkMauq4HjECWFyl7hDlyQ7qCy4Kus9jKGsk2eDsHWJ2R1aYu0MRowk4pS08Z2iRlTVhR6B3KgirZ-NFOs1_LPRXnXP_URRTl8nBcSjrzPnoBkdACQ',
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Search,
    title: 'Tìm sân',
    desc: 'Khám phá các sân bóng lân cận theo khu vực, loại sân và giá cả.',
  },
  {
    step: 2,
    icon: Calendar,
    title: 'Chọn thời gian',
    desc: 'Xem lịch trống theo thời gian thực và chọn khung giờ phù hợp.',
  },
  {
    step: 3,
    icon: Zap,
    title: 'Đặt sân và ra sân',
    desc: 'Thanh toán an toàn, nhận xác nhận tức thì và chuẩn bị cho trận đấu.',
  },
];

const WHY_CHOOSE_US = [
  {
    title: 'Lịch sân rõ ràng',
    desc: 'Cập nhật thời gian thực, không lo trùng lịch hay hết sân đột xuất.',
  },
  {
    title: 'Giá minh bạch',
    desc: 'Hiển thị giá chi tiết theo từng khung giờ, không phụ phí ẩn.',
  },
  {
    title: 'Đánh giá thực',
    desc: 'Review trung thực từ cộng đồng người chơi đã trải nghiệm sân.',
  },
  {
    title: 'Đặt nhanh',
    desc: 'Quy trình tối giản, thanh toán linh hoạt nhiều phương thức.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (date) params.set('date', date);
    if (timeSlot) params.set('timeSlot', timeSlot);

    router.push(`/fields${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] text-[#191c1d]">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative w-full min-h-[580px] md:min-h-[620px] flex items-center justify-center px-6 py-20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkLDUJ0xtg_AnZt-VUTcZY6PYZed1fgOAiXt6bwOHtww6TKjrCKqaHEzBOBlma8w7-aEdz0GN3k7_hT1O7-d1QNc2d5HHED2I0pU8yxjzEs01V2HllcrgM_0bhboYkvOHAMamYPbOGQzzQ0aGTTTGD7Bdqb2x4gVRsnp6RY5zNmEzHbfW-Icf5JZDGNpZW9xkib_-lNwnXRXGwq9xJDrqleKCN2zOhJoIQmjeQp9Ku-3ryRWVb1T2PGQ')`,
          }}
        >
          <div className="absolute inset-0 bg-[#151c27]/80" />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white max-w-3xl mb-4 font-['Manrope'] tracking-tight drop-shadow-md leading-tight">
            Tìm sân bóng phù hợp cho trận đấu của bạn
          </h1>
          <p className="text-sm md:text-lg text-white/90 mb-10 max-w-2xl font-light drop-shadow-sm">
            Khám phá và đặt sân dễ dàng. Hàng trăm sân bóng chất lượng cao đang
            chờ đón đội của bạn.
          </p>

          {/* Quick Search Form */}
          <form
            onSubmit={handleHeroSearch}
            className="bg-white p-2 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row gap-2 items-center text-left"
          >
            {/* Search Input */}
            <div className="flex-1 w-full px-4 py-2.5 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200">
              <MapPin className="w-5 h-5 text-[#575e70] shrink-0" />
              <input
                type="text"
                placeholder="Khu vực, tên sân..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-[#191c1d] placeholder:text-[#575e70]"
              />
            </div>

            {/* Custom Date Picker (Click mở popup chọn lịch, chặn nhập phím) */}
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
              className="w-full md:w-auto px-4 py-2.5 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 relative cursor-pointer select-none"
            >
              <Calendar className="w-5 h-5 text-[#575e70] shrink-0 pointer-events-none" />
              <div className="w-full md:w-36 text-sm">
                <span
                  className={
                    date ? 'text-[#191c1d] font-medium' : 'text-[#575e70]'
                  }
                >
                  {date ? formatDateDisplay(date) : 'dd/mm/yyyy'}
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={(e) => e.preventDefault()} // Vô hiệu hoá nhập phím thủ công
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* Time Slot mặc định trống */}
            <div className="w-full md:w-auto px-4 py-2.5 flex items-center gap-2 relative">
              <Clock className="w-5 h-5 text-[#575e70] shrink-0" />
              <div className="relative w-full md:w-36">
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full appearance-none bg-transparent border-none outline-none text-sm text-[#191c1d] cursor-pointer pr-6"
                >
                  <option value="">-- : --</option>
                  <option value="06:00 - 08:00">06:00 - 08:00</option>
                  <option value="08:00 - 10:00">08:00 - 10:00</option>
                  <option value="14:00 - 16:00">14:00 - 16:00</option>
                  <option value="16:00 - 18:00">16:00 - 18:00</option>
                  <option value="18:00 - 19:30">18:00 - 19:30</option>
                  <option value="19:30 - 21:00">19:30 - 21:00</option>
                  <option value="20:00 - 22:00">20:00 - 22:00</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#575e70] absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto bg-[#006e2f] hover:bg-[#005321] text-white px-8 py-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Search className="w-4 h-4" />
              Tìm sân
            </Button>
          </form>
        </div>
      </section>

      {/* ================= 2. SÂN NỔI BẬT ================= */}
      <section className="py-16 px-6 max-w-[1280px] mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-1 font-['Manrope']">
              Sân nổi bật
            </h2>
            <p className="text-sm text-[#575e70]">
              Các sân bóng được đánh giá cao và đặt nhiều nhất.
            </p>
          </div>
          <Link
            href="/fields"
            className="text-sm font-semibold text-[#006e2f] hover:underline flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED_FIELDS.map((field) => (
            <div
              key={field.id}
              className="bg-white border border-[#bccbb9]/40 rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow group flex flex-col p-2"
            >
              <div className="relative h-48 overflow-hidden rounded-lg bg-slate-100">
                <img
                  src={field.image}
                  alt={field.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded text-[#004b1e] bg-[#22c55e] text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Còn trống
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-[#191c1d] font-['Manrope'] mb-1.5 line-clamp-1">
                    {field.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[#575e70] text-xs mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{field.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-[#f3f4f5] px-2 py-1 rounded text-xs text-[#191c1d]">
                      {field.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#575e70]">
                      <Star className="w-3.5 h-3.5 fill-[#22c55e] text-[#22c55e]" />
                      <span className="font-bold text-[#191c1d]">
                        {field.rating}
                      </span>{' '}
                      ({field.reviewsCount} đánh giá)
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e1e3e4] flex justify-between items-center">
                  <div className="text-lg font-bold text-[#006e2f] font-['Manrope']">
                    {field.pricePerHour.toLocaleString('vi-VN')}đ
                    <span className="text-xs font-normal text-[#575e70]">
                      /giờ
                    </span>
                  </div>
                  <Link href={`/fields/${field.id}`}>
                    <Button
                      variant="outline"
                      className="text-xs text-[#006e2f] border-[#bccbb9]/60 rounded-lg hover:bg-[#f3f4f5]"
                    >
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= 3. CÁCH HOẠT ĐỘNG ================= */}
      <section className="bg-[#f3f4f5] py-16 w-full px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-1 font-['Manrope']">
            Cách hoạt động
          </h2>
          <p className="text-sm text-[#575e70] mb-12 max-w-2xl mx-auto">
            Chỉ với 3 bước đơn giản để tổ chức trận đấu hoàn hảo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-[#bccbb9] z-0" />

            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-[#bccbb9]/40 text-[#006e2f]">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="bg-[#006e2f] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs absolute top-0 right-[calc(50%-2.5rem)] shadow-sm border-2 border-[#f3f4f5]">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-base text-[#191c1d] mb-1 font-['Manrope']">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#575e70] max-w-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= 4. VÌ SAO CHỌN KICKZONE ================= */}
      <section className="py-20 px-6 max-w-[1280px] mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <div className="relative h-[380px] w-full rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNmKL-h8KGLqNoQSmXLqG0Lvos8oUDAhzZ1faR7Dux5meq-8yDn6hK6SDoG5NEN8tJGgNS4htS68JICP5yrh8_7gXyowvCUEhNCMOT5wwetupSOgaTtuOOmA4g-bUbzuQXIiouLV9zBiB2WspDSyFpixSsL4TeIYs99ZmQ-yv2MHAhrdLqYG3K6vUHwAlStaPQX9rd14-Aqs35YfoXAZeB4BQbVWZROicodH5cEfe9kMySW1f5zCpw_g"
                alt="Vì sao chọn KickZone"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/85 backdrop-blur-md p-3.5 rounded-xl border border-white/60 shadow-sm flex items-center gap-3">
                <div className="bg-[#006e2f] text-white p-2 rounded-lg shrink-0">
                  <Zap className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#191c1d] font-['Manrope']">
                    Đặt sân nhanh chóng
                  </div>
                  <div className="text-xs text-[#575e70]">
                    Xác nhận chưa đầy 1 phút
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-2 font-['Manrope']">
                Vì sao chọn KickZone
              </h2>
              <p className="text-sm text-[#575e70] leading-relaxed">
                Nền tảng đặt sân bóng đá hàng đầu, mang lại trải nghiệm chuyên
                nghiệp và tiện lợi nhất cho cộng đồng đam mê thể thao.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              {WHY_CHOOSE_US.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-[#006e2f] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-[#191c1d] mb-1 font-['Manrope']">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#575e70] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
