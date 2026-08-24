'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DeleteReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteReviewDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteReviewDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#bccbb9]/40 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h3 className="font-['Manrope'] font-bold text-lg text-[#191c1d] mb-2">
          Xóa bài đánh giá?
        </h3>
        <p className="text-xs sm:text-sm text-[#575e70] leading-relaxed mb-6">
          Bạn có chắc chắn muốn xóa bài đánh giá này không? Mọi bình luận và
          phản hồi liên quan cũng sẽ không thể khôi phục.
        </p>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-4 text-xs font-semibold text-[#575e70]"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl px-5 text-xs font-semibold shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {isLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </div>
      </div>
    </div>
  );
}
