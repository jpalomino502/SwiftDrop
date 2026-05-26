export type PaymentProvider = "stripe" | "mercadopago" | "manual" | "epayco";

export type EpaycoMockStatus = "pending" | "approved" | "rejected" | "error";

export type EpaycoMockInput = {
  orderId: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
};

export type EpaycoMockResult = {
  success: boolean;
  transactionId?: string;
  status: EpaycoMockStatus;
  message: string;
  url?: string;
  redirectUrl?: string;
};
