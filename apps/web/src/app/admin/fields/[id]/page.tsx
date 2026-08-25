/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminFieldById,
  updateAdminFieldStatus,
  updateAdminField,
  deleteAdminField,
} from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  CheckCircle2,
  X,
  Calendar,
  AlertTriangle,
  Ban,
  Car,
  Droplets,
  Shirt,
  Wifi,
  Lightbulb,
  Coffee,
  Check,
  Star,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface FieldDetailFullData {
  id: string;
  name: string;
  slug?: string;
  fieldType: string; // '5-a-side' | '7-a-side' | '11-a-side'
  fieldTypeLabel: string; // 'Sân 5 người'
  dimensions: string; // '20m x 40m'
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
  district?: string;
  city?: string;
  basePricePerHour: number;
  upcomingBookingsCount: number;
  description: string;
  imageUrl: string;
  images?: string[];
}

const DEFAULT_AMENITIES = [
  {
    icon: Car,
    label: 'Bãi giữ xe rộng rãi',
    desc: 'Có chỗ đỗ ô tô và xe máy an toàn',
  },
  {
    icon: Droplets,
    label: 'Nước uống phục vụ',
    desc: 'Trà đá và nước mát giải khát',
  },
  {
    icon: Shirt,
    label: 'Phòng thay đồ & Tủ khóa',
    desc: 'Khu vực thay đồ sạch sẽ, có tủ gửi đồ',
  },
  {
    icon: Wifi,
    label: 'Wifi miễn phí',
    desc: 'Phủ sóng toàn bộ khuôn viên sân',
  },
  {
    icon: Lightbulb,
    label: 'Dàn đèn LED cao áp',
    desc: 'Độ sáng đạt chuẩn thi đấu ban đêm',
  },
  {
    icon: Coffee,
    label: 'Căn tin giải khát',
    desc: 'Phục vụ nước uống và đồ ăn nhẹ',
  },
];

const DEFAULT_RULES = [
  'Vui lòng sử dụng giày đế TF (đinh dăm) hoặc IC (futsal), nghiêm cấm giày đinh sắt SG.',
  'Đến trước giờ thi đấu 10-15 phút để chuẩn bị và làm thủ tục nhận sân.',
  'Nghiêm cấm hút thuốc, xả rác bừa bãi và mang chất dễ cháy nổ vào sân.',
  'Hủy hoặc thay đổi lịch đặt phải thực hiện trước giờ bắt đầu ít nhất 12 tiếng.',
];

const MOCK_FIELD_FALLBACK: FieldDetailFullData = {
  id: 'f-1',
  name: 'Sân bóng KickZone',
  fieldType: '7-a-side',
  fieldTypeLabel: 'Sân 7 người',
  dimensions: '30m x 50m',
  status: 'ACTIVE',
  address: 'Hồ Chí Minh',
  basePricePerHour: 300000,
  upcomingBookingsCount: 0,
  description:
    'Sân cỏ nhân tạo chất lượng cao đạt chuẩn thi đấu, hệ thống thoát nước hiện đại và dàn đèn LED chiếu sáng ban đêm cực sáng. Phù hợp cho các giải đấu và rèn luyện thể thao.',
  imageUrl:
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80',
  images: [
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80',
  ],
};

export default function AdminFieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const fieldId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: apiField, isLoading } = useQuery({
    queryKey: ['admin-field', fieldId],
    queryFn: () => fetchAdminFieldById(fieldId),
    retry: false,
  });

  const [localField, setLocalField] =
    useState<Partial<FieldDetailFullData> | null>(null);

  const field: FieldDetailFullData = useMemo(() => {
    return {
      ...MOCK_FIELD_FALLBACK,
      ...(apiField || {}),
      ...(localField || {}),
      id: fieldId,
    };
  }, [apiField, localField, fieldId]);

  // Active image index for gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const allImages = useMemo(() => {
    if (field.images && field.images.length > 0) return field.images;
    if (field.imageUrl) return [field.imageUrl];
    return [MOCK_FIELD_FALLBACK.imageUrl];
  }, [field]);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Field Edit Form State
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDimensions, setEditDimensions] = useState('30m x 50m');
  const [editPrice, setEditPrice] = useState('300000');
  const [editDesc, setEditDesc] = useState('');

  const formatVNDPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Edit Modal with current values
  const handleOpenEditModal = () => {
    setEditName(field.name);
    setEditAddress(field.address);
    setEditDimensions(field.dimensions || '30m x 50m');
    setEditPrice(String(field.basePricePerHour));
    setEditDesc(field.description || '');
    setIsEditFieldModalOpen(true);
  };

  // Toggle field status (Active / Disabled)
  const handleToggleStatus = async () => {
    if (!field) return;
    const nextStatus = field.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setLocalField((prev) => ({ ...(prev || {}), status: nextStatus }));
    try {
      await updateAdminFieldStatus(fieldId, nextStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-field', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      showToast(
        nextStatus === 'ACTIVE'
          ? `Đã kích hoạt hoạt động sân "${field.name}"!`
          : `Đã vô hiệu hóa sân "${field.name}".`,
      );
    } catch (err) {
      showToast(`Lỗi cập nhật trạng thái: ${(err as Error).message}`);
    }
  };

  // Save Field Info
  const handleSaveFieldInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Vui lòng nhập tên sân');
      return;
    }

    const priceNum = Number(editPrice) || 300000;
    const updatedPayload = {
      name: editName,
      address: editAddress,
      basePricePerHour: priceNum,
      description: editDesc,
    };

    setLocalField((prev) => ({
      ...(prev || {}),
      name: editName,
      address: editAddress,
      dimensions: editDimensions,
      basePricePerHour: priceNum,
      description: editDesc,
    }));

    try {
      await updateAdminField(fieldId, updatedPayload);
      queryClient.invalidateQueries({ queryKey: ['admin-field', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      showToast('Cập nhật thông tin sân bóng thành công!');
      setIsEditFieldModalOpen(false);
    } catch (err) {
      showToast(`Lỗi cập nhật: ${(err as Error).message}`);
    }
  };

  // Delete Field
  const handleConfirmDelete = async () => {
    try {
      await deleteAdminField(fieldId);
      queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      showToast('Đã xóa sân bóng thành công.');
      setIsDeleteModalOpen(false);
      router.push('/admin/fields');
    } catch (err) {
      showToast(`Không thể xóa sân: ${(err as Error).message}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-between rounded-xl border border-[#22c55e]/40 bg-[#22c55e]/15 px-4 py-3 text-sm font-semibold text-[#004b1e] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#006e2f]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="rounded p-1 hover:bg-[#22c55e]/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[#bccbb9]/50 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/fields"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#bccbb9] bg-white text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#191c1d]"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-(family-name:--font-manrope) text-2xl font-bold tracking-tight text-[#191c1d]">
                {field.name}
              </h2>
              <span className="rounded-md bg-[#22c55e]/20 px-2.5 py-0.5 text-xs font-bold text-[#006e2f]">
                {field.fieldTypeLabel}
              </span>
              {field.status === 'ACTIVE' ? (
                <span className="rounded-full bg-[#22c55e] px-2.5 py-0.5 text-xs font-bold text-white">
                  Hoạt động
                </span>
              ) : (
                <span className="rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-2.5 py-0.5 text-xs font-bold text-[#575e70]">
                  Vô hiệu hóa
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#575e70]">
              Quản trị chi tiết thông tin sân bóng, tiện ích và cài đặt hoạt động
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenEditModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#bccbb9] bg-white px-3.5 py-2 text-xs font-bold text-[#191c1d] transition-colors hover:bg-[#f8f9fa]"
          >
            <Edit className="h-4 w-4 text-[#006e2f]" />
            <span>Sửa thông tin</span>
          </button>
          <Link
            href={`/admin/schedule?fieldId=${field.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#006e2f] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
          >
            <Calendar className="h-4 w-4" />
            <span>Xem lịch đặt sân</span>
          </Link>
        </div>
      </div>

      {/* Image Gallery Section (Matching User Page style) */}
      <section className="overflow-hidden rounded-2xl border border-[#bccbb9] bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Main Hero Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#f3f4f5] md:col-span-8 lg:col-span-9">
            <img
              src={allImages[activeImageIndex] || field.imageUrl}
              alt={field.name}
              className="h-full w-full object-cover transition-all duration-300"
            />
          </div>

          {/* Side Thumbnails */}
          <div className="flex flex-row gap-3 overflow-x-auto md:flex-col md:overflow-visible md:col-span-4 lg:col-span-3">
            {allImages.slice(0, 3).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative aspect-video w-full flex-1 overflow-hidden rounded-xl border-2 transition-all ${
                  activeImageIndex === idx
                    ? 'border-[#006e2f] shadow-md ring-2 ring-[#006e2f]/20'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Ảnh ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid: 8 Cols Left (Details) & 4 Cols Right (Info & Danger Zone) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Giới thiệu, Tiện ích, Quy định */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Header Info Card */}
          <div className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-(family-name:--font-manrope) text-2xl font-extrabold text-[#191c1d]">
                  {field.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#575e70]">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-[#006e2f]" />
                    <span>{field.address}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>4.9 (48 đánh giá)</span>
                  </div>
                  <span>•</span>
                  <span className="font-semibold text-[#191c1d]">
                    Kích thước: {field.dimensions || '30m x 50m'}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-[#006e2f]/30 bg-[#22c55e]/10 p-3 text-right">
                <span className="text-xs font-semibold text-[#575e70]">
                  Giá thuê cơ bản
                </span>
                <div className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#006e2f]">
                  {formatVNDPrice(field.basePricePerHour)}
                  <span className="text-xs font-normal text-[#575e70]">/giờ</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Giới thiệu sân bóng */}
          <div className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Giới thiệu sân bóng
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#575e70]">
              {field.description ||
                'Sân bóng cỏ nhân tạo tiêu chuẩn thi đấu, mặt sân bằng phẳng được bảo dưỡng định kỳ hàng tuần. Không gian thoáng đãng, hệ thống chiếu sáng LED hiện đại đảm bảo tầm nhìn tốt nhất cho các trận cầu kịch tính.'}
            </p>
          </div>

          {/* 3. Tiện ích & Dịch vụ đi kèm */}
          <div className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Tiện ích & Dịch vụ đi kèm
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DEFAULT_AMENITIES.map((amenity, idx) => {
                const IconComponent = amenity.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-[#bccbb9]/40 bg-[#f8f9fa] p-3.5 transition-colors hover:border-[#006e2f]/40 hover:bg-white"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22c55e]/15 text-[#006e2f]">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#191c1d]">
                        {amenity.label}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-[#575e70]">
                        {amenity.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Quy định & Lưu ý */}
          <div className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Quy định & Lưu ý khi sử dụng sân
            </h3>
            <ul className="space-y-2.5">
              {DEFAULT_RULES.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[#575e70]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#006e2f]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column (4 cols): Thông tin quản trị & VÙNG NGUY HIỂM */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: Thông tin quản lý nhanh */}
          <div className="rounded-xl border border-[#bccbb9] bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
              Thông tin quản trị
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-[#bccbb9]/40 pb-2.5">
                <span className="text-[#575e70]">Mã sân (ID):</span>
                <span className="font-mono font-bold text-[#191c1d]">
                  {field.id.substring(0, 8)}...
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#bccbb9]/40 pb-2.5">
                <span className="text-[#575e70]">Loại sân:</span>
                <span className="font-bold text-[#006e2f]">
                  {field.fieldTypeLabel}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#bccbb9]/40 pb-2.5">
                <span className="text-[#575e70]">Kích thước:</span>
                <span className="font-semibold text-[#191c1d]">
                  {field.dimensions || '30m x 50m'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#bccbb9]/40 pb-2.5">
                <span className="text-[#575e70]">Giá thuê tiêu chuẩn:</span>
                <span className="font-bold text-[#006e2f]">
                  {formatVNDPrice(field.basePricePerHour)}/giờ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#575e70]">Trạng thái nhận đơn:</span>
                {field.status === 'ACTIVE' ? (
                  <span className="rounded-full bg-[#22c55e] px-2 py-0.5 text-[11px] font-bold text-white">
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[11px] font-bold text-white">
                    Vô hiệu hóa
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#bccbb9] bg-white py-2.5 text-xs font-bold text-[#191c1d] transition-colors hover:bg-[#f8f9fa]"
              >
                <Edit className="h-4 w-4 text-[#006e2f]" />
                <span>Chỉnh sửa thông tin sân</span>
              </button>
              <Link
                href={`/admin/schedule?fieldId=${field.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#006e2f] py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
              >
                <Calendar className="h-4 w-4" />
                <span>Xem lịch sân hôm nay</span>
              </Link>
            </div>
          </div>

          {/* Card 2: VÙNG NGUY HIỂM (Danger Zone - Giữ nguyên theo yêu cầu) */}
          <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/15 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#ba1a1a]" />
              <h3 className="font-(family-name:--font-manrope) text-base font-bold text-[#ba1a1a]">
                Vùng nguy hiểm
              </h3>
            </div>

            <div className="space-y-4">
              {/* Vô hiệu hóa sân */}
              <div className="rounded-lg border border-[#ba1a1a]/20 bg-white p-3.5 shadow-xs">
                <div className="mb-2">
                  <h4 className="text-xs font-bold text-[#191c1d]">
                    {field.status === 'ACTIVE'
                      ? 'Tạm ngưng hoạt động sân'
                      : 'Kích hoạt lại sân'}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[#575e70]">
                    {field.status === 'ACTIVE'
                      ? 'Khi vô hiệu hóa, khách hàng sẽ không thể tìm thấy hoặc đặt sân này.'
                      : 'Kích hoạt lại để cho phép khách hàng đặt sân bình thường.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors ${
                    field.status === 'ACTIVE'
                      ? 'border border-[#ba1a1a]/30 bg-[#ffdad6]/40 text-[#ba1a1a] hover:bg-[#ffdad6]'
                      : 'bg-[#006e2f] text-white hover:bg-[#004b1e]'
                  }`}
                >
                  {field.status === 'ACTIVE' ? (
                    <>
                      <Ban className="h-4 w-4" />
                      <span>Vô hiệu hóa sân bóng</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Kích hoạt lại sân</span>
                    </>
                  )}
                </button>
              </div>

              {/* Xóa sân vĩnh viễn */}
              <div className="rounded-lg border border-[#ba1a1a]/20 bg-white p-3.5 shadow-xs">
                <div className="mb-2">
                  <h4 className="text-xs font-bold text-[#ba1a1a]">
                    Xóa sân bóng
                  </h4>
                  <p className="mt-0.5 text-[11px] text-[#575e70]">
                    Xóa mềm sân bóng này khỏi hệ thống. Thao tác này không thể hoàn tác nếu không có quyền can thiệp cơ sở dữ liệu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#ba1a1a] py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#93000a]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xóa sân bóng này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chỉnh sửa thông tin sân */}
      {isEditFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="mb-4 flex items-center justify-between border-b border-[#bccbb9]/60 pb-3">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Chỉnh sửa thông tin sân
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFieldModalOpen(false)}
                className="rounded-lg p-1 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldInfo} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Tên sân bóng *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-sm focus:border-[#006e2f] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Giá cơ bản (VNĐ/giờ) *
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-sm focus:border-[#006e2f] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Kích thước
                  </label>
                  <input
                    type="text"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    placeholder="VD: 30m x 50m"
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-sm focus:border-[#006e2f] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Địa chỉ sân *
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-sm focus:border-[#006e2f] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Mô tả giới thiệu
                </label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-sm focus:border-[#006e2f] focus:outline-none"
                  placeholder="Mô tả chất lượng mặt cỏ, dàn đèn, tiện ích..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-[#bccbb9]/40 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditFieldModalOpen(false)}
                  className="rounded-lg border border-[#bccbb9] px-4 py-2 text-xs font-bold text-[#575e70] hover:bg-[#f8f9fa]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa sân */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#ba1a1a]/30 bg-white p-6 shadow-xl animate-in zoom-in-95">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
                  Xác nhận xóa sân bóng
                </h3>
                <p className="text-xs text-[#575e70]">
                  Hành động này sẽ vô hiệu hóa sân bóng vĩnh viễn
                </p>
              </div>
            </div>

            <p className="my-4 rounded-lg bg-[#ffdad6]/30 p-3 text-xs text-[#93000a]">
              Bạn có chắc chắn muốn xóa sân <strong>&quot;{field.name}&quot;</strong>? Sân này sẽ không còn hiển thị cho người dùng đặt lịch.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg border border-[#bccbb9] px-4 py-2 text-xs font-bold text-[#575e70] hover:bg-[#f8f9fa]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-[#ba1a1a] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#93000a]"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
