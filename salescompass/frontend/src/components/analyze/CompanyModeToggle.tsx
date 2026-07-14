import { History, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CompanyModeToggle({
  hasHistory,
  onChange
}: {
  hasHistory: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button
        type="button"
        variant={hasHistory ? "primary" : "secondary"}
        icon={<History aria-hidden className="h-4 w-4" />}
        onClick={() => onChange(true)}
      >
        Customer history
      </Button>
      <Button
        type="button"
        variant={!hasHistory ? "primary" : "secondary"}
        icon={<Search aria-hidden className="h-4 w-4" />}
        onClick={() => onChange(false)}
      >
        No history
      </Button>
    </div>
  );
}

