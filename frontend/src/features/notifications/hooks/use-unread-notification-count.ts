import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/features/notifications/api/notification-service';

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const payload = (await notificationService.getUnreadCount()).data;

      return payload.data?.count ?? payload.count ?? 0;
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};
