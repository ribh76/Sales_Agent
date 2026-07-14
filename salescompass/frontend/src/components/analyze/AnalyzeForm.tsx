"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { useAnalyze } from "@/hooks/useAnalyze";
import { validateCompanyInput } from "@/lib/validators";
import type { CompanyInput } from "@/types/company";
import { demoProfiles } from "@/data/demoProfiles";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { CompanyModeToggle } from "./CompanyModeToggle";
import { FormSection } from "./FormSection";
import { HistoryFields } from "./HistoryFields";
import { NoHistoryFields } from "./NoHistoryFields";
import { SubmitAnalysisButton } from "./SubmitAnalysisButton";

const emptyCompany: CompanyInput = {
  name: "",
  website: "",
  industry: "",
  stage: "Seed",
  average_contract_value: undefined,
  has_customer_history: true,
  description: "",
  customer_history: ""
};

export function AnalyzeForm() {
  const router = useRouter();
  const { analyze, loading, error } = useAnalyze();
  const [company, setCompany] = useState<CompanyInput>(emptyCompany);
  const [localError, setLocalError] = useState<string | null>(null);

  function update<K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) {
    setCompany((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateCompanyInput(company);
    if (validation) {
      setLocalError(validation);
      return;
    }

    setLocalError(null);
    const run = await analyze({
      ...company,
      website: company.website || undefined,
      customer_history: company.has_customer_history ? company.customer_history : undefined
    });
    router.push(`/results/${run.id}`);
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="flex flex-wrap gap-2">
        {demoProfiles.map((profile) => (
          <Button
            key={profile.key}
            type="button"
            variant="secondary"
            size="sm"
            icon={<Wand2 aria-hidden className="h-4 w-4" />}
            onClick={() => setCompany(profile.company)}
          >
            {profile.label}
          </Button>
        ))}
      </div>

      <ErrorMessage message={localError || error} />

      <FormSection title="Company">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Company name" value={company.name} onChange={(event) => update("name", event.target.value)} />
          <Input
            label="Website"
            value={company.website ?? ""}
            onChange={(event) => update("website", event.target.value)}
          />
          <Input
            label="Industry"
            value={company.industry}
            onChange={(event) => update("industry", event.target.value)}
          />
          <Select
            label="Stage"
            value={company.stage}
            onChange={(event) => update("stage", event.target.value)}
            options={[
              { value: "Pre-seed", label: "Pre-seed" },
              { value: "Seed", label: "Seed" },
              { value: "Series A", label: "Series A" },
              { value: "Series B", label: "Series B" },
              { value: "Growth", label: "Growth" }
            ]}
          />
          <Input
            label="Average contract value"
            type="number"
            min={0}
            value={company.average_contract_value ?? ""}
            onChange={(event) =>
              update(
                "average_contract_value",
                event.target.value ? Number(event.target.value) : undefined
              )
            }
          />
        </div>
        <Textarea
          label="Product and market context"
          value={company.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What the product does, who feels the pain, and what changes when it works."
        />
      </FormSection>

      <FormSection title="Evidence">
        <CompanyModeToggle
          hasHistory={company.has_customer_history}
          onChange={(value) => update("has_customer_history", value)}
        />
        {company.has_customer_history ? (
          <HistoryFields
            value={company.customer_history ?? ""}
            onChange={(value) => update("customer_history", value)}
          />
        ) : (
          <NoHistoryFields />
        )}
      </FormSection>

      <div className="flex justify-end">
        <SubmitAnalysisButton loading={loading} />
      </div>
    </form>
  );
}

