import type { EvaluationProfile } from "@/types/evaluation";
import { Select } from "@/components/ui/Select";

export function EvaluationProfilePicker({
  profiles,
  selectedKey,
  onChange
}: {
  profiles: EvaluationProfile[];
  selectedKey: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      label="Profile"
      value={selectedKey}
      onChange={(event) => onChange(event.target.value)}
      options={profiles.map((profile) => ({ value: profile.key, label: profile.label }))}
    />
  );
}

