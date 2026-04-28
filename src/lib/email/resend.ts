import { Resend } from "resend";

type ConfirmationItem = {
  title: string;
  quantity: number;
  lineTotalCents: number;
};

type SendOrderConfirmationInput = {
  to: string;
  customerName?: string | null;
  orderId: string;
  orderNumber?: number | null;
  currency: string;
  totalCents: number;
  items: ConfirmationItem[];
};

function formatCurrency(cents: number, currency: string) {
  const amount = Number.isFinite(cents) ? cents / 100 : 0;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: currency || "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function getFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ??
    process.env.RESEND_FROM ??
    "SwiftDrop <onboarding@tribunanoventa.shop>"
  );
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.tribunanoventa.shop";
}

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationInput) {
  const resend = getResendClient();
  if (!resend) {
    return { ok: false as const, skipped: true as const, reason: "missing_api_key" };
  }

  const toEmail = input.to?.trim().toLowerCase();
  if (!toEmail) {
    return { ok: false as const, skipped: true as const, reason: "missing_recipient" };
  }

  const orderLabel = input.orderNumber ? `#${input.orderNumber}` : input.orderId;
  const customerName = escapeHtml(input.customerName?.trim() || "Cliente");
  const totalLabel = formatCurrency(input.totalCents, input.currency);
  const orderUrl = `${getSiteUrl()}/order/success/${input.orderId}`;

  const rowsHtml = input.items
    .map((item) => {
      const safeTitle = escapeHtml(item.title);
      const lineTotal = formatCurrency(item.lineTotalCents, input.currency);
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${safeTitle}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmacion de pedido</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #111111;
          color: #333333;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #f4f4f7;
          padding-bottom: 40px;
        }
        .main {
          background-color: #ffffff;
          margin: 0 auto;
          width: 100%;
          max-width: 600px;
          border-spacing: 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border-top: 6px solid #fbbf24;
        }
        .header {
          background-color: #000000;
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          width: 200px;
          max-width: 100%;
          height: auto;
        }
        .content {
          padding: 40px 35px;
          text-align: center;
        }
        h2 {
          margin: 0 0 20px;
          font-size: 26px;
          color: #000000;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: -0.5px;
        }
        p {
          margin: 0 0 20px;
          font-size: 16px;
          line-height: 1.6;
          color: #444444;
        }
        .button {
          background-color: #fbbf24;
          color: #000000 !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 900;
          display: inline-block;
          font-size: 16px;
          text-transform: uppercase;
          border-bottom: 4px solid #d97706;
        }
        .summary {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 14px;
          margin: 18px 0 20px;
          text-align: left;
        }
        .accent-bar {
          height: 8px;
          background: linear-gradient(90deg, #fbbf24 0%, #22c55e 100%);
        }
        .table-wrap {
          text-align: left;
          margin-top: 18px;
        }
        .footer {
          padding: 30px;
          text-align: center;
          font-size: 13px;
          color: #666666;
          background-color: #f9fafb;
          border-top: 1px solid #eeeeee;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 30px 20px;
          }
          h2 {
            font-size: 22px;
          }
        }
      </style>
    </head>
    <body>
      <center class="wrapper">
        <table class="main" width="100%">
          <tr><td class="accent-bar"></td></tr>
          <tr>
            <td class="header">
              <a href="${getSiteUrl()}" target="_blank" rel="noopener noreferrer">
                <img src="${getSiteUrl()}/logo.png" alt="SwiftDrop" class="logo" />
              </a>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h2>Pedido confirmado</h2>
              <p>Hola ${customerName}, recibimos tu compra y la estamos preparando.</p>

              <div class="summary">
                <p style="margin:0 0 8px;"><strong>Pedido:</strong> ${orderLabel}</p>
                <p style="margin:0;"><strong>Total:</strong> ${totalLabel}</p>
              </div>

              <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">Ver mi pedido</a>

              <div class="table-wrap">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr>
                      <th style="text-align:left;padding:8px 0;border-bottom:1px solid #d1d5db;">Producto</th>
                      <th style="text-align:center;padding:8px 0;border-bottom:1px solid #d1d5db;">Cant.</th>
                      <th style="text-align:right;padding:8px 0;border-bottom:1px solid #d1d5db;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>

              <p style="font-size: 13px; color: #777777; margin-top: 20px;">Si no reconoces este pedido, responde este correo.</p>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin:0 0 8px;">&copy; 2026 SwiftDrop. Todos los derechos reservados.</p>
              <p style="margin:0;">Gracias por comprar con nosotros.</p>
            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
  `;

  const textLines = [
    `Gracias por tu compra, ${customerName}.`,
    `Pedido: ${orderLabel}`,
    `Total: ${totalLabel}`,
    "",
    "Items:",
    ...input.items.map((item) => `- ${item.title} x${item.quantity} (${formatCurrency(item.lineTotalCents, input.currency)})`),
    "",
    `Ver pedido: ${orderUrl}`,
  ];

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: toEmail,
      subject: `Confirmacion de pedido ${orderLabel} | SwiftDrop`,
      html,
      text: textLines.join("\n"),
    });

    if (error) {
      return { ok: false as const, skipped: false as const, reason: error.message };
    }

    return { ok: true as const, skipped: false as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown_error";
    return { ok: false as const, skipped: false as const, reason };
  }
}
