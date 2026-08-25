/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFieldTypes,
  createAdminField,
  uploadAdminFieldImages,
} from '@/lib/api';
import {
  FieldImageEditor,
  type FieldEditorImage,
} from '@/components/admin/field-image-editor';
import {
  MapPin,
  Wifi,
  Car,
  Store,
  Shirt,
  Save,
  ChevronDown,
  Pin,
} from 'lucide-react';

interface UploadedImage extends FieldEditorImage {
  file: File;
}

export default function AdminNewFieldPage() {
  const router = useRouter();

  // Form State
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('5');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('250000');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('tb');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const { data: fieldTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['field-types'],
    queryFn: fetchFieldTypes,
  });

  // Amenities State
  const [amenities, setAmenities] = useState({
    wifi: true,
    parking: true,
    canteen: false,
    dressingRoom: false,
  });

  // Images State
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const performRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary)) {
        return filtered.map((img, index) => ({
          ...img,
          isPrimary: index === 0,
        }));
      }
      return filtered;
    });
    toast.success('Đã xóa ảnh khỏi danh sách tải lên.');
  };

  const handleRemoveImage = (id: string) => {
    toast.warning('Bạn có chắc muốn bỏ ảnh này?', {
      action: {
        label: 'Xóa ảnh',
        onClick: () => performRemoveImage(id),
      },
      cancel: { label: 'Hủy', onClick: () => undefined },
      duration: 8000,
    });
  };

  const handleSetCover = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      })),
    );
    toast.success('Đã chọn ảnh bìa mới.');
  };

  const handleFileUpload = (fileList: File[]) => {
    if (images.length + fileList.length > 5) {
      toast.warning('Tối đa chỉ được tải lên 5 hình ảnh.');
      return;
    }

    const newImgs: UploadedImage[] = fileList.map((file, idx) => ({
      id: `img-uploaded-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0,
      file,
    }));

    setImages((prev) => [...prev, ...newImgs]);
    toast.success(`Đã thêm ${newImgs.length} ảnh vào thư viện.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim() || !address.trim()) {
      toast.warning('Vui lòng nhập đầy đủ tên sân và địa chỉ.');
      return;
    }

    const districtMap: Record<string, string> = {
      q1: 'Quận 1',
      q3: 'Quận 3',
      q7: 'Quận 7',
      q10: 'Quận 10',
      tb: 'Tân Bình',
      bt: 'Bình Thạnh',
      gv: 'Gò Vấp',
      td: 'TP. Thủ Đức',
    };

    // Find matching field_type
    const targetType =
      fieldTypes?.find((ft) =>
        ft.name
          .toLowerCase()
          .includes(fieldType === '5' ? '5' : fieldType === '7' ? '7' : '11'),
      ) || fieldTypes?.[0];

    if (!targetType) {
      toast.error('Không tìm thấy loại sân tương ứng trong hệ thống');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createAdminField({
        name: fieldName,
        fieldTypeId: targetType.id,
        description: description || undefined,
        address,
        city: 'Hồ Chí Minh',
        district: districtMap[district] || 'Tân Bình',
        basePricePerHour: Number(basePrice) || 250000,
        status,
      });

      if (images.length > 0) {
        const formData = new FormData();
        const orderedImages = [...images].sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
        );
        orderedImages.forEach((image) => formData.append('images', image.file));
        await uploadAdminFieldImages(created.id, formData);
      }

      toast.success(
        `Đã lưu sân bóng "${fieldName}" thành công vào cơ sở dữ liệu!`,
      );
      setTimeout(() => {
        router.push('/admin/fields');
      }, 1000);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Có lỗi xảy ra khi tạo sân bóng';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Left Column (2/3) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Section: Thông tin cơ bản */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Thông tin cơ bản
            </h3>

            <div className="space-y-4">
              {/* Tên sân */}
              <div>
                <label
                  htmlFor="field-name"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                >
                  Tên sân <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="field-name"
                  type="text"
                  required
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="Ví dụ: Sân cỏ nhân tạo A1"
                  className="w-full rounded-lg border border-[#bccbb9] bg-white px-4 py-3 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              {/* Grid: Loại sân & Giá cơ bản */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="field-type"
                    className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                  >
                    Loại sân <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="field-type"
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[#bccbb9] bg-white px-4 py-3 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    >
                      <option value="5">Sân 5 người</option>
                      <option value="7">Sân 7 người</option>
                      <option value="11">Sân 11 người</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="field-price"
                    className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                  >
                    Giá cơ bản / giờ (VNĐ){' '}
                    <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    id="field-price"
                    type="number"
                    step="10000"
                    min="0"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="Ví dụ: 250000"
                    className="w-full rounded-lg border border-[#bccbb9] bg-white px-4 py-3 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label
                  htmlFor="field-desc"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                >
                  Mô tả
                </label>
                <textarea
                  id="field-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả chi tiết về sân bóng, chất lượng mặt cỏ, hệ thống chiếu sáng..."
                  className="w-full rounded-lg border border-[#bccbb9] bg-white px-4 py-3 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>
            </div>
          </section>

          {/* Section: Hình ảnh */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Hình ảnh sân bóng
              </h3>
              <p className="mt-1 text-xs text-[#575e70]">
                Ảnh bìa sẽ được hiển thị đầu tiên trên trang tìm kiếm và chi
                tiết sân.
              </p>
            </div>
            <FieldImageEditor
              images={images}
              onFilesSelected={handleFileUpload}
              onRemove={(image) => handleRemoveImage(image.id)}
              onSetPrimary={(image) => handleSetCover(image.id)}
              maxImages={5}
            />
          </section>
        </div>

        {/* Right Column (1/3) */}
        <div className="flex flex-col gap-6">
          {/* Section: Địa điểm */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Địa điểm
            </h3>

            <div className="space-y-4">
              {/* Địa chỉ chi tiết */}
              <div>
                <label
                  htmlFor="field-address"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                >
                  Địa chỉ chi tiết <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                  <input
                    id="field-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    className="w-full rounded-lg border border-[#bccbb9] bg-white py-3 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                </div>
              </div>

              {/* Quận / Huyện */}
              <div>
                <label
                  htmlFor="field-district"
                  className="mb-1.5 block text-xs sm:text-sm font-semibold text-[#575e70]"
                >
                  Quận / Huyện
                </label>
                <div className="relative">
                  <select
                    id="field-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-[#bccbb9] bg-white px-4 py-3 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="q1">Quận 1</option>
                    <option value="q2">Quận 2 (TP. Thủ Đức)</option>
                    <option value="q3">Quận 3</option>
                    <option value="q7">Quận 7</option>
                    <option value="tb">Tân Bình</option>
                    <option value="gv">Gò Vấp</option>
                    <option value="bt">Bình Thạnh</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                </div>
              </div>

              {/* Map Preview Box */}
              <div className="relative h-32 overflow-hidden rounded-lg border border-[#bccbb9] bg-[#f3f4f5]">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=60"
                  alt="Bản đồ vị trí"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                  <button
                    type="button"
                    onClick={() =>
                      toast.success('Đã lưu tọa độ vị trí của sân.')
                    }
                    className="flex items-center gap-1.5 rounded-full border border-[#bccbb9] bg-white px-3.5 py-1.5 text-xs font-bold text-[#006e2f] shadow-sm hover:bg-[#f8f9fa]"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    <span>Ghim vị trí</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Tiện ích */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Tiện ích
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Wifi */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f3f4f5]">
                <input
                  type="checkbox"
                  checked={amenities.wifi}
                  onChange={(e) =>
                    setAmenities({ ...amenities, wifi: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#bccbb9] text-[#006e2f] focus:ring-[#006e2f]"
                />
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#191c1d]">
                  <Wifi className="h-4 w-4 text-[#575e70]" />
                  <span>Wifi</span>
                </span>
              </label>

              {/* Bãi đỗ xe */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f3f4f5]">
                <input
                  type="checkbox"
                  checked={amenities.parking}
                  onChange={(e) =>
                    setAmenities({ ...amenities, parking: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#bccbb9] text-[#006e2f] focus:ring-[#006e2f]"
                />
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#191c1d]">
                  <Car className="h-4 w-4 text-[#575e70]" />
                  <span>Bãi đỗ xe</span>
                </span>
              </label>

              {/* Canteen */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f3f4f5]">
                <input
                  type="checkbox"
                  checked={amenities.canteen}
                  onChange={(e) =>
                    setAmenities({ ...amenities, canteen: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#bccbb9] text-[#006e2f] focus:ring-[#006e2f]"
                />
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#191c1d]">
                  <Store className="h-4 w-4 text-[#575e70]" />
                  <span>Canteen</span>
                </span>
              </label>

              {/* Phòng thay đồ */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f3f4f5]">
                <input
                  type="checkbox"
                  checked={amenities.dressingRoom}
                  onChange={(e) =>
                    setAmenities({
                      ...amenities,
                      dressingRoom: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-[#bccbb9] text-[#006e2f] focus:ring-[#006e2f]"
                />
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[#191c1d]">
                  <Shirt className="h-4 w-4 text-[#575e70]" />
                  <span>Phòng thay đồ</span>
                </span>
              </label>
            </div>
          </section>

          {/* Section: Trạng thái */}
          <section className="rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Trạng thái
            </h3>

            <div className="flex flex-col gap-3">
              {/* Active Option */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  status === 'ACTIVE'
                    ? 'border-[#006e2f] bg-[#22c55e]/10'
                    : 'border-[#bccbb9] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={status === 'ACTIVE'}
                  onChange={() => setStatus('ACTIVE')}
                  className="mt-0.5 h-4 w-4 text-[#006e2f] focus:ring-[#006e2f]"
                />
                <div>
                  <span className="block text-xs sm:text-sm font-bold text-[#191c1d]">
                    Đang hoạt động
                  </span>
                  <span className="block text-[11px] text-[#575e70] mt-0.5">
                    Sân sẵn sàng nhận khách đặt
                  </span>
                </div>
              </label>

              {/* Inactive Option */}
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  status === 'INACTIVE'
                    ? 'border-[#575e70] bg-[#e1e3e4]/40'
                    : 'border-[#bccbb9] bg-white hover:bg-[#f8f9fa]'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={status === 'INACTIVE'}
                  onChange={() => setStatus('INACTIVE')}
                  className="mt-0.5 h-4 w-4 text-[#575e70] focus:ring-[#575e70]"
                />
                <div>
                  <span className="block text-xs sm:text-sm font-bold text-[#191c1d]">
                    Vô hiệu hóa
                  </span>
                  <span className="block text-[11px] text-[#575e70] mt-0.5">
                    Tạm dừng hoạt động / Bảo trì
                  </span>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Action Footer Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-[#bccbb9] pt-6 lg:col-span-3">
          <Link
            href="/admin/fields"
            className="rounded-xl border border-[#bccbb9] bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#191c1d] shadow-sm transition-all hover:bg-[#e7e8e9]"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#006e2f] px-7 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Đang lưu...' : 'Lưu sân bóng'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
