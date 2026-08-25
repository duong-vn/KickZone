/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminFields,
  updateAdminFieldStatus,
  updateAdminField,
  deleteAdminField,
} from '@/lib/api';
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

export default function AdminFieldsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: apiResponse } = useQuery({
    queryKey: [
      'admin-fields',
      searchQuery,
      typeFilter,
      statusFilter,
      currentPage,
    ],
    queryFn: () =>
      fetchAdminFields({
        search: searchQuery || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        page: currentPage,
      }),
    retry: false,
  });

  const [localFields, setLocalFields] = useState<AdminFieldItem[] | null>(null);
  const fields: AdminFieldItem[] = localFields || apiResponse?.data || [];

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
        if (typeFilter === '11' && field.fieldType !== '11-a-side')
          return false;
      }

      // Status filter
      if (statusFilter) {
        if (statusFilter === 'active' && field.status !== 'ACTIVE')
          return false;
        if (statusFilter === 'disabled' && field.status !== 'INACTIVE')
          return false;
      }

      return true;
    });
  }, [fields, searchQuery, typeFilter, statusFilter]);

  const [pageSize, setPageSize] = useState(10);
  const totalRecords = apiResponse?.meta?.total ?? filteredFields.length ?? 0;
  const totalPages =
    apiResponse?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [
        1,
        '...',
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
  };

  // Filtered and paginated fields
  const displayFields = useMemo(() => {
    if (filteredFields.length > pageSize) {
      return filteredFields.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      );
    }
    return filteredFields;
  }, [filteredFields, currentPage, pageSize]);

  // Toggle field status (Hoạt động <-> Vô hiệu hóa)
  const handleToggleStatus = async (fieldId: string) => {
    const target = fields.find((f) => f.id === fieldId);
    if (!target) return;
    const nextStatus: FieldStatus =
      target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setLocalFields((prev) =>
      (prev || apiResponse?.data || []).map((f: AdminFieldItem) => {
        if (f.id === fieldId) {
          return { ...f, status: nextStatus };
        }
        return f;
      }),
    );

    try {
      await updateAdminFieldStatus(fieldId, nextStatus);
      queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      showToast(
        nextStatus === 'ACTIVE'
          ? `Đã kích hoạt hoạt động cho ${target.name}!`
          : `Đã chuyển ${target.name} sang trạng thái Vô hiệu hóa.`,
      );
    } catch (err) {
      showToast(`Lỗi cập nhật trạng thái: ${(err as Error).message}`);
    }
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
  const handleSaveField = async (e: React.FormEvent) => {
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
      setLocalFields((prev) =>
        (prev || apiResponse?.data || []).map((f: AdminFieldItem) =>
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
            : f,
        ),
      );

      try {
        await updateAdminField(editingField.id, {
          name: formData.name,
          address: formData.address,
          district: formData.district,
          city: formData.city,
          basePricePerHour: formData.basePricePerHour,
          description: formData.description,
          status: formData.status,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
        showToast(`Đã cập nhật thông tin ${formData.name} thành công!`);
      } catch (err) {
        showToast(`Lỗi lưu thông tin: ${(err as Error).message}`);
      }
    } else {
      // Create new (optimistic)
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
      setLocalFields((prev) => [
        newField,
        ...(prev || apiResponse?.data || []),
      ]);
      showToast(`Đã thêm sân mới "${formData.name}" thành công!`);
    }

    setIsCreateModalOpen(false);
  };

  const handleDeleteField = async (fieldId: string, fieldName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sân "${fieldName}"?`)) return;
    try {
      await deleteAdminField(fieldId);
      queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      setLocalFields((prev) =>
        (prev || apiResponse?.data || []).filter(
          (f: AdminFieldItem) => f.id !== fieldId,
        ),
      );
      showToast(`Đã xóa sân "${fieldName}" thành công.`);
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
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="min-w-[140px] appearance-none rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-3 pr-8 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
            >
              <option value="">Loại sân</option>
              <option value="5">Sân 5 người</option>
              <option value="7">Sân 7 người</option>
              <option value="11">Sân 11 người</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[140px] appearance-none rounded-lg border border-[#bccbb9] bg-[#f8f9fa] py-2 pl-3 pr-8 text-xs sm:text-sm text-[#191c1d] transition-all focus:border-[#006e2f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
            >
              <option value="">Trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="disabled">Vô hiệu hóa</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          </div>
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
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
              {displayFields.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    Không tìm thấy sân bóng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayFields.map((field) => (
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
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#006e2f]/20 bg-[#22c55e]/20 px-2.5 py-1 text-xs font-semibold text-[#004b1e]">
                          <span className="h-2 w-2 rounded-full bg-[#006e2f]" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bccbb9] bg-[#e1e3e4] px-2.5 py-1 text-xs font-semibold text-[#575e70]">
                          <span className="h-2 w-2 rounded-full bg-[#575e70]" />
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>

                    {/* Hành động: Chỉ hiển thị icon con mắt */}
                    <td className="p-4 text-center">
                      <Link
                        href={`/admin/fields/${field.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                        title="Xem chi tiết sân"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-4 py-3.5 sm:flex-row sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#575e70]">
            <span>
              {totalRecords === 0
                ? 'Không có sân nào'
                : `Hiển thị ${startRecord} - ${endRecord} của ${totalRecords} sân`}
            </span>
            <div className="flex items-center gap-1.5 border-l border-[#bccbb9]/60 pl-3">
              <span className="text-xs text-[#575e70]">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-[#bccbb9] bg-[#f8f9fa] px-2 py-1 text-xs font-semibold text-[#191c1d] transition-colors focus:border-[#006e2f] focus:outline-none"
              >
                <option value={5}>5 sân / trang</option>
                <option value={10}>10 sân / trang</option>
                <option value={20}>20 sân / trang</option>
                <option value={50}>50 sân / trang</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-40 disabled:pointer-events-none"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((pageNum, idx) =>
              pageNum === '...' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-[#575e70]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => setCurrentPage(Number(pageNum))}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-40 disabled:pointer-events-none"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
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
                <span className="text-xs font-semibold text-[#575e70]">
                  Thông tin sân bóng
                </span>
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
                  {editingField
                    ? `Chỉnh sửa: ${editingField.name}`
                    : 'Thêm sân bóng mới'}
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

            <form
              onSubmit={handleSaveField}
              className="my-4 space-y-3.5 text-xs sm:text-sm"
            >
              <div className="space-y-1">
                <label className="font-semibold text-[#191c1d]">
                  Tên sân bóng *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ví dụ: Sân Chảo Lửa 3"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">
                    Loại sân
                  </label>
                  <select
                    value={formData.fieldType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fieldType: e.target.value as
                          '5-a-side' | '7-a-side' | '11-a-side',
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
                  <label className="font-semibold text-[#191c1d]">
                    Giá thuê / giờ (VND) *
                  </label>
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
                <label className="font-semibold text-[#191c1d]">
                  Địa chỉ chi tiết *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ví dụ: 30 Phan Thúc Duyện"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#191c1d]">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#191c1d]">
                  Mô tả sân
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
