'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CloudUpload,
  Trash2,
  MapPin,
  Wifi,
  Car,
  Store,
  Shirt,
  CheckCircle2,
  X,
  Save,
  ChevronDown,
  Pin,
} from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  isCover: boolean;
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

  // Amenities State
  const [amenities, setAmenities] = useState({
    wifi: true,
    parking: true,
    canteen: false,
    dressingRoom: false,
  });

  // Images State
  const [images, setImages] = useState<UploadedImage[]>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80',
      isCover: true,
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop&q=80',
      isCover: false,
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const handleSetCover = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === id,
      }))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      alert('Tối đa chỉ được tải lên 5 hình ảnh.');
      return;
    }

    const newImgs: UploadedImage[] = Array.from(files).map((file, idx) => ({
      id: `img-uploaded-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      isCover: images.length === 0 && idx === 0,
    }));

    setImages((prev) => [...prev, ...newImgs]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim() || !address.trim()) {
      alert('Vui lòng nhập đầy đủ tên sân và địa chỉ.');
      return;
    }

    setIsSubmitting(true);
    showToast(`Đã lưu sân bóng "${fieldName}" thành công!`);

    setTimeout(() => {
      router.push('/admin/fields');
    }, 1200);
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                    Giá cơ bản / giờ (VNĐ) <span className="text-[#ba1a1a]">*</span>
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
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Hình ảnh
              </h3>
              <span className="text-xs text-[#575e70]">Tối đa 5 ảnh</span>
            </div>

            <div className="space-y-4">
              {/* Upload Area */}
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bccbb9] bg-[#f8f9fa] p-8 text-center transition-colors hover:bg-[#e7e8e9]/50">
                <CloudUpload className="mb-2 h-10 w-10 text-[#575e70] transition-colors group-hover:text-[#006e2f]" />
                <p className="text-xs sm:text-sm font-semibold text-[#191c1d]">
                  Kéo thả hình ảnh vào đây hoặc click để tải lên
                </p>
                <p className="mt-1 text-[11px] text-[#575e70]">
                  Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 5MB)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Preview Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-[#bccbb9] bg-[#edeeef]"
                  >
                    <img
                      src={img.url}
                      alt="Xem trước ảnh sân"
                      className="h-full w-full object-cover"
                    />

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-[#006e2f] shadow-sm hover:bg-[#f3f4f5]"
                        >
                          Đặt ảnh bìa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="rounded-full bg-[#ba1a1a] p-1.5 text-white transition-colors hover:bg-[#93000a]"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Cover Badge */}
                    {img.isCover && (
                      <div className="absolute left-2 top-2 rounded bg-[#006e2f] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                        Ảnh bìa
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                    onClick={() => showToast('Đã lưu tọa độ vị trí của sân.')}
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
                    setAmenities({ ...amenities, dressingRoom: e.target.checked })
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
