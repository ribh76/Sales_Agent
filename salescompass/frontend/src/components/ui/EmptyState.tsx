import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-field p-8 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {children ? <div className="mt-2 text-sm text-neutral-600">{children}</div> : null}
    </div>
  );
}

