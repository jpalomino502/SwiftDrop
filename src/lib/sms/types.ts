export type SmsNotificationStatus = "pending" | "sent" | "failed" | "mocked";

export type SmsNotification = {
  id: string;
  order_id: string | null;
  phone: string;
  message: string;
  provider: string;
  status: SmsNotificationStatus;
  provider_response: Record<string, unknown>;
  sent_at: string | null;
  created_at: string;
};

export type SendMockSmsInput = {
  phone: string;
  message: string;
  orderId?: string;
};

export type SendMockSmsResult = {
  success: boolean;
  notificationId?: string;
  status: SmsNotificationStatus;
  error?: string;
};
