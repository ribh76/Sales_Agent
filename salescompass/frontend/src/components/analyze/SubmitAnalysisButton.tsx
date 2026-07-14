import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SubmitAnalysisButton({ loading }: { loading: boolean }) {
  return (
    <Button type="submit" disabled={loading} icon={<Sparkles aria-hidden className="h-4 w-4" />}>
      {loading ? "Analyzing" : "Run ICP analysis"}
    </Button>
  );
}

