import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  children,
  action
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase text-signal">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {children ? <div className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
