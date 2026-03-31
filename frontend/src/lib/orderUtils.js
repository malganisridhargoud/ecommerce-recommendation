export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatOrderCode(id) {
  return `ORD-${String(id).padStart(6, "0")}`;
}

export function formatDateTime(value) {
  if (!value) return "Pending";
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function getShippingAddressLines(address = {}) {
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(", ");
  return [
    address.full_name,
    address.line1,
    address.line2,
    cityLine,
    address.country,
    address.phone ? `Phone: ${address.phone}` : "",
  ].filter(Boolean);
}

export function downloadInvoice(bookings, options = {}) {
  const bookingList = Array.isArray(bookings) ? bookings : [];
  if (!bookingList.length || typeof document === "undefined") return;

  const title = options.title || "TapRent Invoice";
  const total = bookingList.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
  const shippingLines = getShippingAddressLines(bookingList[0]?.shipping_address || {});
  const rows = bookingList
    .map(
      (booking) => `
        <tr>
          <td>${formatOrderCode(booking.id)}</td>
          <td>${booking.equipment_detail?.name || "Equipment rental"}</td>
          <td>${booking.start_date} to ${booking.end_date}</td>
          <td>${booking.status || "pending"}</td>
          <td>${formatCurrency(booking.total_price)}</td>
        </tr>
      `
    )
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
        h1 { margin: 0 0 8px; font-size: 26px; }
        p { margin: 0 0 4px; }
        .muted { color: #6b7280; }
        .block { margin-top: 28px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 14px; }
        th { background: #f9fafb; }
        .total { margin-top: 20px; font-size: 18px; font-weight: 700; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="muted">Generated on ${formatDateTime(new Date().toISOString())}</p>
      <p class="muted">Orders: ${bookingList.map((booking) => formatOrderCode(booking.id)).join(", ")}</p>

      <div class="block">
        <strong>Shipping address</strong>
        ${shippingLines.length ? shippingLines.map((line) => `<p>${line}</p>`).join("") : "<p class=\"muted\">No shipping address captured.</p>"}
      </div>

      <div class="block">
        <strong>Line items</strong>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Equipment</th>
              <th>Rental window</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div class="total">Grand total: ${formatCurrency(total)}</div>
    </body>
  </html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
