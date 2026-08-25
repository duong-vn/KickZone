/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminFieldById,
  createAdminPriceRule,
  updateAdminPriceRule,
  deleteAdminPriceRule,
} from '@/lib/api';
import {
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  Ban,
  ArrowLeft,
} from 'lucide-react';

// Types aligned with database/init.sql
export interface PriceRuleItem {
  id: string;
  fieldId: string;
  name: string; // 'Ngày thường - Ban ngày'
  daysDisplay: string; // 'Thứ 2 - Thứ 6'
  daysOfWeek: number[]; // [1, 2, 3, 4, 5] (0 = Sunday, 1 = Monday...)
  startTime: string; // '06:00'
  endTime: string; // '17:00'
  pricePerHour: number; // 200000
  isActive: boolean;
}

export interface FieldPricingData {
  id: string;
  name: string;
  fieldType: string; // 'Sân 7 người'
  status: 'ACTIVE' | 'INACTIVE';
  address: string;
  imageUrl: string;
  priceRules: PriceRuleItem[];
}

const MOCK_FIELD_PRICING: FieldPricingData = {
  id: 'green-arena',
  name: 'Green Arena',
  fieldType: 'Sân 7 người',
  status: 'ACTIVE',
  address: '123 Đường Sân Cỏ, Phường Thể Thao, Quận 1, TP. HCM',
  imageUrl:
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&auto=format&fit=crop&q=80',
  priceRules: [
    {
      id: 'pr-1',
      fieldId: 'green-arena',
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
      fieldId: 'green-arena',
      name: 'Ngày thường - Buổi tối',
      daysDisplay: 'Thứ 2 - Thứ 6',
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '17:00',
      endTime: '22:00',
      pricePerHour: 300000,
      isActive: true,
    },
    {
      id: 'pr-3',
      fieldId: 'green-arena',
      name: 'Cuối tuần',
      daysDisplay: 'Thứ 7 - CN',
      daysOfWeek: [6, 0],
      startTime: '06:00',
      endTime: '22:00',
      pricePerHour: 350000,
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

export default function AdminFieldPricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = React.use(params);
  const fieldId = resolvedParams.id;
  const queryClient = useQueryClient();

  const { data: apiField, isLoading } = useQuery({
    queryKey: ['admin-field-pricing', fieldId],
    queryFn: () => fetchAdminFieldById(fieldId),
    retry: false,
  });

  const [localFieldData, setLocalFieldData] =
    useState<Partial<FieldPricingData> | null>(null);

  const fieldData: FieldPricingData = useMemo(
    () => ({
      ...MOCK_FIELD_PRICING,
      ...(apiField || {}),
      ...(localFieldData || {}),
      id: fieldId,
    }),
    [apiField, localFieldData, fieldId],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRuleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [ruleName, setRuleName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('17:00');
  const [priceInput, setPriceInput] = useState('200000');
  const [isActive, setIsActive] = useState(true);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setRuleName('');
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartTime('06:00');
    setEndTime('17:00');
    setPriceInput('200000');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: PriceRuleItem) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setSelectedDays(rule.daysOfWeek);
    setStartTime(rule.startTime);
    setEndTime(rule.endTime);
    setPriceInput(rule.pricePerHour.toString());
    setIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa mức giá này?')) {
      setLocalFieldData((prev) => ({
        ...(prev || {}),
        priceRules: (prev?.priceRules || fieldData.priceRules).filter(
          (r) => r.id !== ruleId,
        ),
      }));
      try {
        await deleteAdminPriceRule(fieldId, ruleId);
        queryClient.invalidateQueries({
          queryKey: ['admin-field-pricing', fieldId],
        });
        queryClient.invalidateQueries({ queryKey: ['admin-field', fieldId] });
        showToast('Đã xóa mức giá thành công.');
      } catch (err) {
        showToast(`Lỗi khi xóa quy tắc: ${(err as Error).message}`);
      }
    }
  };

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal)
        ? prev.filter((d) => d !== dayVal)
        : [...prev, dayVal],
    );
  };

  const handleSaveRule = async (e: React.FormEvent) => {
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

    // Generate daysDisplay label
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

    if (editingRule) {
      // Update rule
      setLocalFieldData((prev) => ({
        ...(prev || {}),
        priceRules: (prev?.priceRules || fieldData.priceRules).map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: ruleName,
                daysDisplay: daysLabel,
                daysOfWeek: selectedDays,
                startTime,
                endTime,
                pricePerHour: priceNumber,
                isActive,
              }
            : r,
        ),
      }));

      try {
        await updateAdminPriceRule(fieldId, editingRule.id, {
          name: ruleName,
          daysOfWeek: selectedDays,
          startTime,
          endTime,
          pricePerHour: priceNumber,
          isActive,
        });
        queryClient.invalidateQueries({
          queryKey: ['admin-field-pricing', fieldId],
        });
        queryClient.invalidateQueries({ queryKey: ['admin-field', fieldId] });
        showToast(`Đã cập nhật mức giá "${ruleName}" thành công!`);
      } catch (err) {
        showToast(`Lỗi khi lưu quy tắc: ${(err as Error).message}`);
      }
    } else {
      // Create rule
      const newRule: PriceRuleItem = {
        id: `pr-${Date.now()}`,
        fieldId: fieldData.id,
        name: ruleName,
        daysDisplay: daysLabel,
        daysOfWeek: selectedDays,
        startTime,
        endTime,
        pricePerHour: priceNumber,
        isActive,
      };
      setLocalFieldData((prev) => ({
        ...(prev || {}),
        priceRules: [...(prev?.priceRules || fieldData.priceRules), newRule],
      }));

      try {
        await createAdminPriceRule(fieldId, {
          name: ruleName,
          daysOfWeek: selectedDays,
          startTime,
          endTime,
          pricePerHour: priceNumber,
          isActive,
        });
        queryClient.invalidateQueries({
          queryKey: ['admin-field-pricing', fieldId],
        });
        queryClient.invalidateQueries({ queryKey: ['admin-field', fieldId] });
        showToast(`Đã thêm mức giá "${ruleName}" thành công!`);
      } catch (err) {
        showToast(`Lỗi khi tạo quy tắc: ${(err as Error).message}`);
      }
    }

    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
          <div className="h-10 w-36 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!apiField && fieldId !== 'green-arena') {
    return (
      <div className="mx-auto w-full max-w-7xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          <Ban className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Không tìm thấy sân bóng
        </h2>
        <p className="text-slate-500 text-sm max-w-md mb-6">
          Sân bóng không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          href="/admin/fields"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#575e70]">
        <Link
          href="/admin/fields"
          className="transition-colors hover:text-[#006e2f]"
        >
          Sân bóng
        </Link>
        <ChevronRight className="h-4 w-4 text-[#bccbb9]" />
        <Link
          href="/admin/fields"
          className="transition-colors hover:text-[#006e2f]"
        >
          {fieldData.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-[#bccbb9]" />
        <span className="font-semibold text-[#191c1d]">Quản lý giá</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191c1d]">
          Quản lý giá — {fieldData.name}
        </h2>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 rounded-xl bg-[#006e2f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm mức giá mới</span>
        </button>
      </div>

      {/* Field Info Banner Card */}
      <div className="flex flex-col gap-6 rounded-xl border border-[#bccbb9] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
          <img
            src={fieldData.imageUrl}
            alt={fieldData.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-(family-name:--font-manrope) text-xl font-bold text-[#191c1d]">
              {fieldData.name}
            </h3>
            <span className="rounded-md bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
              {fieldData.fieldType}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-[#dbeafe] px-2.5 py-1 text-xs font-semibold text-[#1e40af]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Đang hoạt động</span>
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs sm:text-sm text-[#575e70]">
            <MapPin className="h-4 w-4 text-[#006e2f]" />
            <span>{fieldData.address}</span>
          </p>
        </div>
      </div>

      {/* Price Rules Table */}
      <div className="overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-sm">
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
              {fieldData.priceRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#575e70]">
                    Chưa có mức giá nào được thiết lập. Hãy bấm &ldquo;+ Thêm
                    mức giá mới&rdquo;.
                  </td>
                </tr>
              ) : (
                fieldData.priceRules.map((rule) => (
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
                      {formatVND(rule.pricePerHour)}
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
                          onClick={() => handleOpenEditModal(rule)}
                          className="rounded-lg p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
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

      {/* Modal: Thêm / Sửa mức giá */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-[#bccbb9] bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#bccbb9]/60 px-6 py-4">
              <h3 className="font-(family-name:--font-manrope) text-lg sm:text-xl font-bold text-[#191c1d]">
                {editingRule ? 'Chỉnh sửa mức giá' : 'Thêm mức giá mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleSaveRule}
              className="p-6 space-y-5 text-xs sm:text-sm"
            >
              {/* Tên mức giá */}
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
                  className="w-full rounded-xl border border-[#bccbb9] bg-white px-4 py-2.5 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              {/* Ngày áp dụng */}
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

              {/* Giờ bắt đầu & kết thúc */}
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
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
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
                      className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                    />
                  </div>
                </div>
              </div>

              {/* Giá theo giờ (VND) */}
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
                    className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-4 pr-12 text-xs sm:text-sm font-bold text-[#006e2f] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#575e70]">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Trạng thái áp dụng */}
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
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-[#d9dadb] transition-all peer peer-checked:bg-[#006e2f] peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all" />
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#bccbb9]/60 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#006e2f] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#004b1e]"
                >
                  Lưu mức giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
