import { Textarea } from "@/components/ui/Textarea";

export function HistoryFields({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      label="Customer history"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Best customers, lost deals, buying triggers, deal size, sales cycle, common objections."
    />
  );
}

