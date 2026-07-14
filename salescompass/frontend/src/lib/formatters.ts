export function formatDate(value?: string): string {
  if (!value) {
    return "Pending";
  }
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatCurrency(value?: number): string {
  if (!value) {
    return "Unknown";
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

