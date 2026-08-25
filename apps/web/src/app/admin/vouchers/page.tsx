'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Edit3,
  Loader2,
  Plus,
  Search,
  TicketPercent,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminFilterBar,
  adminFilterControlClass,
} from '@/components/admin/admin-filter-bar';
import { useDebounce } from '@/hooks/use-debounce';
import {
  AdminVoucherPayload,
  createAdminVoucher,
  deactivateAdminVoucher,
  fetchAdminVouchers,
  updateAdminVoucher,
  updateAdminVoucherStatus,
} from '@/lib/api';

type Voucher = Awaited<ReturnType<typeof fetchAdminVouchers>>['data'][number];
type VoucherForm = {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  value: string;
  maxDiscount: string;
  minOrderValue: string;
  startAt: string;
  endAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
};

const EMPTY_FORM: VoucherForm = {
  code: '',
  discountType: 'PERCENT',
  value: '',
  maxDiscount: '',
  minOrderValue: '',
  startAt: '',
  endAt: '',
  usageLimit: '',
  perUserLimit: '',
  isActive: true,
};

const inputClass =
  'h-10 w-full rounded-xl border border-[#bccbb9] bg-white px-3 text-sm text-[#191c1d] outline-none transition placeholder:text-[#8a9188] focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10';

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function optionalNumber(value: string) {
  return value.trim() === '' ? null : Number(value);
}

function formatVnd(value: number | null) {
  if (value === null) return 'Không giới hạn';
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatDate(value: string | null) {
  if (!value) return 'Không giới hạn';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function getVoucherState(voucher: Voucher) {
  const now = Date.now();
  if (!voucher.isActive)
    return {
      label: 'Tạm ngưng',
      className: 'border-[#d4d7d3] bg-[#f3f4f5] text-[#575e70]',
    };
  if (voucher.endAt && new Date(voucher.endAt).getTime() <= now)
    return {
      label: 'Hết hạn',
      className: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
    };
  if (voucher.startAt && new Date(voucher.startAt).getTime() > now)
    return {
      label: 'Sắp diễn ra',
      className: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    };
  return {
    label: 'Đang hoạt động',
    className: 'border-[#bbf7d0] bg-[#dcfce7] text-[#166534]',
  };
}

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<VoucherForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState<Voucher | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-vouchers', debouncedSearch, status, type, page, limit],
    queryFn: () =>
      fetchAdminVouchers({
        search: debouncedSearch || undefined,
        status,
        type,
        page,
        limit,
      }),
    retry: false,
  });

  const vouchers = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 0 };
  const summary = useMemo(() => {
    const active = vouchers.filter(
      (item) => getVoucherState(item).label === 'Đang hoạt động',
    ).length;
    const used = vouchers.reduce((sum, item) => sum + item.usageCount, 0);
    return { active, used };
  }, [vouchers]);

  const getPageNumbers = () => {
    const totalPages = Math.max(meta.totalPages, 1);
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    if (page <= 3) return [1, 2, 3, 4, '...', totalPages];
    if (page >= totalPages - 2) {
      return [
        1,
        '...',
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (voucher: Voucher) => {
    setEditing(voucher);
    setForm({
      code: voucher.code,
      discountType: voucher.discountType,
      value: String(voucher.value),
      maxDiscount:
        voucher.maxDiscount === null ? '' : String(voucher.maxDiscount),
      minOrderValue:
        voucher.minOrderValue === null ? '' : String(voucher.minOrderValue),
      startAt: toLocalInput(voucher.startAt),
      endAt: toLocalInput(voucher.endAt),
      usageLimit: voucher.usageLimit === null ? '' : String(voucher.usageLimit),
      perUserLimit:
        voucher.perUserLimit === null ? '' : String(voucher.perUserLimit),
      isActive: voucher.isActive,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(form.value);
    if (!form.code.trim()) return toast.error('Vui lòng nhập mã voucher.');
    if (!Number.isInteger(value) || value <= 0)
      return toast.error('Giá trị giảm phải là số nguyên dương.');
    if (form.discountType === 'PERCENT' && value > 100)
      return toast.error('Mức giảm phần trăm không được vượt quá 100%.');
    if (
      form.startAt &&
      form.endAt &&
      new Date(form.startAt) >= new Date(form.endAt)
    )
      return toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');

    const payload: AdminVoucherPayload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      value,
      maxDiscount:
        form.discountType === 'PERCENT'
          ? optionalNumber(form.maxDiscount)
          : null,
      minOrderValue: optionalNumber(form.minOrderValue),
      startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      usageLimit: optionalNumber(form.usageLimit),
      perUserLimit: optionalNumber(form.perUserLimit),
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) await updateAdminVoucher(editing.id, payload);
      else await createAdminVoucher(payload);
      await queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      toast.success(editing ? 'Đã cập nhật voucher.' : 'Đã tạo voucher mới.');
      setFormOpen(false);
    } catch (error) {
      toast.error((error as Error).message || 'Không thể lưu voucher.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (voucher: Voucher) => {
    setBusyId(voucher.id);
    try {
      await updateAdminVoucherStatus(voucher.id, !voucher.isActive);
      await queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      toast.success(
        voucher.isActive ? 'Đã tạm ngưng voucher.' : 'Đã kích hoạt voucher.',
      );
    } catch (error) {
      toast.error((error as Error).message || 'Không thể cập nhật trạng thái.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivating) return;
    setBusyId(deactivating.id);
    try {
      await deactivateAdminVoucher(deactivating.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] });
      toast.success(
        'Voucher đã được ngừng hoạt động và vẫn giữ lịch sử sử dụng.',
      );
      setDeactivating(null);
    } catch (error) {
      toast.error((error as Error).message || 'Không thể ngừng voucher.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 font-sans">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-[#006e2f]">
            Khuyến mãi
          </p>
          <h1 className="font-(family-name:--font-manrope) text-2xl font-extrabold tracking-tight text-[#191c1d]">
            Quản lý voucher
          </h1>
          <p className="mt-1 text-sm text-[#575e70]">
            Tạo và theo dõi các chương trình ưu đãi đặt sân.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#006e2f] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#004b1e]"
        >
          <Plus className="h-4 w-4" /> Thêm voucher
        </button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Voucher hiển thị', value: meta.total, icon: TicketPercent },
          { label: 'Đang hoạt động', value: summary.active, icon: ToggleRight },
          {
            label: 'Lượt dùng trên trang',
            value: summary.used,
            icon: CalendarRange,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-[#bccbb9] bg-white p-4 shadow-[0_2px_5px_rgba(0,0,0,0.04)]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dcfce7] text-[#006e2f]">
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo mã voucher..."
            className={`${adminFilterControlClass} pl-9`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className={`${adminFilterControlClass} appearance-none`}
          aria-label="Lọc trạng thái"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="scheduled">Sắp diễn ra</option>
          <option value="expired">Hết hạn</option>
          <option value="inactive">Tạm ngưng</option>
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className={`${adminFilterControlClass} appearance-none`}
          aria-label="Lọc loại giảm giá"
        >
          <option value="all">Tất cả loại giảm</option>
          <option value="PERCENT">Giảm phần trăm</option>
          <option value="FIXED">Giảm số tiền</option>
        </select>
      </AdminFilterBar>

      <section className="overflow-hidden rounded-2xl border border-[#bccbb9] bg-white shadow-[0_2px_5px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#bccbb9] bg-[#f3f4f5] text-xs font-semibold text-[#575e70]">
                <th className="px-5 py-3.5">Mã voucher</th>
                <th className="px-4 py-3.5">Mức giảm</th>
                <th className="px-4 py-3.5">Điều kiện</th>
                <th className="px-4 py-3.5">Thời gian áp dụng</th>
                <th className="px-4 py-3.5">Lượt dùng</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bccbb9]/50 text-xs text-[#191c1d] sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="h-52 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#006e2f]" />
                    <p className="mt-2 text-sm text-[#575e70]">
                      Đang tải voucher...
                    </p>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="h-52 text-center text-[#ba1a1a]">
                    Không thể tải danh sách voucher.
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-52 text-center">
                    <TicketPercent className="mx-auto h-9 w-9 text-[#8a9188]" />
                    <p className="mt-2 font-semibold">
                      Chưa có voucher phù hợp
                    </p>
                    <p className="mt-1 text-xs text-[#575e70]">
                      Thử thay đổi bộ lọc hoặc tạo voucher mới.
                    </p>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const state = getVoucherState(voucher);
                  return (
                    <tr
                      key={voucher.id}
                      className="transition hover:bg-[#f8f9fa]"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-[#dcfce7] px-2.5 py-1 font-bold tracking-wide text-[#006e2f]">
                          {voucher.code}
                        </span>
                        <p className="mt-1 text-xs text-[#8a9188]">
                          Tạo {formatDate(voucher.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {voucher.discountType === 'PERCENT'
                          ? `${voucher.value}%`
                          : formatVnd(voucher.value)}
                        {voucher.discountType === 'PERCENT' &&
                          voucher.maxDiscount !== null && (
                            <p className="mt-1 text-xs font-normal text-[#575e70]">
                              Tối đa {formatVnd(voucher.maxDiscount)}
                            </p>
                          )}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">
                          Đơn từ {formatVnd(voucher.minOrderValue ?? 0)}
                        </p>
                        <p className="mt-1 text-xs text-[#575e70]">
                          Mỗi người: {voucher.perUserLimit ?? '∞'} lượt
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs leading-5">
                        <p>{formatDate(voucher.startAt)}</p>
                        <p className="text-[#575e70]">
                          đến {formatDate(voucher.endAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {voucher.usageCount} / {voucher.usageLimit ?? '∞'}
                        </p>
                        {voucher.usageLimit && (
                          <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-[#e7e8e9]">
                            <div
                              className="h-full rounded-full bg-[#22c55e]"
                              style={{
                                width: `${Math.min(100, (voucher.usageCount / voucher.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${state.className}`}
                        >
                          {state.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(voucher)}
                            className="rounded-lg p-2 text-[#575e70] hover:bg-[#006e2f]/10 hover:text-[#006e2f]"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busyId === voucher.id}
                            onClick={() => void toggleStatus(voucher)}
                            className="rounded-lg p-2 text-[#575e70] hover:bg-[#006e2f]/10 hover:text-[#006e2f] disabled:opacity-50"
                            title={voucher.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                          >
                            {voucher.isActive ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeactivating(voucher)}
                            className="rounded-lg p-2 text-[#575e70] hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a]"
                            title="Ngừng voucher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#bccbb9] bg-white px-4 py-3.5 sm:flex-row sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#575e70] sm:text-sm">
            <span>
              {meta.total === 0
                ? 'Không có voucher'
                : `Hiển thị ${(page - 1) * limit + 1} - ${Math.min(page * limit, meta.total)} của ${meta.total} voucher`}
            </span>
            <div className="flex items-center gap-1.5 border-l border-[#bccbb9]/60 pl-3">
              <span className="text-xs text-[#575e70]">Hiển thị:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-[#bccbb9] bg-[#f8f9fa] px-2 py-1 text-xs font-semibold text-[#191c1d] transition-colors focus:border-[#006e2f] focus:outline-none"
              >
                <option value={5}>5 voucher / trang</option>
                <option value={10}>10 voucher / trang</option>
                <option value={20}>20 voucher / trang</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:pointer-events-none disabled:opacity-40"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((pageNumber, index) =>
              pageNumber === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-[#575e70]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(Number(pageNumber))}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    page === pageNumber
                      ? 'bg-[#006e2f] text-white shadow-sm'
                      : 'border border-[#bccbb9] text-[#575e70] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {pageNumber}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() =>
                setPage((value) => Math.min(meta.totalPages, value + 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bccbb9] text-[#575e70] transition-colors hover:bg-[#e7e8e9] disabled:pointer-events-none disabled:opacity-40"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#bccbb9] bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe3de] bg-white px-5 py-4">
              <div>
                <h2 className="font-(family-name:--font-manrope) text-xl font-extrabold text-[#191c1d]">
                  {editing ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}
                </h2>
                <p className="mt-0.5 text-xs text-[#575e70]">
                  Thiết lập mức giảm, điều kiện và thời gian áp dụng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 text-[#575e70] hover:bg-[#f3f4f5]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Mã voucher <b className="text-[#ba1a1a]">*</b>
                </span>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase().replace(/\s/g, ''),
                    })
                  }
                  placeholder="KICKZONE20"
                  className={inputClass}
                  maxLength={30}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Loại giảm giá
                </span>
                <select
                  value={form.discountType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target
                        .value as VoucherForm['discountType'],
                    })
                  }
                  className={inputClass}
                >
                  <option value="PERCENT">Theo phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (VND)</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Giá trị giảm <b className="text-[#ba1a1a]">*</b>
                </span>
                <input
                  type="number"
                  min="1"
                  max={form.discountType === 'PERCENT' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder={form.discountType === 'PERCENT' ? '20' : '50000'}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Giảm tối đa
                </span>
                <input
                  type="number"
                  min="0"
                  disabled={form.discountType === 'FIXED'}
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm({ ...form, maxDiscount: e.target.value })
                  }
                  placeholder="Không giới hạn"
                  className={`${inputClass} disabled:bg-[#f3f4f5] disabled:text-[#8a9188]`}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Đơn tối thiểu
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.minOrderValue}
                  onChange={(e) =>
                    setForm({ ...form, minOrderValue: e.target.value })
                  }
                  placeholder="0"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Tổng lượt sử dụng
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  placeholder="Không giới hạn"
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Giới hạn mỗi người
                </span>
                <input
                  type="number"
                  min="1"
                  value={form.perUserLimit}
                  onChange={(e) =>
                    setForm({ ...form, perUserLimit: e.target.value })
                  }
                  placeholder="Không giới hạn"
                  className={inputClass}
                />
              </label>
              <div className="hidden sm:block" />
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Bắt đầu
                </span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm({ ...form, startAt: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-semibold text-[#191c1d]">
                  Kết thúc
                </span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[#dfe3de] bg-[#f8f9fa] p-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-[#006e2f]"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#191c1d]">
                    Kích hoạt voucher
                  </span>
                  <span className="text-xs text-[#575e70]">
                    Voucher chỉ có thể áp dụng khi đang được kích hoạt.
                  </span>
                </span>
              </label>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#dfe3de] bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="h-10 rounded-xl border border-[#bccbb9] px-4 text-sm font-semibold text-[#575e70] hover:bg-[#f3f4f5]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-xl bg-[#006e2f] px-4 text-sm font-bold text-white hover:bg-[#004b1e] disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Tạo voucher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deactivating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#bccbb9] bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <CircleAlert className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-(family-name:--font-manrope) text-lg font-extrabold text-[#191c1d]">
              Ngừng voucher {deactivating.code}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#575e70]">
              Voucher sẽ không thể được áp dụng cho đơn mới. Dữ liệu và lịch sử
              sử dụng vẫn được giữ lại.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeactivating(null)}
                className="h-10 rounded-xl border border-[#bccbb9] px-4 text-sm font-semibold text-[#575e70] hover:bg-[#f3f4f5]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={busyId === deactivating.id}
                onClick={() => void confirmDeactivate()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ba1a1a] px-4 text-sm font-bold text-white hover:bg-[#93000a] disabled:opacity-60"
              >
                {busyId === deactivating.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Ngừng voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
