'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchFavorites,
  fetchFavoriteStatus,
  toggleFavoriteField,
} from '@/lib/api';
import type { FavoritesResponse } from '@/types/favorite';

export const FAVORITES_QUERY_KEY = ['favorites'];
export const FAVORITE_STATUS_QUERY_KEY = (fieldId: string) => [
  'favorite-status',
  fieldId,
];

export function useFavoritesQuery(params?: { page?: number; limit?: number }) {
  return useQuery<FavoritesResponse>({
    queryKey: [...FAVORITES_QUERY_KEY, params],
    queryFn: () => fetchFavorites(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      if ((error as Error).message === 'UNAUTHORIZED') return false;
      return failureCount < 2;
    },
  });
}

export function useFavoriteStatusQuery(fieldId: string, enabled = true) {
  return useQuery<{ is_favorite: boolean }>({
    queryKey: FAVORITE_STATUS_QUERY_KEY(fieldId),
    queryFn: () => fetchFavoriteStatus(fieldId),
    enabled: Boolean(fieldId) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useToggleFavoriteMutation(fieldId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => toggleFavoriteField(fieldId),
    onMutate: async () => {
      // 1. Cancel ongoing queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: FAVORITE_STATUS_QUERY_KEY(fieldId),
      });

      // 2. Snapshot previous value
      const previousStatus = queryClient.getQueryData<{
        is_favorite: boolean;
      }>(FAVORITE_STATUS_QUERY_KEY(fieldId));

      const newStatus = !previousStatus?.is_favorite;

      // 3. Optimistically update status
      queryClient.setQueryData<{ is_favorite: boolean }>(
        FAVORITE_STATUS_QUERY_KEY(fieldId),
        { is_favorite: newStatus },
      );

      return { previousStatus, newStatus };
    },
    onSuccess: (data) => {
      if (data.is_favorite) {
        toast.success(data.message || 'Đã thêm sân vào danh sách yêu thích!');
      } else {
        toast.info(data.message || 'Đã xóa khỏi danh sách yêu thích.');
      }
    },
    onError: (err, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(
          FAVORITE_STATUS_QUERY_KEY(fieldId),
          context.previousStatus,
        );
      }

      if ((err as Error).message === 'UNAUTHORIZED') {
        toast.error('Vui lòng đăng nhập để lưu sân yêu thích!', {
          action: {
            label: 'Đăng nhập',
            onClick: () => {
              const currentPath =
                typeof window !== 'undefined' ? window.location.pathname : '';
              router.push(
                currentPath
                  ? `/login?redirect=${encodeURIComponent(currentPath)}`
                  : '/login',
              );
            },
          },
        });
      } else {
        toast.error(
          'Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại!',
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: FAVORITE_STATUS_QUERY_KEY(fieldId),
      });
      void queryClient.invalidateQueries({
        queryKey: FAVORITES_QUERY_KEY,
      });
    },
  });
}
