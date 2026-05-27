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
  const siteUrl = getSiteUrl();
  const brandName = "SWIFTDROP";

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
      <title>Confirmación de pedido</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, Helvetica, sans-serif;
          background: #ffffff;
          color: #111111;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background: #ffffff;
          padding: 24px 12px 32px;
        }
        .main {
          margin: 0 auto;
          width: 100%;
          max-width: 560px;
          border-spacing: 0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(17, 17, 17, 0.08);
          background: #ffffff;
          border: 1px solid #ececec;
        }
        .header {
          padding: 22px 24px 16px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
        }
        .brand {
          display: inline-block;
          color: #111111;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }
        .hero {
          padding: 28px 24px 12px;
        }
        .eyebrow {
          display: inline-block;
          margin-bottom: 14px;
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        h1 {
          margin: 0 0 14px;
          font-size: 24px;
          line-height: 1.1;
          color: #111111;
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .intro {
          margin: 0;
          max-width: 100%;
          font-size: 14px;
          line-height: 1.6;
          color: #4b5563;
        }
        .meta {
          margin-top: 20px;
          display: table;
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #ededed;
          border-radius: 14px;
          overflow: hidden;
        }
        .meta-row {
          display: table-row;
        }
        .meta-label,
        .meta-value {
          display: table-cell;
          padding: 12px 14px;
          border-bottom: 1px solid #ededed;
        }
        .meta-label {
          width: 40%;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b7280;
          background: #fafafa;
        }
        .meta-value {
          font-size: 14px;
          color: #111111;
          font-weight: 600;
        }
        .meta-row:last-child .meta-label,
        .meta-row:last-child .meta-value {
          border-bottom: none;
        }
        .cta-wrap {
          padding: 10px 24px 18px;
        }
        .button {
          background: #111111;
          color: #ffffff !important;
          padding: 12px 22px;
          text-decoration: none;
          border-radius: 999px;
          font-weight: 700;
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.12em;
          border: 1px solid #111111;
        }
        .panel {
          margin: 0 24px;
          border-radius: 14px;
          border: 1px solid #ededed;
          background: #fbfbfb;
          overflow: hidden;
        }
        .panel-head {
          padding: 12px 16px;
          background: #f5f5f5;
          color: #111111;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border-bottom: 1px solid #ededed;
        }
        .panel-body {
          padding: 0 16px;
        }
        .item-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .item-table th {
          text-align: left;
          padding: 12px 0 10px;
          color: #6b7280;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border-bottom: 1px solid #e5e7eb;
        }
        .item-table td {
          padding: 12px 0;
          border-bottom: 1px solid #eef0f2;
          color: #111111;
        }
        .item-table tbody tr:last-child td {
          border-bottom: none;
        }
        .item-name {
          font-weight: 600;
        }
        .item-qty,
        .item-total {
          text-align: right;
          white-space: nowrap;
        }
        .notice {
          margin: 18px 24px 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }
        .footer {
          padding: 18px 24px 28px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
        }
        .footer a {
          color: #111111;
          text-decoration: none;
          font-weight: 700;
        }
        @media only screen and (max-width: 600px) {
          .wrapper {
            padding: 10px 8px 18px;
          }
          h1 {
            font-size: 22px;
          }
          .meta,
          .meta-row,
          .meta-label,
          .meta-value {
            display: block;
            width: 100%;
          }
          .meta-label {
            border-bottom: none;
            padding-bottom: 4px;
          }
          .meta-value {
            padding-top: 0;
            padding-bottom: 12px;
          }
          .panel,
          .notice,
          .footer,
          .cta-wrap,
          .hero {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      </style>
    </head>
    <body>
      <center class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="header">
              <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <span class="brand">${brandName}</span>
              </a>
            </td>
          </tr>
          <tr>
            <td class="hero">
              <span class="eyebrow">Pedido confirmado</span>
              <h1>Hola ${customerName}, ya recibimos tu compra.</h1>
              <p class="intro">Te dejamos el resumen esencial del pedido y el acceso para seguirlo.</p>

              <div class="meta">
                <div class="meta-row">
                  <div class="meta-label">Pedido</div>
                  <div class="meta-value">${orderLabel}</div>
                </div>
                <div class="meta-row">
                  <div class="meta-label">Total</div>
                  <div class="meta-value">${totalLabel}</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td class="cta-wrap">
              <a href="${orderUrl}" class="button" target="_blank" rel="noopener noreferrer">Ver mi pedido</a>
            </td>
          </tr>
          <tr>
            <td>
              <div class="panel">
                <div class="panel-head">Resumen de artículos</div>
                <div class="panel-body">
                  <table class="item-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th class="item-qty">Cant.</th>
                        <th class="item-total">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="notice">
                Si no reconoces este pedido, responde este correo.
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin:0;">&copy; 2026 SwiftDrop</p>
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
