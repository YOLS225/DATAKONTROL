import { useApiQuery } from '@/shared/hooks/use-api-query';
import type { NotificationItem } from '@/features/notifications/types/notification';

export const useNotifications = (
  options: {
    unread?: boolean;
    enabled?: boolean;
    refetchInterval?: number | false;
  } = {}
) => {
  return useApiQuery<NotificationItem>({
    endpoint: '/notifications',
    queryKey: ['notifications', options.unread ?? 'all'],
    initialPageSize: 10,
    additionalParams: {
      unread: options.unread,
    },
    isPaginated: true,
    queryOptions: {
      enabled: options.enabled ?? true,
      refetchInterval: options.refetchInterval,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });
};
