import { AnalyzeForm } from "@/components/analyze/AnalyzeForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AnalyzePage() {
  return (
    <AppShell>
      <ProtectedRoute>
        <PageHeader eyebrow="Agent intake" title="Run ICP analysis">
          Give the agent enough context to rank segments and produce a practical sales motion.
        </PageHeader>
        <AnalyzeForm />
      </ProtectedRoute>
    </AppShell>
  );
}

