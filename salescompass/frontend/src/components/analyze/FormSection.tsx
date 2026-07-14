import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function FormSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="grid gap-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}

