export type NotificationType =
  | 'UPLOAD_COMPLETED'
  | 'UPLOAD_COMPLETED_WITH_ERRORS'
  | 'UPLOAD_FAILED'
  | string;

export type NotificationData = {
  sourceId?: string;
  uploadId?: string;
  status?: string;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
};

export type NotificationItem = {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData | null;
  readAt?: string | null;
  createdAt?: string;
};

export type NotificationListParams = {
  page?: number;
  page_size?: number;
  unread?: boolean;
};

export type NotificationListResponse =
  | NotificationItem[]
  | {
      data?:
        | NotificationItem[]
        | {
            content?: NotificationItem[];
            total?: number;
            page?: number;
            page_size?: number;
          };
      content?: NotificationItem[];
      success?: boolean;
      message?: string;
    };

export type UnreadCountResponse = {
  data?: {
    count?: number;
  };
  count?: number;
  success?: boolean;
  message?: string;
};
