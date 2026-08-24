/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Check,
  Calendar,
  AlertTriangle,
  Receipt,
  Plus,
  Ban,
} from 'lucide-react';

// Types aligned with database/init.sql
export interface PriceRuleItem {
  id: string;
  fieldId: string;
  name: string;
  daysDisplay: string;
  daysOfWeek: number[]; // [1, 2, 3, 4, 5] (0 = Sunday, 1 = Monday...)
  startTime: string; // '06:00'
  endTime: string; // '17:00'
  pricePerHour: number; // 200000
  isActive: boolean;
}

export interface FieldDetailFullData {
  id: string;
  name: string;
  fieldType: string; // '5-a-side' | '7-a-side' | '11-a-side'
  fieldTypeLabel: string; // 'Sân 5 người'
  dimensions: string; // '20m x 40m'
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
  basePricePerHour: number;
  upcomingBookingsCount: number;
  description: string;
  imageUrl: string;
  priceRules: PriceRuleItem[];
}

const MOCK_FIELD_DATA: FieldDetailFullData = {
  id: 'f-1',
  name: 'Sân bóng Mini Lam Sơn 1',
  fieldType: '5-a-side',
  fieldTypeLabel: 'Sân 5 người',
  dimensions: '20m x 40m',
  status: 'ACTIVE',
  address: '320/1 Trần Bình Trọng, Quận 5, TP. HCM',
  basePricePerHour: 250000,
  upcomingBookingsCount: 12,
  description:
    'Sân cỏ nhân tạo chất lượng cao, hệ thống thoát nước chuẩn, dàn đèn LED chiếu sáng ban đêm cực sáng. Phù hợp cho các trận đấu giao hữu 5 người và rèn luyện thể thao.',
  imageUrl:
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
  priceRules: [
    {
      id: 'pr-1',
      fieldId: 'f-1',
      name: 'Ngày thường - Ban ngày',
      daysDisplay: 'Thứ 2 - Thứ 6',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '06:00',
      endTime: '17:00',
      pricePerHour: 200000,
      isActive: true,
    },
    {
      id: 'pr-2',
      fieldId: 'f-1',
      name: 'Ngày thường - Buổi tối',
      daysDisplay: 'Thứ 2 - Thứ 6',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '17:00',
      endTime: '22:00',
      pricePerHour: 250000,
      isActive: true,
    },
    {
      id: 'pr-3',
      fieldId: 'f-1',
      name: 'Cuối tuần',
      daysDisplay: 'Thứ 7 - CN',
      daysOfWeek: [6, 0],
      startTime: '06:00',
      endTime: '22:00',
      pricePerHour: 300000,
      isActive: true,
    },
  ],
};

const DAY_OPTIONS = [
  { label: 'Thứ 2', value: 1 },
  { label: 'Thứ 3', value: 2 },
  { label: 'Thứ 4', value: 3 },
  { label: 'Thứ 5', value: 4 },
  { label: 'Thứ 6', value: 5 },
  { label: 'Thứ 7', value: 6 },
  { label: 'Chủ Nhật', value: 0 },
];

export default function AdminFieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const fieldId = resolvedParams.id;

  const [field, setField] = useState<FieldDetailFullData>({
    ...MOCK_FIELD_DATA,
    id: fieldId,
  });

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditFieldModalOpen, setIsEditFieldModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingPriceRule, setEditingPriceRule] =
    useState<PriceRuleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Field Edit Form State
  const [editName, setEditName] = useState(field.name);
  const [editAddress, setEditAddress] = useState(field.address);
  const [editDimensions, setEditDimensions] = useState(field.dimensions);
  const [editPrice, setEditPrice] = useState(field.basePricePerHour.toString());
  const [editDesc, setEditDesc] = useState(field.description);

  // Price Rule Form State
  const [ruleName, setRuleName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('17:00');
  const [priceInput, setPriceInput] = useState('200000');
  const [isRuleActive, setIsRuleActive] = useState(true);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ/h';
  };

  const formatVNDPrice = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle field status (Active / Disabled)
  const handleToggleStatus = () => {
    const nextStatus = field.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setField((prev) => ({ ...prev, status: nextStatus }));
    showToast(
      nextStatus === 'ACTIVE'
        ? `Đã kích hoạt hoạt động sân "${field.name}"!`
        : `Đã vô hiệu hóa sân "${field.name}".`,
    );
  };

  // Save Field Info
  const handleSaveFieldInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setField((prev) => ({
      ...prev,
      name: editName,
      address: editAddress,
      dimensions: editDimensions,
      basePricePerHour: parseInt(editPrice, 10) || prev.basePricePerHour,
      description: editDesc,
    }));
    setIsEditFieldModalOpen(false);
    showToast('Cập nhật thông tin sân bóng thành công!');
  };

  // Price Rule Actions
  const handleOpenCreatePriceModal = () => {
    setEditingPriceRule(null);
    setRuleName('');
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartTime('06:00');
    setEndTime('17:00');
    setPriceInput('200000');
    setIsRuleActive(true);
    setIsPriceModalOpen(true);
  };

  const handleOpenEditPriceModal = (rule: PriceRuleItem) => {
    setEditingPriceRule(rule);
    setRuleName(rule.name);
    setSelectedDays(rule.daysOfWeek);
    setStartTime(rule.startTime);
    setEndTime(rule.endTime);
    setPriceInput(rule.pricePerHour.toString());
    setIsRuleActive(rule.isActive);
    setIsPriceModalOpen(true);
  };

  const handleDeletePriceRule = (ruleId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mức giá này?')) {
      setField((prev) => ({
        ...prev,
        priceRules: prev.priceRules.filter((r) => r.id !== ruleId),
      }));
      showToast('Đã xóa mức giá.');
    }
  };

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal)
        ? prev.filter((d) => d !== dayVal)
        : [...prev, dayVal],
    );
  };

  const handleSavePriceRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      alert('Vui lòng nhập tên mức giá.');
      return;
    }
    if (selectedDays.length === 0) {
      alert('Vui lòng chọn ít nhất một ngày áp dụng.');
      return;
    }

    const priceNumber = parseInt(priceInput, 10) || 0;

    let daysLabel = 'Tùy chỉnh';
    if (
      selectedDays.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => selectedDays.includes(d))
    ) {
      daysLabel = 'Thứ 2 - Thứ 6';
    } else if (
      selectedDays.length === 2 &&
      [6, 0].every((d) => selectedDays.includes(d))
    ) {
      daysLabel = 'Thứ 7 - CN';
    } else if (selectedDays.length === 7) {
      daysLabel = 'Cả tuần';
    }

    if (editingPriceRule) {
      setField((prev) => ({
        ...prev,
        priceRules: prev.priceRules.map((r) =>
          r.id === editingPriceRule.id
            ? {
                ...r,
                name: ruleName,
                daysDisplay: daysLabel,
                daysOfWeek: selectedDays,
                startTime,
                endTime,
                pricePerHour: priceNumber,
                isActive: isRuleActive,
              }
            : r,
        ),
      }));
      showToast(`Đã cập nhật mức giá "${ruleName}"!`);
    } else {
      const newRule: PriceRuleItem = {
        id: `pr-${Date.now()}`,
        fieldId: field.id,
        name: ruleName,
        daysDisplay: daysLabel,
        daysOfWeek: selectedDays,
        startTime,
        endTime,
        pricePerHour: priceNumber,
        isActive: isRuleActive,
      };
      setField((prev) => ({
        ...prev,
        priceRules: [...prev.priceRules, newRule],
      }));
      showToast(`Đã thêm mức giá "${ruleName}"!`);
    }

    setIsPriceModalOpen(false);
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

      {/* Back Link */}
      <div>
        <Link
          href="/admin/fields"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#575e70] transition-colors hover:text-[#006e2f]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* Field Summary Card */}
      <div className="overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-sm flex flex-col md:flex-row">
        {/* Pitch Image with Status Badge */}
        <div className="relative h-64 md:h-auto md:w-1/3 shrink-0">
          <img
            src={field.imageUrl}
            alt={field.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[#c8e6c9] bg-[#e8f5e9] px-3 py-1 text-xs font-bold text-[#2e7d32] shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {field.status === 'ACTIVE' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
            </span>
          </div>
        </div>

        {/* Info & Metrics Grid */}
        <div className="flex flex-1 flex-col justify-between p-6 md:w-2/3">
          <div>
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-(family-name:--font-manrope) text-xl sm:text-2xl font-bold text-[#191c1d]">
                {field.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditName(field.name);
                  setEditAddress(field.address);
                  setEditDimensions(field.dimensions);
                  setEditPrice(field.basePricePerHour.toString());
                  setEditDesc(field.description);
                  setIsEditFieldModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-transparent p-2 text-xs sm:text-sm font-semibold text-[#006e2f] transition-colors hover:border-[#bccbb9] hover:bg-[#f3f4f5]"
              >
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </button>
            </div>

            <div className="mb-4 flex items-center gap-1.5 text-xs sm:text-sm text-[#575e70]">
              <MapPin className="h-4 w-4 text-[#575e70]" />
              <span>{field.address}</span>
            </div>

            {/* 4 Metric Boxes */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Loại sân
                </p>
                <p className="flex items-center gap-1.5 font-bold text-[#191c1d] text-sm">
                  <span className="h-2 w-2 rounded-full bg-[#006e2f]" />
                  <span>{field.fieldTypeLabel}</span>
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Kích thước
                </p>
                <p className="font-bold text-[#191c1d] text-sm">
                  {field.dimensions}
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Giá cơ bản
                </p>
                <p className="font-bold text-[#191c1d] text-sm">
                  {formatVND(field.basePricePerHour)}
                </p>
              </div>

              <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3.5">
                <p className="mb-1 text-xs font-semibold text-[#575e70]">
                  Đơn sắp tới
                </p>
                <p className="font-bold text-[#006e2f] text-sm">
                  {field.upcomingBookingsCount} đơn
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 border-t border-[#bccbb9]/60 pt-4">
            <Link
              href={`/admin/schedule?fieldId=${field.id}`}
              className="flex items-center gap-2 rounded-xl bg-[#e7e8e9] px-4 py-2 text-xs sm:text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#d9dadb]"
            >
              <Calendar className="h-4 w-4 text-[#006e2f]" />
              <span>Xem lịch trống</span>
            </Link>

            <Link
              href={`/admin/bookings?fieldId=${field.id}`}
              className="flex items-center gap-2 rounded-xl bg-[#e7e8e9] px-4 py-2 text-xs sm:text-sm font-semibold text-[#191c1d] transition-colors hover:bg-[#d9dadb]"
            >
              <Receipt className="h-4 w-4 text-[#006e2f]" />
              <span>Danh sách đơn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Embedded Section: Quản lý giá — [Tên sân] */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="font-(family-name:--font-manrope) text-xl font-extrabold tracking-tight text-[#191c1d]">
            Quản lý giá — {field.name}
          </h3>
          <button
            type="button"
            onClick={handleOpenCreatePriceModal}
            className="flex items-center gap-2 rounded-xl bg-[#006e2f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm mức giá mới</span>
          </button>
        </div>

        {/* Price Rules Table */}
        <div className="overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#bccbb9] bg-[#f8f9fa] text-xs font-semibold text-[#575e70]">
                  <th className="px-6 py-4 whitespace-nowrap">Tên mức giá</th>
                  <th className="px-6 py-4 whitespace-nowrap">Ngày áp dụng</th>
                  <th className="px-6 py-4 whitespace-nowrap">Khung giờ</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">
                    Giá/giờ
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bccbb9]/40 text-[#191c1d]">
                {field.priceRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#575e70]">
                      Chưa có mức giá nào được thiết lập.
                    </td>
                  </tr>
                ) : (
                  field.priceRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="group transition-colors hover:bg-[#f8f9fa]"
                    >
                      <td className="px-6 py-4 font-bold text-[#191c1d] whitespace-nowrap">
                        {rule.name}
                      </td>
                      <td className="px-6 py-4 text-[#575e70] whitespace-nowrap">
                        {rule.daysDisplay}
                      </td>
                      <td className="px-6 py-4 text-[#575e70] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#575e70]" />
                          <span>
                            {rule.startTime} - {rule.endTime}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#006e2f] whitespace-nowrap">
                        {formatVNDPrice(rule.pricePerHour)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            rule.isActive
                              ? 'bg-[#dcfce7] text-[#166534]'
                              : 'bg-[#f3f4f5] text-[#575e70]'
                          }`}
                        >
                          {rule.isActive ? 'Hoạt động' : 'Tạm tắt'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPriceModal(rule)}
                            className="rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePriceRule(rule.id)}
                            className="rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Danger Zone (Vùng nguy hiểm) */}
      <div className="overflow-hidden rounded-2xl border border-[#ffdad6] bg-[#fff5f5]">
        {/* Header */}
        <div className="border-b border-[#ffdad6] bg-[#ffdad6] px-6 py-4 text-[#93000a]">
          <h4 className="flex items-center gap-2 font-(family-name:--font-manrope) text-base sm:text-lg font-bold">
            <AlertTriangle className="h-5 w-5 text-[#ba1a1a]" />
            <span>Vùng nguy hiểm</span>
          </h4>
          <p className="mt-1 text-xs sm:text-sm text-[#93000a]">
            Các thao tác dưới đây có thể ảnh hưởng nghiêm trọng đến dữ liệu hệ
            thống.
          </p>
        </div>

        {/* Content Actions */}
        <div className="p-6 space-y-6">
          {/* Row 1: Vô hiệu hóa sân */}
          <div className="flex flex-col justify-between gap-4 border-b border-[#ffdad6] pb-6 md:flex-row md:items-center">
            <div>
              <h5 className="font-bold text-[#191c1d] text-xs sm:text-sm mb-1">
                {field.status === 'ACTIVE'
                  ? 'Vô hiệu hóa sân'
                  : 'Kích hoạt lại sân'}
              </h5>
              <p className="text-xs sm:text-sm text-[#575e70]">
                Tạm dừng hoạt động đặt sân mới. Các đơn đã đặt vẫn được giữ
                nguyên.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleStatus}
              className="whitespace-nowrap rounded-xl border border-[#ba1a1a] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#ba1a1a] transition-colors hover:bg-[#ba1a1a] hover:text-white"
            >
              {field.status === 'ACTIVE'
                ? 'Vô hiệu hóa sân'
                : 'Kích hoạt lại sân'}
            </button>
          </div>

          {/* Row 2: Xóa sân vĩnh viễn */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h5 className="font-bold text-[#191c1d] text-xs sm:text-sm mb-1">
                Xóa sân vĩnh viễn
              </h5>
              <p className="text-xs sm:text-sm text-[#575e70]">
                Xóa hoàn toàn sân này khỏi hệ thống. Không thể hoàn tác hành
                động này.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="whitespace-nowrap rounded-xl bg-[#ba1a1a] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Xóa sân
            </button>
          </div>
        </div>
      </div>

      {/* Delete Restriction Modal (Không thể xóa sân này) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <Ban className="h-7 w-7" />
            </div>

            <h3 className="font-(family-name:--font-manrope) text-lg sm:text-xl font-bold text-[#191c1d] mb-2">
              Không thể xóa sân này
            </h3>

            <p className="text-xs sm:text-sm text-[#575e70] mb-6 leading-relaxed">
              Sân bóng <strong>&ldquo;{field.name}&rdquo;</strong> hiện đang có{' '}
              <strong className="text-[#ba1a1a]">
                {field.upcomingBookingsCount} đơn đặt sân
              </strong>{' '}
              đang chờ xử lý hoặc sắp diễn ra. Vui lòng hoàn tất hoặc hủy các
              đơn này trước khi thực hiện xóa.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href={`/admin/bookings?fieldId=${field.id}`}
                className="w-full rounded-xl bg-[#006e2f] py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#004b1e] transition-colors"
              >
                Xem các đơn liên quan
              </Link>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 text-xs sm:text-sm font-semibold text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thêm / Sửa mức giá */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-[#bccbb9] bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#bccbb9]/60 px-6 py-4">
              <h3 className="font-(family-name:--font-manrope) text-lg sm:text-xl font-bold text-[#191c1d]">
                {editingPriceRule ? 'Chỉnh sửa mức giá' : 'Thêm mức giá mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPriceModalOpen(false)}
                className="rounded-full p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSavePriceRule}
              className="p-6 space-y-5 text-xs sm:text-sm"
            >
              <div>
                <label className="mb-1.5 block font-semibold text-[#191c1d]">
                  Tên mức giá <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="VD: Lễ Tết, Giờ vàng..."
                  className="w-full rounded-xl border border-[#bccbb9] bg-white px-4 py-2.5 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-[#191c1d]">
                  Ngày áp dụng <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`rounded-lg border px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                          isSelected
                            ? 'border-[#006e2f] bg-[#22c55e]/20 text-[#004b1e]'
                            : 'border-[#bccbb9] bg-white text-[#575e70] hover:bg-[#f8f9fa]'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block font-semibold text-[#191c1d]">
                    Giờ bắt đầu
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block font-semibold text-[#191c1d]">
                    Giờ kết thúc
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-semibold text-[#191c1d]">
                  Giá theo giờ (VND) <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    required
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-4 pr-12 text-xs sm:text-sm font-bold text-[#006e2f] focus:border-[#006e2f] focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#575e70]">
                    VNĐ
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#bccbb9] bg-[#f8f9fa] p-4">
                <div>
                  <p className="font-bold text-[#191c1d]">Trạng thái áp dụng</p>
                  <p className="text-[11px] text-[#575e70] mt-0.5">
                    Kích hoạt mức giá này ngay sau khi lưu
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isRuleActive}
                    onChange={(e) => setIsRuleActive(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-[#d9dadb] transition-all peer peer-checked:bg-[#006e2f] peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all" />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#bccbb9]/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#006e2f] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  Lưu mức giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa thông tin sân bóng */}
      {isEditFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <h3 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                Chỉnh sửa thông tin sân bóng
              </h3>
              <button
                type="button"
                onClick={() => setIsEditFieldModalOpen(false)}
                className="rounded-full p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveFieldInfo}
              className="my-4 space-y-3.5 text-xs sm:text-sm"
            >
              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Tên sân bóng
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full rounded-xl border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Kích thước
                  </label>
                  <input
                    type="text"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    placeholder="VD: 20m x 40m"
                    className="w-full rounded-xl border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Giá cơ bản / giờ
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none font-bold text-[#006e2f]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditFieldModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  <Check className="h-4 w-4" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
