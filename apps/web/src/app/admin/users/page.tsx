/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchAdminUsers, updateAdminUserStatus } from '@/lib/api';
import {
  AdminFilterBar,
  adminFilterControlClass,
} from '@/components/admin/admin-filter-bar';
import {
  Search,
  UserPlus,
  Eye,
  Ban,
  CheckCircle2,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

// Types aligned with database/init.sql
export type UserRole = 'USER' | 'ADMIN' | 'MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface AdminUserItem {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  roleLabel: string; // 'Khách hàng' | 'Chủ sân' | 'Quản trị viên'
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string; // YYYY-MM-DD
  totalBookings?: number;
}

function getInitials(name: string) {
  if (!name) return 'U';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

function UserAvatar({
  avatarUrl,
  name,
  size = 'md',
}: {
  avatarUrl?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-xs',
    lg: 'h-16 w-16 text-xl',
  }[size];

  if (avatarUrl && !hasError) {
    return (
      <div
        className={`${sizeClasses} shrink-0 overflow-hidden rounded-full border border-[#bccbb9] shadow-sm`}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-[#dce2f3] font-bold text-[#151c27] shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: apiResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      'admin-users',
      searchQuery,
      statusFilter,
      roleFilter,
      currentPage,
    ],
    queryFn: () =>
      fetchAdminUsers({
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all'
            ? statusFilter === 'active'
              ? 'ACTIVE'
              : 'INACTIVE'
            : undefined,
        role:
          roleFilter !== 'all'
            ? roleFilter === 'customer'
              ? 'USER'
              : 'ADMIN'
            : undefined,
        page: currentPage,
      }),
    retry: false,
  });

  const [localUsers, setLocalUsers] = useState<AdminUserItem[] | null>(null);
  const users: AdminUserItem[] = useMemo(
    () => localUsers || apiResponse?.data || [],
    [localUsers, apiResponse?.data],
  );

  // Modal states
  const [viewingUser, setViewingUser] = useState<AdminUserItem | null>(null);

  const showToast = (msg: string) => {
    if (/^(Lỗi|Không thể|Có lỗi)/.test(msg)) toast.error(msg);
    else if (/^(Vui lòng|Cảnh báo)/.test(msg)) toast.warning(msg);
    else toast.success(msg);
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.fullName.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesPhone = user.phone.includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && user.status !== 'ACTIVE') return false;
        if (statusFilter === 'disabled' && user.status !== 'INACTIVE')
          return false;
        if (statusFilter === 'pending' && user.status !== 'PENDING')
          return false;
      }

      // Role
      if (roleFilter !== 'all') {
        if (roleFilter === 'customer' && user.role !== 'USER') return false;
        if (
          roleFilter === 'manager' &&
          user.role !== 'MANAGER' &&
          user.role !== 'ADMIN'
        )
          return false;
      }

      return true;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);

  const [pageSize, setPageSize] = useState(10);
  const totalRecords = apiResponse?.meta?.total ?? filteredUsers.length ?? 0;
  const totalPages =
    apiResponse?.meta?.totalPages ??
    Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  const userSummary = useMemo(
    () => ({
      active: users.filter((item) => item.status === 'ACTIVE').length,
      inactive: users.filter((item) => item.status === 'INACTIVE').length,
      admins: users.filter(
        (item) => item.role === 'ADMIN' || item.role === 'MANAGER',
      ).length,
    }),
    [users],
  );

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

  // Filtered and paginated users
  const displayUsers = useMemo(() => {
    if (filteredUsers.length > pageSize) {
      return filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      );
    }
    return filteredUsers;
  }, [filteredUsers, currentPage, pageSize]);

  // Toggle user status
  const handleToggleStatus = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus: UserStatus =
      target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setLocalUsers((prev) =>
      (prev || apiResponse?.data || []).map((u: AdminUserItem) => {
        if (u.id === userId) {
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    );

    try {
      await updateAdminUserStatus(
        userId,
        nextStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      );
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast(
        nextStatus === 'ACTIVE'
          ? `Đã kích hoạt tài khoản cho ${target.fullName}!`
          : `Đã vô hiệu hóa tài khoản của ${target.fullName}.`,
      );
    } catch (err) {
      showToast(`Lỗi cập nhật trạng thái: ${(err as Error).message}`);
    }
  };

  // Approve pending user
  const handleApproveUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    setLocalUsers((prev) =>
      (prev || apiResponse?.data || []).map((u: AdminUserItem) => {
        if (u.id === userId) {
          return { ...u, status: 'ACTIVE' };
        }
        return u;
      }),
    );

    try {
      await updateAdminUserStatus(userId, 'ACTIVE');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast(`Đã duyệt kích hoạt tài khoản cho ${target.fullName}!`);
    } catch (err) {
      showToast(`Lỗi cập nhật: ${(err as Error).message}`);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#166534]" />
            Hoạt động
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bccbb9] bg-[#f3f4f5] px-2.5 py-1 text-xs font-semibold text-[#575e70]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#575e70]" />
            Vô hiệu hóa
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fef08a] bg-[#fef9c3] px-2.5 py-1 text-xs font-semibold text-[#854d0e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#854d0e]" />
            Chờ kích hoạt
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#006e2f]">Tài khoản</p>
          <h1 className="font-(family-name:--font-manrope) text-2xl font-extrabold tracking-tight text-[#191c1d]">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-[#575e70]">
            Theo dõi vai trò và trạng thái tài khoản trong hệ thống.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#006e2f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#004b1e]"
        >
          <UserPlus className="h-4 w-4" /> Thêm người dùng
        </Link>
      </section>

      <section
        aria-label="Tổng quan người dùng"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: 'Tổng người dùng',
            value: totalRecords,
            icon: UserPlus,
            tone: 'bg-[#dce2f3] text-[#585f6c]',
          },
          {
            label: 'Hoạt động trên trang',
            value: userSummary.active,
            icon: CheckCircle2,
            tone: 'bg-[#dcfce7] text-[#006e2f]',
          },
          {
            label: 'Vô hiệu hóa trên trang',
            value: userSummary.inactive,
            icon: Ban,
            tone: 'bg-[#ffdad6] text-[#ba1a1a]',
          },
          {
            label: 'Quản trị trên trang',
            value: userSummary.admins,
            icon: ShieldCheck,
            tone: 'bg-[#fff1d6] text-[#8a4f00]',
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-[#bccbb9] bg-white p-4 shadow-[0_2px_5px_rgba(0,0,0,0.04)]"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#575e70]">{label}</p>
              <p className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#191c1d]">
                {value}
              </p>
            </div>
          </div>
        ))}
      </section>

      <AdminFilterBar className="md:grid-cols-[minmax(240px,1fr)_190px_190px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
          <input
            id="search-user"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className={`${adminFilterControlClass} pl-9`}
            aria-label="Tìm kiếm người dùng"
          />
        </div>

        <div className="relative">
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${adminFilterControlClass} appearance-none pr-10`}
            aria-label="Lọc trạng thái tài khoản"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="disabled">Vô hiệu hóa</option>
            <option value="pending">Chờ kích hoạt</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
        </div>

        <div className="relative">
          <select
            id="filter-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`${adminFilterControlClass} appearance-none pr-10`}
            aria-label="Lọc vai trò người dùng"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="customer">Khách hàng</option>
            <option value="manager">Chủ sân</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
        </div>
      </AdminFilterBar>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold text-[#575e70]">
                <th className="px-6 py-4 whitespace-nowrap w-1/4">
                  Người dùng
                </th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Số điện thoại</th>
                <th className="px-6 py-4 whitespace-nowrap">Ngày đăng ký</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs sm:text-sm text-[#191c1d]">
              {displayUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-[#f8f9fa]"
                  >
                    {/* Người dùng */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          name={user.fullName}
                          size="md"
                        />
                        <div>
                          <p className="font-bold text-[#191c1d]">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-[#575e70]">
                            {user.roleLabel}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-[#575e70] whitespace-nowrap">
                      {user.email}
                    </td>

                    {/* Số điện thoại */}
                    <td className="px-6 py-4 text-[#575e70] whitespace-nowrap">
                      {user.phone}
                    </td>

                    {/* Ngày đăng ký */}
                    <td className="px-6 py-4 text-[#575e70] whitespace-nowrap">
                      {formatDateVN(user.createdAt)}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(user.status)}
                    </td>

                    {/* Hành động */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                        {/* Xem chi tiết */}
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#575e70] transition-colors hover:bg-[#e7e8e9] hover:text-[#006e2f]"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Duyệt pending */}
                        {user.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleApproveUser(user.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#006e2f] transition-colors hover:bg-[#22c55e]/20"
                            title="Duyệt kích hoạt"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Toggle active / block */}
                        {user.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#575e70] transition-colors hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
                            title="Vô hiệu hóa tài khoản"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}

                        {user.status === 'INACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#006e2f] transition-colors hover:bg-[#22c55e]/20"
                            title="Kích hoạt lại tài khoản"
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

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-4 py-3.5 sm:flex-row sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#575e70]">
            <span>
              {totalRecords === 0
                ? 'Không có người dùng nào'
                : `Hiển thị ${startRecord} - ${endRecord} của ${totalRecords} người`}
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
                <option value={5}>5 người / trang</option>
                <option value={10}>10 người / trang</option>
                <option value={20}>20 người / trang</option>
                <option value={50}>50 người / trang</option>
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

      {/* User Detail Modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <span className="text-xs font-semibold text-[#575e70]">
                  Hồ sơ người dùng
                </span>
                <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                  {viewingUser.fullName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs sm:text-sm">
              <div className="flex items-center gap-4 rounded-xl bg-[#f8f9fa] p-4 border border-[#bccbb9]/40">
                <UserAvatar
                  avatarUrl={viewingUser.avatarUrl}
                  name={viewingUser.fullName}
                  size="lg"
                />
                <div>
                  <p className="font-bold text-[#191c1d] text-base">
                    {viewingUser.fullName}
                  </p>
                  <p className="text-xs text-[#575e70]">
                    {viewingUser.roleLabel}
                  </p>
                  <div className="mt-1">
                    {renderStatusBadge(viewingUser.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Email:</span>
                  <span className="font-medium text-[#191c1d]">
                    {viewingUser.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Số điện thoại:</span>
                  <span className="font-medium text-[#191c1d]">
                    {viewingUser.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Ngày tham gia:</span>
                  <span className="font-medium text-[#191c1d]">
                    {formatDateVN(viewingUser.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#575e70]">Tổng số lượt đặt sân:</span>
                  <span className="font-bold text-[#006e2f]">
                    {viewingUser.totalBookings ?? 0} lượt
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
