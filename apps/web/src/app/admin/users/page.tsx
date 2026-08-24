'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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

// Initial mock data based on design mockup and PostgreSQL schema
const INITIAL_USERS: AdminUserItem[] = [
  {
    id: 'u-1',
    authUserId: 'auth-1',
    fullName: 'Nguyễn Văn An',
    email: 'nguyenvanan@email.com',
    phone: '0901 234 567',
    role: 'USER',
    roleLabel: 'Khách hàng',
    status: 'ACTIVE',
    avatarUrl:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    createdAt: '2023-10-10',
    totalBookings: 12,
  },
  {
    id: 'u-2',
    authUserId: 'auth-2',
    fullName: 'Trần Thị Bình',
    email: 'binh.tran@email.com',
    phone: '0912 345 678',
    role: 'USER',
    roleLabel: 'Khách hàng',
    status: 'INACTIVE',
    createdAt: '2023-10-12',
    totalBookings: 5,
  },
  {
    id: 'u-3',
    authUserId: 'auth-3',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le.sport@email.com',
    phone: '0987 654 321',
    role: 'MANAGER',
    roleLabel: 'Chủ sân',
    status: 'PENDING',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    createdAt: '2023-10-15',
    totalBookings: 0,
  },
  {
    id: 'u-4',
    authUserId: 'auth-4',
    fullName: 'Phạm Thị Mai',
    email: 'mai.pham99@email.com',
    phone: '0934 567 890',
    role: 'USER',
    roleLabel: 'Khách hàng',
    status: 'ACTIVE',
    createdAt: '2023-10-16',
    totalBookings: 8,
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [viewingUser, setViewingUser] = useState<AdminUserItem | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'USER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
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

  // Toggle user status
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus: UserStatus =
            u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          showToast(
            nextStatus === 'ACTIVE'
              ? `Đã kích hoạt tài khoản cho ${u.fullName}!`
              : `Đã vô hiệu hóa tài khoản của ${u.fullName}.`,
          );
          return { ...u, status: nextStatus };
        }
        return u;
      }),
    );
  };

  // Approve pending user
  const handleApproveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          showToast(`Đã duyệt kích hoạt tài khoản cho ${u.fullName}!`);
          return { ...u, status: 'ACTIVE' };
        }
        return u;
      }),
    );
  };

  // Add User submit
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Vui lòng nhập họ tên và email.');
      return;
    }

    const roleMap: Record<UserRole, string> = {
      USER: 'Khách hàng',
      MANAGER: 'Chủ sân',
      ADMIN: 'Quản trị viên',
    };

    const newUser: AdminUserItem = {
      id: `u-${Date.now()}`,
      authUserId: `auth-${Date.now()}`,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || '0900 000 000',
      role: formData.role,
      roleLabel: roleMap[formData.role],
      status: formData.status,
      createdAt: new Date().toISOString().split('T')[0],
      totalBookings: 0,
    };

    setUsers((prev) => [newUser, ...prev]);
    showToast(`Đã thêm người dùng mới "${formData.fullName}" thành công!`);
    setIsAddUserModalOpen(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'USER',
      status: 'ACTIVE',
    });
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

      {/* Toolbar / Filters */}
      <div className="rounded-2xl border border-[#bccbb9] bg-white p-4 md:p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-4 justify-between items-start md:flex-row md:items-end">
          <div className="w-full flex-1 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div>
              <label
                htmlFor="search-user"
                className="mb-2 block text-xs sm:text-sm font-semibold text-[#575e70]"
              >
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                <input
                  id="search-user"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="w-full rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-9 pr-4 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="filter-status"
                className="mb-2 block text-xs sm:text-sm font-semibold text-[#575e70]"
              >
                Trạng thái tài khoản
              </label>
              <div className="relative">
                <select
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-4 pr-10 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="disabled">Vô hiệu hóa</option>
                  <option value="pending">Chờ kích hoạt</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
              </div>
            </div>

            {/* Role Filter */}
            <div className="hidden lg:block">
              <label
                htmlFor="filter-role"
                className="mb-2 block text-xs sm:text-sm font-semibold text-[#575e70]"
              >
                Vai trò
              </label>
              <div className="relative">
                <select
                  id="filter-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[#bccbb9] bg-white py-2.5 pl-4 pr-10 text-xs sm:text-sm text-[#191c1d] shadow-sm transition-all focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="customer">Khách hàng</option>
                  <option value="manager">Chủ sân</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
              </div>
            </div>
          </div>

          {/* Add User Button */}
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="flex w-full md:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#006e2f] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#004b1e] active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm người dùng</span>
          </button>
        </div>
      </div>

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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-[#575e70]"
                  >
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-[#f8f9fa]"
                  >
                    {/* Người dùng */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#bccbb9] shadow-sm">
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dce2f3] font-bold text-[#151c27] shadow-sm">
                            {getInitials(user.fullName)}
                          </div>
                        )}
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

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-6 py-4 sm:flex-row text-xs sm:text-sm text-[#575e70]">
          <div className="hidden sm:block">
            Hiển thị <span className="font-bold text-[#191c1d]">1</span> đến{' '}
            <span className="font-bold text-[#191c1d]">
              {filteredUsers.length}
            </span>{' '}
            trong số <span className="font-bold text-[#191c1d]">120</span> người
            dùng
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex h-9 items-center gap-1 rounded-lg border border-[#bccbb9] px-3 text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Trước</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shadow-sm ${
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
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${
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
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${
                  currentPage === 3
                    ? 'bg-[#006e2f] text-white'
                    : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
                }`}
              >
                3
              </button>
              <span className="flex h-9 w-9 items-center justify-center text-xs text-[#575e70]">
                ...
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(12)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold ${
                  currentPage === 12
                    ? 'bg-[#006e2f] text-white'
                    : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
                }`}
              >
                12
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="flex h-9 items-center gap-1 rounded-lg border border-[#bccbb9] px-3 text-xs font-semibold text-[#575e70] transition-colors hover:bg-[#e7e8e9]"
            >
              <span>Sau</span>
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
                {viewingUser.avatarUrl ? (
                  <img
                    src={viewingUser.avatarUrl}
                    alt={viewingUser.fullName}
                    className="h-16 w-16 rounded-full border border-[#bccbb9] object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#dce2f3] text-xl font-bold text-[#151c27]">
                    {getInitials(viewingUser.fullName)}
                  </div>
                )}
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

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#bccbb9]/60 pb-3">
              <div>
                <h4 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
                  Thêm người dùng mới
                </h4>
                <p className="text-xs text-[#575e70]">
                  Tạo hồ sơ người dùng trong hệ thống KickZone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="rounded-lg p-1.5 text-[#575e70] hover:bg-[#e7e8e9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddUserSubmit}
              className="my-4 space-y-3.5 text-xs sm:text-sm"
            >
              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Họ và tên <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#191c1d]">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="0901 234 567"
                  className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none focus:ring-1 focus:ring-[#006e2f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                  >
                    <option value="USER">Khách hàng</option>
                    <option value="MANAGER">Chủ sân</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[#191c1d]">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as UserStatus,
                      })
                    }
                    className="w-full rounded-lg border border-[#bccbb9] p-2.5 text-xs sm:text-sm text-[#191c1d] focus:border-[#006e2f] focus:outline-none"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Vô hiệu hóa</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="rounded-xl border border-[#bccbb9] px-4 py-2 text-xs font-semibold text-[#575e70] hover:bg-[#e7e8e9]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#006e2f] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#004b1e]"
                >
                  <Check className="h-4 w-4" />
                  <span>Lưu người dùng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
