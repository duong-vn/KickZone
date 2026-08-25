'use client';

import { use, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteAdminField,
  deleteAdminFieldImage,
  fetchAdminFieldById,
  fetchFieldTypes,
  setAdminFieldPrimaryImage,
  updateAdminField,
  updateAdminFieldStatus,
  uploadAdminFieldImages,
} from '@/lib/api';
import {
  FieldImageEditor,
  type FieldEditorImage,
} from '@/components/admin/field-image-editor';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Loader2,
  MapPin,
  Save,
  Sliders,
  Trash2,
} from 'lucide-react';

type FieldStatus = 'ACTIVE' | 'INACTIVE';
type EditSection = 'basic' | 'location' | 'description' | null;

interface FieldDetailFullData {
  id: string;
  name: string;
  slug?: string;
  fieldTypeId?: string;
  fieldType: string;
  fieldTypeLabel: string;
  status: FieldStatus;
  address: string;
  district?: string;
  city?: string;
  basePricePerHour: number;
  description: string;
  imageUrl: string;
  fieldImages?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

const inputClass =
  'h-11 w-full rounded-xl border border-[#bccbb9] bg-white px-3.5 text-sm text-[#191c1d] outline-none transition focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10';

export default function AdminFieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: fieldId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [localField, setLocalField] = useState<Partial<FieldDetailFullData>>(
    {},
  );
  const [editingSection, setEditingSection] = useState<EditSection>(null);
  const [draft, setDraft] = useState({
    name: '',
    fieldTypeId: '',
    basePricePerHour: '',
    address: '',
    district: '',
    city: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: apiField,
    isLoading,
    isError,
    refetch,
  } = useQuery<FieldDetailFullData>({
    queryKey: ['admin-field', fieldId],
    queryFn: () => fetchAdminFieldById(fieldId),
    retry: false,
  });
  const { data: fieldTypes = [] } = useQuery<
    Array<{ id: string; name: string }>
  >({
    queryKey: ['field-types'],
    queryFn: fetchFieldTypes,
    retry: false,
  });

  const field = useMemo(
    () => (apiField ? { ...apiField, ...localField } : null),
    [apiField, localField],
  );
  const editorImages = useMemo<FieldEditorImage[]>(
    () =>
      field?.fieldImages?.map((image) => ({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
      })) ?? [],
    [field?.fieldImages],
  );

  const formatVnd = (value: number) =>
    `${new Intl.NumberFormat('vi-VN').format(value)}đ/giờ`;

  const beginEdit = (section: Exclude<EditSection, null>) => {
    if (!field) return;
    setDraft({
      name: field.name,
      fieldTypeId: field.fieldTypeId ?? '',
      basePricePerHour: String(field.basePricePerHour),
      address: field.address,
      district: field.district ?? '',
      city: field.city ?? '',
      description: field.description ?? '',
    });
    setEditingSection(section);
  };

  const saveSection = async (section: Exclude<EditSection, null>) => {
    if (!field) return;
    const payload: Record<string, unknown> = {};
    const local: Partial<FieldDetailFullData> = {};

    if (section === 'basic') {
      const price = Number(draft.basePricePerHour);
      if (!draft.name.trim())
        return toast.warning('Tên sân không được để trống.');
      if (!Number.isInteger(price) || price < 0 || price % 2 !== 0) {
        return toast.warning(
          'Giá sân phải là số nguyên không âm và chia hết cho 2.',
        );
      }
      Object.assign(payload, {
        name: draft.name.trim(),
        fieldTypeId: draft.fieldTypeId || undefined,
        basePricePerHour: price,
      });
      const selectedType = fieldTypes.find(
        (type) => type.id === draft.fieldTypeId,
      );
      Object.assign(local, {
        name: draft.name.trim(),
        fieldTypeId: draft.fieldTypeId,
        fieldType: selectedType?.name ?? field.fieldType,
        fieldTypeLabel: selectedType?.name
          ? selectedType.name.includes('5')
            ? 'Sân 5 người'
            : selectedType.name.includes('7')
              ? 'Sân 7 người'
              : 'Sân 11 người'
          : field.fieldTypeLabel,
        basePricePerHour: price,
      });
    } else if (section === 'location') {
      if (!draft.address.trim())
        return toast.warning('Địa chỉ sân không được để trống.');
      Object.assign(payload, {
        address: draft.address.trim(),
        district: draft.district.trim(),
        city: draft.city.trim(),
      });
      Object.assign(local, payload);
    } else {
      payload.description = draft.description.trim();
      local.description = draft.description.trim();
    }

    setSaving(true);
    try {
      await updateAdminField(fieldId, payload);
      setLocalField((current) => ({ ...current, ...local }));
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['admin-fields'] }),
      ]);
      setEditingSection(null);
      toast.success('Đã lưu thay đổi.');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể cập nhật sân bóng.');
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: File[]) => {
    if (editorImages.length + files.length > 5) {
      toast.warning('Mỗi sân được tải tối đa 5 ảnh.');
      return;
    }
    const invalid = files.find(
      (file) =>
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      toast.warning(
        `Ảnh ${invalid.name} không đúng định dạng hoặc vượt quá 5MB.`,
      );
      return;
    }

    setImageBusy(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      await uploadAdminFieldImages(fieldId, formData);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      toast.success('Đã thêm ảnh sân bóng.');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể tải ảnh lên.');
    } finally {
      setImageBusy(false);
    }
  };

  const performRemoveImage = async (image: FieldEditorImage) => {
    setImageBusy(true);
    try {
      await deleteAdminFieldImage(fieldId, image.id);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      toast.success('Đã xóa ảnh.');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể xóa ảnh.');
    } finally {
      setImageBusy(false);
    }
  };

  const removeImage = (image: FieldEditorImage) => {
    toast.warning('Bạn có chắc muốn xóa ảnh này?', {
      description: image.isPrimary
        ? 'Ảnh tiếp theo sẽ được chọn làm ảnh bìa.'
        : 'Thao tác này không thể hoàn tác.',
      action: {
        label: 'Xóa ảnh',
        onClick: () => void performRemoveImage(image),
      },
      cancel: { label: 'Hủy', onClick: () => undefined },
      duration: 8000,
    });
  };

  const setPrimaryImage = async (image: FieldEditorImage) => {
    setImageBusy(true);
    try {
      await setAdminFieldPrimaryImage(fieldId, image.id);
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      toast.success('Đã đổi ảnh bìa.');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể đổi ảnh bìa.');
    } finally {
      setImageBusy(false);
    }
  };

  const toggleStatus = async () => {
    if (!field) return;
    const status: FieldStatus =
      field.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateAdminFieldStatus(fieldId, status);
      setLocalField((current) => ({ ...current, status }));
      await queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      toast.success(
        status === 'ACTIVE' ? 'Đã kích hoạt sân.' : 'Đã tạm ngưng sân.',
      );
    } catch (error) {
      toast.error((error as Error).message || 'Không thể cập nhật trạng thái.');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAdminField(fieldId);
      await queryClient.invalidateQueries({ queryKey: ['admin-fields'] });
      router.push('/admin/fields');
    } catch (error) {
      toast.error((error as Error).message || 'Không thể xóa sân bóng.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-[#006e2f]">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }
  if (isError || !field) {
    return (
      <div className="rounded-2xl border border-[#ba1a1a]/30 bg-white p-8 text-center text-sm text-[#ba1a1a]">
        Không thể tải thông tin sân bóng.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-[#bccbb9]/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/fields"
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#bccbb9] bg-white text-[#575e70] hover:bg-[#e7e8e9]"
            title="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-semibold text-[#006e2f]">
              Chi tiết sân bóng
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-(family-name:--font-manrope) text-2xl font-extrabold text-[#191c1d]">
                {field.name}
              </h1>
              <span className="rounded-md bg-[#dcfce7] px-2.5 py-1 text-xs font-bold text-[#006e2f]">
                {field.fieldTypeLabel}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  field.status === 'ACTIVE'
                    ? 'bg-[#22c55e] text-white'
                    : 'bg-[#e1e3e4] text-[#575e70]'
                }`}
              >
                {field.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#575e70]">
              Chỉnh sửa từng nhóm thông tin và quản lý thư viện ảnh của sân.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/fields/${field.id}/pricing`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#bccbb9] bg-white px-4 text-sm font-semibold text-[#191c1d] hover:bg-[#f3f4f5]"
          >
            <Sliders className="h-4 w-4 text-[#006e2f]" /> Bảng giá
          </Link>
          <Link
            href={`/admin/schedule?fieldId=${field.id}`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#006e2f] px-4 text-sm font-bold text-white hover:bg-[#004b1e]"
          >
            <Calendar className="h-4 w-4" /> Xem lịch sân
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-[#bccbb9] bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
            Hình ảnh sân bóng
          </h2>
          <p className="mt-1 text-xs text-[#575e70]">
            Di chuột lên ảnh để đặt ảnh bìa hoặc xóa. Ô dấu cộng dùng để thêm
            ảnh mới.
          </p>
        </div>
        <FieldImageEditor
          images={editorImages}
          onFilesSelected={uploadImages}
          onRemove={removeImage}
          onSetPrimary={setPrimaryImage}
          busy={imageBusy}
          maxImages={5}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="space-y-6">
          <EditableCard
            title="Thông tin cơ bản"
            editing={editingSection === 'basic'}
            onEdit={() => beginEdit('basic')}
            onCancel={() => setEditingSection(null)}
            onSave={() => void saveSection('basic')}
            saving={saving}
          >
            {editingSection === 'basic' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">Tên sân</span>
                  <input
                    className={inputClass}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold">Loại sân</span>
                  <span className="relative block">
                    <select
                      className={`${inputClass} appearance-none pr-9`}
                      value={draft.fieldTypeId}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          fieldTypeId: event.target.value,
                        })
                      }
                    >
                      {fieldTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#575e70]" />
                  </span>
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold">
                    Giá cơ bản / giờ
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    className={inputClass}
                    value={draft.basePricePerHour}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        basePricePerHour: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoItem label="Tên sân" value={field.name} />
                <InfoItem label="Loại sân" value={field.fieldTypeLabel} />
                <InfoItem
                  label="Giá cơ bản"
                  value={formatVnd(field.basePricePerHour)}
                  accent
                />
              </div>
            )}
          </EditableCard>

          <EditableCard
            title="Địa điểm"
            editing={editingSection === 'location'}
            onEdit={() => beginEdit('location')}
            onCancel={() => setEditingSection(null)}
            onSave={() => void saveSection('location')}
            saving={saving}
          >
            {editingSection === 'location' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">
                    Địa chỉ chi tiết
                  </span>
                  <input
                    className={inputClass}
                    value={draft.address}
                    onChange={(event) =>
                      setDraft({ ...draft, address: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold">Quận / Huyện</span>
                  <input
                    className={inputClass}
                    value={draft.district}
                    onChange={(event) =>
                      setDraft({ ...draft, district: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-sm font-semibold">Thành phố</span>
                  <input
                    className={inputClass}
                    value={draft.city}
                    onChange={(event) =>
                      setDraft({ ...draft, city: event.target.value })
                    }
                  />
                </label>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-[#f8f9fa] p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#006e2f]" />
                <div>
                  <p className="font-semibold text-[#191c1d]">
                    {field.address}
                  </p>
                  <p className="mt-1 text-sm text-[#575e70]">
                    {[field.district, field.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </EditableCard>

          <EditableCard
            title="Mô tả sân bóng"
            editing={editingSection === 'description'}
            onEdit={() => beginEdit('description')}
            onCancel={() => setEditingSection(null)}
            onSave={() => void saveSection('description')}
            saving={saving}
          >
            {editingSection === 'description' ? (
              <textarea
                rows={6}
                className="w-full rounded-xl border border-[#bccbb9] p-3.5 text-sm leading-6 outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                value={draft.description}
                onChange={(event) =>
                  setDraft({ ...draft, description: event.target.value })
                }
              />
            ) : (
              <p className="whitespace-pre-line text-sm leading-6 text-[#575e70]">
                {field.description || 'Chưa có mô tả cho sân bóng này.'}
              </p>
            )}
          </EditableCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-[#bccbb9] bg-white p-5 shadow-sm">
            <h2 className="font-(family-name:--font-manrope) text-base font-bold text-[#191c1d]">
              Trạng thái hoạt động
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#575e70]">
              {field.status === 'ACTIVE'
                ? 'Sân đang hiển thị và có thể nhận đơn đặt mới.'
                : 'Sân đang bị ẩn khỏi luồng đặt sân công khai.'}
            </p>
            <button
              type="button"
              onClick={() => void toggleStatus()}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold ${
                field.status === 'ACTIVE'
                  ? 'border border-[#ba1a1a]/30 bg-[#ffdad6]/40 text-[#ba1a1a] hover:bg-[#ffdad6]'
                  : 'bg-[#006e2f] text-white hover:bg-[#004b1e]'
              }`}
            >
              {field.status === 'ACTIVE' ? (
                <Ban className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {field.status === 'ACTIVE' ? 'Tạm ngưng sân' : 'Kích hoạt sân'}
            </button>
          </section>

          <section className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/15 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-(family-name:--font-manrope) text-base font-bold">
                Vùng nguy hiểm
              </h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#575e70]">
              Xóa mềm sân khỏi hệ thống. Lịch sử đơn đặt vẫn được bảo toàn.
            </p>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ba1a1a] py-2.5 text-sm font-bold text-white hover:bg-[#93000a]"
            >
              <Trash2 className="h-4 w-4" /> Xóa sân bóng
            </button>
          </section>
        </aside>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1d]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#ba1a1a]/30 bg-white p-6 shadow-2xl">
            <h2 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
              Xóa sân “{field.name}”?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#575e70]">
              Sân sẽ không còn xuất hiện công khai. Thao tác bị chặn nếu còn đơn
              PENDING hoặc lịch CONFIRMED trong tương lai.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl border border-[#bccbb9] px-4 py-2 text-sm font-semibold text-[#575e70]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-[#ba1a1a] px-4 py-2 text-sm font-bold text-white"
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

function EditableCard({
  title,
  editing,
  onEdit,
  onCancel,
  onSave,
  saving,
  children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#bccbb9] bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#bccbb9]/50 pb-4">
        <h2 className="font-(family-name:--font-manrope) text-lg font-bold text-[#191c1d]">
          {title}
        </h2>
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 rounded-lg border border-[#bccbb9] px-3 text-xs font-semibold text-[#575e70] hover:bg-[#f3f4f5]"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#006e2f] px-3 text-xs font-bold text-white hover:bg-[#004b1e] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}{' '}
              Lưu phần này
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#bccbb9] px-3 text-xs font-bold text-[#191c1d] hover:border-[#006e2f] hover:text-[#006e2f]"
          >
            <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function InfoItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f8f9fa] p-4">
      <p className="text-xs font-semibold text-[#575e70]">{label}</p>
      <p
        className={`mt-1 text-sm font-bold ${accent ? 'text-[#006e2f]' : 'text-[#191c1d]'}`}
      >
        {value}
      </p>
    </div>
  );
}
