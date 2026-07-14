export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-signal" />
      {label}
    </span>
  );
}

