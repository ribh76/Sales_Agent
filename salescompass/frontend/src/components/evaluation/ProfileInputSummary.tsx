import type { EvaluationProfileView } from "@/types/evaluation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const HISTORY_FIELDS = [
  ["description", "Business description"],
  ["current_markets", "Current markets"],
  ["average_ticket", "Average ticket"],
  ["average_contract_value", "Average contract value"],
  ["average_sales_cycle", "Sales cycle"],
  ["past_clients", "Past wins/clients"],
  ["customer_history", "Customer history"],
  ["past_lost_deals", "Lost deals"],
  ["loss_reasons", "Loss reasons"],
] as const;

const NO_HISTORY_FIELDS = [
  ["description", "Business description"],
  ["problem_solved", "Problem solved"],
  ["target_user_guess", "Target guess"],
  ["hypothetical_ticket", "Hypothetical ticket"],
  ["average_contract_value", "Estimated contract value"],
  ["early_leads", "Early leads"],
  ["known_competitors", "Competitors"],
] as const;

export function ProfileInputSummary({ profile }: { profile: EvaluationProfileView | null }) {
  if (!profile) {
    return null;
  }

  const fields = profile.mode === "history" ? HISTORY_FIELDS : NO_HISTORY_FIELDS;
  const items = fields.reduce<Array<{ label: string; value: string }>>((acc, [key, label]) => {
    const value = formatValue(key, profile.profileInput[key]);
    if (value) {
      acc.push({ label, value });
    }
    return acc;
  }, []);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Selected Profile Input</h2>
          <p className="mt-1 text-sm text-neutral-600">{profile.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{profile.modeLabel}</Badge>
          <Badge tone={profile.isThinData ? "amber" : "green"}>{profile.dataStrengthLabel}</Badge>
        </div>
      </div>

      {items.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-md bg-field px-3 py-3">
              <div className="text-xs font-semibold uppercase text-neutral-500">{item.label}</div>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md bg-field px-3 py-3 text-sm text-neutral-600">
          No detailed profile input fields were returned for this seeded profile.
        </p>
      )}
    </Card>
  );
}

function formatValue(key: string, value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (key.includes("ticket") || key.includes("contract_value")) {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    }

    if (key.includes("sales_cycle")) {
      return `${value} days`;
    }

    return String(value);
  }

  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (Array.isArray(value)) {
    const values = value.map((item) => formatNestedValue(item)).filter(Boolean);
    return values.length ? values.join(", ") : undefined;
  }

  if (typeof value === "object") {
    const values = Object.entries(value)
      .map(([nestedKey, nestedValue]) => {
        const formatted = formatNestedValue(nestedValue);
        return formatted ? `${formatLabel(nestedKey)}: ${formatted}` : undefined;
      })
      .filter(Boolean);
    return values.length ? values.join("; ") : undefined;
  }

  return undefined;
}

function formatNestedValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim() || undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    const values = value.map((item) => formatNestedValue(item)).filter(Boolean);
    return values.length ? values.join(", ") : undefined;
  }

  if (value && typeof value === "object") {
    const values = Object.values(value).map((item) => formatNestedValue(item)).filter(Boolean);
    return values.length ? values.join(", ") : undefined;
  }

  return undefined;
}

function formatLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
