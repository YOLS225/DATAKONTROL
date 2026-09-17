'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, X, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { notificationService } from '@/features/notifications/api/notification-service';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-unread-notification-count';
import type { NotificationItem } from '@/features/notifications/types/notification';
import { cn } from '@/shared/lib/utils';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const countQuery = useUnreadNotificationCount();
  const notificationsQuery = useNotifications({
    enabled: isOpen,
    refetchInterval: isOpen ? 15_000 : false,
  });
  const unreadCount = countQuery.data ?? 0;
  const notifications = notificationsQuery.data?.data ?? [];

  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  useEffect(() => {
    if (isOpen) {
      countQuery.refetch();
      notificationsQuery.refetch();
    }
  }, [countQuery, isOpen, notificationsQuery]);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: refreshNotifications,
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Lecture impossible');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: refreshNotifications,
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Mise a jour impossible');
    },
  });

  return (
    <Dialog.Root onOpenChange={setIsOpen} open={isOpen}>
      <Dialog.Trigger asChild>
        <button
          className="relative grid size-10 place-items-center rounded-md border bg-card hover:bg-muted"
          type="button"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,100vw)] flex-col border-l bg-popover text-popover-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in">
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div>
              <Dialog.Title className="text-base font-semibold">Notifications</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Dialog.Description>
            </div>
            <Dialog.Close className="grid size-9 shrink-0 place-items-center rounded-md border hover:bg-muted" type="button">
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="text-sm text-muted-foreground">{notificationsQuery.data?.pagination.total_elements ?? notifications.length} notification{notifications.length > 1 ? 's' : ''}</p>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
              disabled={!unreadCount || markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
              type="button"
            >
              {markAllAsReadMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
              Tout marquer lu
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {notificationsQuery.isLoading ? (
              <NotificationSkeleton />
            ) : notificationsQuery.isError ? (
              <NotificationState text="Notifications indisponibles" />
            ) : notifications.length ? (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClose={() => setIsOpen(false)}
                  onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                  isMarkingRead={markAsReadMutation.isPending}
                />
              ))
            ) : (
              <NotificationState text="Aucune notification pour le moment" />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function NotificationRow({
  notification,
  isMarkingRead,
  onMarkAsRead,
  onClose,
}: {
  notification: NotificationItem;
  isMarkingRead: boolean;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}) {
  const href = getNotificationHref(notification);
  const isUnread = !notification.readAt;
  const content = (
    <div className={cn('rounded-md border p-3 text-left transition hover:bg-muted/45', isUnread && 'border-primary/35 bg-primary/5')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{notification.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.message}</p>
          {notification.createdAt && <p className="mt-2 text-[11px] text-muted-foreground">{formatDate(notification.createdAt)}</p>}
        </div>
        {isUnread && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
      </div>
    </div>
  );

  return (
    <div className="group relative">
      {href ? (
        <Link
          href={href}
          onClick={() => {
            if (isUnread) {
              onMarkAsRead(notification.id);
            }
            onClose();
          }}
        >
          {content}
        </Link>
      ) : (
        <button
          className="w-full"
          onClick={() => {
            if (isUnread) {
              onMarkAsRead(notification.id);
            }
          }}
          type="button"
        >
          {content}
        </button>
      )}
      {isUnread && (
        <button
          className="absolute bottom-2 right-2 grid size-7 place-items-center rounded-md border bg-background opacity-0 transition hover:bg-muted group-hover:opacity-100 disabled:opacity-50"
          disabled={isMarkingRead}
          onClick={() => onMarkAsRead(notification.id)}
          type="button"
        >
          {isMarkingRead ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
        </button>
      )}
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="animate-pulse rounded-md border p-3" key={index}>
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-3 h-3 w-full rounded bg-muted" />
          <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </>
  );
}

function NotificationState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      <XCircle className="mx-auto mb-2 size-5" />
      {text}
    </div>
  );
}

function getNotificationHref(notification: NotificationItem) {
  const sourceId = notification.data?.sourceId;
  const uploadId = notification.data?.uploadId;

  if (!sourceId || !uploadId) {
    return null;
  }

  return `/reports?sourceId=${encodeURIComponent(sourceId)}&uploadId=${encodeURIComponent(uploadId)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
