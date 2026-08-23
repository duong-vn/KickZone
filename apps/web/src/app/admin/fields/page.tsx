'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Star,
  Eye,
  Edit3,
  Calendar,
  Ban,
  CheckCircle2,
  X,
  DollarSign,
  Check,
} from 'lucide-react';

// Types aligned directly with database/init.sql
export type FieldStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminFieldItem {
  id: string;
  name: string;
  slug: string;
  fieldTypeId: string;
  fieldType: '5-a-side' | '7-a-side' | '11-a-side';
  fieldTypeLabel: string;
  address: string;
  district: string;
  city: string;
  basePricePerHour: number;
  rating: number;
  reviewCount: number;
  status: FieldStatus;
  imageUrl: string;
  description?: string;
  createdAt: string;
}

// Initial mock data based on design mockup and PostgreSQL schema
const INITIAL_FIELDS: AdminFieldItem[] = [
  {
    id: 'f-1',
    name: 'Sân Chảo Lửa 1',
    slug: 'san-chao-lua-1',
    fieldTypeId: 'ft-5',
    fieldType: '5-a-side',
    fieldTypeLabel: 'Sân 5 người',
    address: '30 Phan Thúc Duyện, Tân Bình',
    district: 'Tân Bình',
    city: 'Hồ Chí Minh',
    basePricePerHour: 250000,
    rating: 4.8,
    reviewCount: 36,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description:
      'Sân cỏ nhân tạo chất lượng cao chuẩn FIFA, hệ thống chiếu sáng LED hiện đại, có khán đài và căng tin phục vụ giải khát.',
    createdAt: '2023-08-15',
  },
  {
    id: 'f-2',
    name: 'Sân K34 - Số 2',
    slug: 'san-k34-so-2',
    fieldTypeId: 'ft-7',
    fieldType: '7-a-side',
    fieldTypeLabel: 'Sân 7 người',
    address: 'K34 Nguyễn Thái Sơn, Gò Vấp',
    district: 'Gò Vấp',
    city: 'Hồ Chí Minh',
    basePricePerHour: 400000,
    rating: 4.5,
    reviewCount: 28,
    status: 'ACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description:
      'Sân 7 người thoáng mát, thoát nước tốt ngay cả khi mưa lớn, bãi đỗ xe ô tô và xe máy rộng rãi.',
    createdAt: '2023-09-01',
  },
  {
    id: 'f-3',
    name: 'Sân Tao Đàn',
    slug: 'san-tao-dan',
    fieldTypeId: 'ft-11',
    fieldType: '11-a-side',
    fieldTypeLabel: 'Sân 11 người',
    address: '1 Huyền Trân Công Chúa, Q1',
    district: 'Quận 1',
    city: 'Hồ Chí Minh',
    basePricePerHour: 1200000,
    rating: 4.0,
    reviewCount: 14,
    status: 'INACTIVE',
    imageUrl:
      'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description:
      'Sân cỏ tự nhiên kích thước tiêu chuẩn 11 người trung tâm Quận 1, hiện đang tạm ngưng để bảo dưỡng phục hồi mặt cỏ.',
    createdAt: '2023-07-20',
  },
];

export default function AdminFieldsPage() {
  const [fields, setFields] = useState<AdminFieldItem[]>(INITIAL_FIELDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [viewingField, setViewingField] = useState<AdminFieldItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<AdminFieldItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    fieldType: '5-a-side' as '5-a-side' | '7-a-side' | '11-a-side',
    address: '',
    district: 'Tân Bình',
    city: 'Hồ Chí Minh',
    basePricePerHour: 300000,
    description: '',
    status: 'ACTIVE' as FieldStatus,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ/h';
  };

  // Filtered fields
  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      // Keyword search (Name or Address)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = field.name.toLowerCase().includes(q);
        const matchesAddress = field.address.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress) return false;
      }

      // Field Type filter
      if (typeFilter) {
        if (typeFilter === '5' && field.fieldType !== '5-a-side') return false;
        if (typeFilter === '7' && field.fieldType !== '7-a-side') return false;
        if (typeFilter === '11' && field.fieldType !== '11-a-side') return false;
      }

      // Status filter
      if (statusFilter) {
        if (statusFilter === 'active' && field.status !== 'ACTIVE') return false;
        if (statusFilter === 'disabled' && field.status !== 'INACTIVE') return false;
      }

      return true;
    });
  }, [fields, searchQuery, typeFilter, statusFilter]);

  // Toggle field status (Hoạt động <-> Vô hiệu hóa)
  const handleToggleStatus = (fieldId: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id === fieldId) {
          const nextStatus: FieldStatus = f.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          showToast(
            nextStatus === 'ACTIVE'
              ? `Đã kích hoạt hoạt động cho ${f.name}!`
              : `Đã chuyển ${f.name} sang trạng thái Vô hiệu hóa.`
          );
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  // Open Edit Modal
  const handleOpenEditModal = (field: AdminFieldItem) => {
    setFormData({
      name: field.name,
      fieldType: field.fieldType,
      address: field.address,
      district: field.district,
      city: field.city,
      basePricePerHour: field.basePricePerHour,
      description: field.description || '',
      status: field.status,
    });
    setEditingField(field);
    setIsCreateModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Vui lòng điền đầy đủ tên sân và địa chỉ.');
      return;
    }

    const typeLabels: Record<string, string> = {
      '5-a-side': 'Sân 5 người',
      '7-a-side': 'Sân 7 người',
      '11-a-side': 'Sân 11 người',
    };

    if (editingField) {
      // Update existing
      setFields((prev) =>
        prev.map((f) =>
          f.id === editingField.id
            ? {
                ...f,
                name: formData.name,
                fieldType: formData.fieldType,
                fieldTypeLabel: typeLabels[formData.fieldType],
                address: formData.address,
                district: formData.district,
                city: formData.city,
                basePricePerHour: formData.basePricePerHour,
                description: formData.description,
                status: formData.status,
              }
            : f
        )
      );
      showToast(`Đã cập nhật thông tin ${formData.name} thành công!`);
    } else {
      // Create new
      const newField: AdminFieldItem = {
        id: `f-${Date.now()}`,
        name: formData.name,
        slug: formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        fieldTypeId: `ft-${formData.fieldType}`,
        fieldType: formData.fieldType,
        fieldTypeLabel: typeLabels[formData.fieldType],
        address: formData.address,
        district: formData.district,
        city: formData.city,
        basePricePerHour: formData.basePricePerHour,
        rating: 5.0,
        reviewCount: 0,
        status: formData.status,
        imageUrl:
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        description: formData.description,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setFields((prev) => [newField, ...prev]);
      showToast(`Đã thêm sân mới "${formData.name}" thành công!`);
    }

    setIsCreateModalOpen(false);
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

      {/* Page Header & Actions */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-(family-name:--font-manrope) text-2xl sm:text-3xl font-extrabold tracking-tight text-[#191c1d]">
            Danh sách Sân bóng
          </h2>
          <p className="mt-1 text-sm text-[#575e70]">
            Quản lý thông tin, trạng thái và giá cả của các sân bóng.
          </p>
        </div>

        <Link
          href="/admin/fields/new"
          className="flex items-center gap-2 rounded-lg bg-[#006e2f] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm sân mới</span>
        </Link>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#bccbb9] bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên sân hoặc địa chỉ..."
            className="w-full rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-[140px] appearance-none rounded-lg border border-[#bccbb9] bg-[#f8f9fa] px-3 py-2 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
          >
            <option value="">Loại sân</option>
            <option value="5">Sân 5 người</option>
            <option value="7">Sân 7 người</option>
            <option value="11">Sân 11 người</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[140px] appearance-none rounded-lg border border-[#bccbb9] bg-[#f8f9fa] px-3 py-2 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
          >
            <option value="">Trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="disabled">Vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-[#bccbb9] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold text-[#575e70]">
                <th className="w-16 p-4">Ảnh</th>
                <th className="p-4">Tên sân</th>
                <th className="p-4">Loại sân</th>
                <th className="p-4">Địa chỉ</th>
                <th className="p-4">Giá cơ bản</th>
                <th className="p-4">Đánh giá</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
              {filteredFields.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-[#575e70]">
                    Không tìm thấy sân bóng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => (
                  <tr
                    key={field.id}
                    className={`group transition-colors hover:bg-[#f8f9fa] ${
                      field.status === 'INACTIVE' ? 'opacity-75' : ''
                    }`}
                  >
                    {/* Ảnh */}
                    <td className="p-4">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#bccbb9]">
                        <img
                          src={field.imageUrl}
                          alt={field.name}
                          className={`h-full w-full object-cover ${
                            field.status === 'INACTIVE' ? 'grayscale' : ''
                          }`}
                        />
                      </div>
                    </td>

                    {/* Tên sân */}
                    <td className="p-4 font-bold text-[#191c1d]">
                      {field.name}
                    </td>

                    {/* Loại sân */}
                    <td className="p-4 text-[#575e70]">
                      {field.fieldTypeLabel}
                    </td>

                    {/* Địa chỉ */}
                    <td
                      className="max-w-[200px] truncate p-4 text-[#575e70]"
                      title={field.address}
                    >
                      {field.address}
                    </td>

                    {/* Giá cơ bản */}
                    <td className="p-4 font-bold text-[#191c1d]">
                      {formatVND(field.basePricePerHour)}
                    </td>

                    {/* Đánh giá */}
                    <td className="p-4">
                      <div
                        className={`flex items-center gap-1 font-bold ${
                          field.status === 'ACTIVE'
                            ? 'text-[#006e2f]'
                            : 'text-[#575e70]'
                        }`}
                      >
                        <Star className="h-4 w-4 fill-current text-amber-500" />
                        <span>{field.rating}</span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="p-4">
                      {field.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center rounded-full bg-[#22c55e] px-2.5 py-0.5 text-xs font-semibold text-white">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-2.5 py-0.5 text-xs font-semibold text-[#575e70]">
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>

                    {/* Hành động */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                        {/* Xem */}
                        <Link
                          href={`/admin/fields/${field.id}`}
                          className="rounded p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Xem chi tiết sân"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Sửa */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(field)}
                          className="rounded p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Sửa thông tin"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        {/* Quản lý giá */}
                        <Link
                          href={`/admin/fields/${field.id}/pricing`}
                          className="rounded p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Quản lý bảng giá"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Link>

                        {/* Lịch */}
                        <Link
                          href={`/admin/schedule?fieldId=${field.id}`}
                          className="rounded p-1.5 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Xem lịch sân"
                        >
                          <Calendar className="h-4 w-4" />
                        </Link>

                        {/* Toggle Status (Block / Re-activate) */}
                        {field.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(field.id)}
                            className="rounded p-1.5 text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]"
                            title="Vô hiệu hóa sân"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(field.id)}
                            className="rounded p-1.5 text-[#006e2f] transition-colors hover:bg-[#22c55e]/20"
                            title="Kích hoạt lại sân"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-6 py-4 sm:flex-row text-xs sm:text-sm text-[#575e70]">
          <span>Hiển thị 1 - {filteredFields.length} của 24 sân bóng</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="rounded border border-[#bccbb9] px-3 py-1 text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`rounded px-3 py-1 text-xs font-bold ${
                currentPage === 1
                  ? 'bg-[#006e2f] text-white'
                  : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                currentPage === 2
                  ? 'bg-[#006e2f] text-white'
                  : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                currentPage === 3
                  ? 'bg-[#006e2f] text-white'
                  : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
              }`}
            >
              3
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="rounded border border-[#bccbb9] px-3 py-1 text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Field Detail Modal */}
      {viewingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">Thông tin sân bóng</span>
                <h4 className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#006e2f]">
                  {viewingField.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingField(null)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs sm:text-sm">
              <div className="h-44 w-full overflow-hidden rounded-xl border border-[#bccbb9]">
                <img
                  src={viewingField.imageUrl}
                  alt={viewingField.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Loại sân:</span>
                  <span className="font-semibold text-[#191c1d]">
                    {viewingField.fieldTypeLabel} ({viewingField.fieldType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Địa chỉ:</span>
                  <span className="font-medium text-[#191c1d]">
                    {viewingField.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Khu vực:</span>
                  <span className="font-medium text-[#191c1d]">
                    {viewingField.district}, {viewingField.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Giá thuê cơ bản:</span>
                  <span className="font-bold text-[#006e2f]">
                    {formatVND(viewingField.basePricePerHour)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Đánh giá:</span>
                  <div className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="h-4 w-4 fill-current text-amber-500" />
                    <span>{viewingField.rating}</span>
                    <span className="text-xs text-[#575e70]">
                      ({viewingField.reviewCount} lượt)
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Trạng thái:</span>
                  <div>
                    {viewingField.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center rounded-full bg-[#22c55e] px-2.5 py-0.5 text-xs font-semibold text-white">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-2.5 py-0.5 text-xs font-semibold text-[#575e70]">
                        Vô hiệu hóa
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {viewingField.description && (
                <div className="rounded-xl border border-[#bccbb9]/60 bg-[#f8f9fa] p-3 text-xs text-[#575e70]">
                  <p className="font-bold text-[#191c1d] mb-1">Mô tả sân:</p>
                  <p>{viewingField.description}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingField(null)}
                className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingField;
                  setViewingField(null);
                  handleOpenEditModal(target);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-4 py-2 text-xs font-bold text-white hover:bg-[#004b1e]"
              >
                <Edit3 className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Field Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                  {editingField ? `Chỉnh sửa: ${editingField.name}` : 'Thêm sân bóng mới'}
                </h4>
                <p className="text-xs text-[#575e70]">
                  Khớp dữ liệu với bảng fields trong cơ sở dữ liệu KickZone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="my-4 space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-semibold text-[#191c1d]">Tên sân bóng *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Sân Chảo Lửa 3"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">Loại sân</label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fieldType: e.target.value as '5-a-side' | '7-a-side' | '11-a-side',
                      })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  >
                    <option value="5-a-side">Sân 5 người</option>
                    <option value="7-a-side">Sân 7 người</option>
                    <option value="11-a-side">Sân 11 người</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">Giá thuê / giờ (VND) *</label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    required
                    value={formData.basePricePerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePricePerHour: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#191c1d]">Địa chỉ chi tiết *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ví dụ: 30 Phan Thúc Duyện"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">Quận / Huyện</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#191c1d]">Mô tả sân</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Thông tin tiện ích, loại cỏ, đèn chiếu sáng..."
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingField ? 'Lưu thay đổi' : 'Tạo sân mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
