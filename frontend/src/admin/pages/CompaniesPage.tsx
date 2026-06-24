/**
 * Companies page — derived from hr_profiles. Card grid with search; click a card
 * to open the detail drawer (recruiters, jobs, editable company profile).
 */
import React, { useState } from "react";
import { Building2, Users, Briefcase, Globe, Search } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import * as companiesService from "../services/companies.service";
import { invalidate } from "../services/cache";
import type { Company } from "../types";
import {
  Card, PageHeader, SearchInput, Badge, LoadingState, ErrorState, EmptyState,
} from "../components/ui";
import { CompanyDetailDrawer } from "../components/companies/CompanyDetailDrawer";
import { displayValue } from "../lib/format";

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const debounced = useDebounce(search);

  const { data, loading, error, reload } = useQuery<Company[]>(
    `companies:${debounced}`,
    () => companiesService.listCompanies(debounced || undefined)
  );
  const companies = data ?? [];

  const refreshAfterMutation = () => {
    invalidate("companies:");
    reload();
  };

  return (
    <div>
      <PageHeader title="Companies" subtitle="Organisations derived from recruiter profiles" />

      <div className="mb-5 max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="Search companies…" />
      </div>

      {loading ? (
        <Card><LoadingState /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !companies.length ? (
        <Card>
          <EmptyState
            title="No companies found"
            description={search ? "Try a different search term." : "Companies appear automatically when recruiters register."}
            icon={<Building2 className="h-6 w-6" />}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelected(c.key)}
              className="group text-left"
            >
              <Card className="h-full p-5 transition-all hover:border-indigo-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900 group-hover:text-indigo-700">
                      {c.company_name}
                    </h3>
                    <p className="truncate text-xs text-gray-500">{displayValue(c.company_industry)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Badge tone="emerald"><Users className="h-3 w-3" />{c.recruiters}</Badge>
                  <Badge tone="amber"><Briefcase className="h-3 w-3" />{c.jobs} jobs</Badge>
                  {c.company_size && <Badge tone="gray">{c.company_size}</Badge>}
                </div>

                {c.company_website && (
                  <p className="mt-3 flex items-center gap-1.5 truncate text-xs text-gray-400">
                    <Globe className="h-3.5 w-3.5" />
                    {c.company_website}
                  </p>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}

      <CompanyDetailDrawer
        open={!!selected}
        companyKey={selected}
        onClose={() => setSelected(null)}
        onChanged={refreshAfterMutation}
      />
    </div>
  );
}
