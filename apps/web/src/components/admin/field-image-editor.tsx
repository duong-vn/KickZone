/* eslint-disable @next/next/no-img-element */
'use client';

import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Star, Trash2 } from 'lucide-react';

export type FieldEditorImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

type FieldImageEditorProps = {
  images: FieldEditorImage[];
  onFilesSelected: (files: File[]) => void | Promise<void>;
  onRemove?: (image: FieldEditorImage) => void | Promise<void>;
  onSetPrimary?: (image: FieldEditorImage) => void | Promise<void>;
  busy?: boolean;
  maxImages?: number;
};

export function FieldImageEditor({
  images,
  onFilesSelected,
  onRemove,
  onSetPrimary,
  busy = false,
  maxImages = 5,
}: FieldImageEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const canAdd = images.length < maxImages;
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0];
  const selectedImage =
    images.find((image) => image.id === selectedImageId) ?? primaryImage;
  const thumbnailImages = selectedImage
    ? images.filter((image) => image.id !== selectedImage.id)
    : [];

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) void onFilesSelected(files);
    event.target.value = '';
  };

  const selectWithKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
    imageId: string,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedImageId(imageId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#191c1d]">
            Thư viện ảnh sân
          </p>
          <p className="mt-0.5 text-xs text-[#575e70]">
            JPG, PNG hoặc WEBP, tối đa 5MB mỗi ảnh.
          </p>
        </div>
        <span className="rounded-full bg-[#f3f4f5] px-2.5 py-1 text-xs font-semibold text-[#575e70]">
          {images.length}/{maxImages} ảnh
        </span>
      </div>

      <div className="grid items-start gap-3 md:h-[clamp(420px,48vw,680px)] md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
        <div className="h-full min-h-0">
          {selectedImage ? (
            <div
              className={`group relative aspect-[16/10] h-full overflow-hidden rounded-xl border bg-[#edeeef] md:aspect-auto ${
                selectedImage.isPrimary
                  ? 'border-[#006e2f] ring-2 ring-[#006e2f]/15'
                  : 'border-[#bccbb9]'
              }`}
            >
              <img
                src={selectedImage.url}
                alt="Ảnh sân bóng đang xem"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#191c1d]/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {!selectedImage.isPrimary && onSetPrimary && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onSetPrimary(selectedImage)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2.5 text-xs font-bold text-[#006e2f] shadow-sm hover:bg-[#f3f4f5] disabled:opacity-50"
                  >
                    <Star className="h-4 w-4" />
                    Đặt làm ảnh bìa
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRemove(selectedImage)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ba1a1a] text-white shadow-sm hover:bg-[#93000a] disabled:opacity-50"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
              {selectedImage.isPrimary && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-[#006e2f] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  <Star className="h-3 w-3 fill-current" /> Ảnh bìa
                </span>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl border border-dashed border-[#bccbb9] bg-[#f3f4f5] text-[#575e70]">
              <ImagePlus className="mb-2 h-9 w-9" />
              <p className="text-sm font-semibold">Chưa có ảnh bìa</p>
              <p className="mt-1 text-xs">Ảnh đầu tiên tải lên sẽ là ảnh bìa</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:h-full md:overflow-y-auto md:pr-1.5">
          {thumbnailImages.map((image, index) => (
            <div
              key={image.id}
              role="button"
              tabIndex={0}
              aria-label={`Xem ảnh sân ${index + 1}`}
              onClick={() => setSelectedImageId(image.id)}
              onKeyDown={(event) => selectWithKeyboard(event, image.id)}
              className={`group relative aspect-[16/10] shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-[#edeeef] outline-none transition hover:border-[#006e2f] focus-visible:ring-2 focus-visible:ring-[#006e2f] ${
                image.isPrimary ? 'border-[#006e2f]' : 'border-[#bccbb9]'
              }`}
            >
              <img
                src={image.url}
                alt={`Ảnh sân ${index + 2}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#191c1d]/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {!image.isPrimary && onSetPrimary && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onSetPrimary(image);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-bold text-[#006e2f] shadow-sm hover:bg-[#f3f4f5] disabled:opacity-50"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Ảnh bìa
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      void onRemove(image);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#ba1a1a] text-white shadow-sm hover:bg-[#93000a] disabled:opacity-50"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {image.isPrimary && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#006e2f] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  <Star className="h-3 w-3 fill-current" /> Ảnh bìa
                </span>
              )}
            </div>
          ))}

          {canAdd && (
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="group relative aspect-[16/10] min-h-40 shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-[#8ca18c] bg-[#edf8ef] text-[#006e2f] transition hover:border-[#006e2f] hover:bg-[#dcfce7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {images.length > 0 && (
                <img
                  src={images[images.length - 1].url}
                  alt=""
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-sm transition group-hover:opacity-25"
                />
              )}
              <span className="relative flex h-full flex-col items-center justify-center gap-2 p-4">
                {busy ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : images.length === 0 ? (
                  <ImagePlus className="h-9 w-9" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm">
                    <Plus className="h-6 w-6" />
                  </span>
                )}
                <span className="text-sm font-bold">
                  {images.length === 0 ? 'Chọn ảnh sân bóng' : 'Thêm ảnh'}
                </span>
                <span className="text-xs font-normal text-[#575e70]">
                  Có thể chọn nhiều ảnh cùng lúc
                </span>
              </span>
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}
