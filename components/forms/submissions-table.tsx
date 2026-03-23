"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sentimentLabel, sentimentVariant, urgencyLabel } from "@/lib/domain/feedback";

type SubmissionRow = {
  id: string;
  project: string;
  client: string;
  packageName: string;
  email: string;
  score: number;
  comment: string;
  category: string;
  urgencyLevel: string;
  actionRequired: boolean;
  actionOpen: boolean;
  contactRequested: string;
  submittedAt: string;
  slaDueAt: string | null;
  actionStatus: string | null;
  contacted: boolean | null;
  firstResponseAt: string | null;
  contactedAt: string | null;
  closedAt: string | null;
  ownerNotes: string;
};

type SortKey =
  | "submittedAt"
  | "project"
  | "client"
  | "packageName"
  | "sentiment"
  | "urgencyLevel"
  | "actionRequired"
  | "actionOpen";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type Filters = {
  submittedAt: string;
  project: string;
  client: string;
  packageName: string;
  sentiment: string;
  urgencyLevel: string;
  actionRequired: string;
  actionOpen: string;
};

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: SubmissionRow[]) {
  const header = [
    "Response ID",
    "Project",
    "Client",
    "Package",
    "Email",
    "Submitted at",
    "Sentiment",
    "Score",
    "Comment",
    "Category",
    "Urgency",
    "Contact requested",
    "SLA due",
    "Action required",
    "Action open",
    "Action status",
    "Contacted",
    "First response at",
    "Contacted at",
    "Closed at",
    "Owner notes",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.project,
      row.client,
      row.packageName,
      row.email,
      row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "",
      sentimentLabel(row.score),
      String(row.score),
      row.comment,
      row.category,
      urgencyLabel(row.urgencyLevel as never),
      row.contactRequested,
      row.slaDueAt ? new Date(row.slaDueAt).toLocaleString() : "",
      row.actionRequired ? "Yes" : "No",
      row.actionRequired ? (row.actionOpen ? "Yes" : "No") : "-",
      row.actionStatus ?? "",
      row.contacted === null ? "" : row.contacted ? "Yes" : "No",
      row.firstResponseAt ? new Date(row.firstResponseAt).toLocaleString() : "",
      row.contactedAt ? new Date(row.contactedAt).toLocaleString() : "",
      row.closedAt ? new Date(row.closedAt).toLocaleString() : "",
      row.ownerNotes,
    ]
      .map((value) => csvEscape(value))
      .join(","),
  );

  const blob = new Blob([[header.map(csvEscape).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "received-forms.csv";
  link.click();
  window.URL.revokeObjectURL(url);
}

function compareStrings(a: string, b: string, direction: "asc" | "desc") {
  const result = a.localeCompare(b);
  return direction === "asc" ? result : -result;
}

export function SubmissionsTable({
  submissions,
  initialQuery = "",
  actionRequiredOnly = false,
}: {
  submissions: SubmissionRow[];
  initialQuery?: string;
  actionRequiredOnly?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>({
    submittedAt: "",
    project: "",
    client: "",
    packageName: "",
    sentiment: "",
    urgencyLevel: "",
    actionRequired: actionRequiredOnly ? "Yes" : "",
    actionOpen: "",
  });
  const [sort, setSort] = useState<SortState>({
    key: "project",
    direction: "asc",
  });
  const router = useRouter();

  const filterOptions = useMemo(
    () => ({
      project: [...new Set(submissions.map((submission) => submission.project))].sort((a, b) => a.localeCompare(b)),
      client: [...new Set(submissions.map((submission) => submission.client))].sort((a, b) => a.localeCompare(b)),
      packageName: [...new Set(submissions.map((submission) => submission.packageName))].sort((a, b) => a.localeCompare(b)),
      sentiment: ["Promoter", "Passive", "Detractor"],
      urgencyLevel: [...new Set(submissions.map((submission) => urgencyLabel(submission.urgencyLevel as never)))].sort((a, b) => a.localeCompare(b)),
      actionRequired: ["Yes", "No"],
      actionOpen: ["Yes", "No", "-"],
      submittedAt: [...new Set(submissions.map((submission) => new Date(submission.submittedAt).toLocaleDateString()))].sort((a, b) => a.localeCompare(b)),
    }),
    [submissions],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visibleSubmissions = actionRequiredOnly
      ? submissions.filter((submission) => submission.actionRequired)
      : submissions;

    return visibleSubmissions
      .filter((submission) => {
        const searchableText = [
          submission.project,
          submission.client,
          submission.packageName,
          sentimentLabel(submission.score),
          submission.urgencyLevel,
          submission.actionRequired ? "action required" : "no action required",
          submission.actionOpen ? "open" : "closed",
        ]
          .join(" ")
          .toLowerCase();

        if (normalized && !searchableText.includes(normalized)) {
          return false;
        }

        const matchesFilter =
          (!filters.submittedAt || new Date(submission.submittedAt).toLocaleDateString() === filters.submittedAt) &&
          (!filters.project || submission.project === filters.project) &&
          (!filters.client || submission.client === filters.client) &&
          (!filters.packageName || submission.packageName === filters.packageName) &&
          (!filters.sentiment || sentimentLabel(submission.score) === filters.sentiment) &&
          (!filters.urgencyLevel || urgencyLabel(submission.urgencyLevel as never) === filters.urgencyLevel) &&
          (!filters.actionRequired || (submission.actionRequired ? "Yes" : "No") === filters.actionRequired) &&
          (!filters.actionOpen ||
            (submission.actionRequired ? (submission.actionOpen ? "Yes" : "No") : "-") === filters.actionOpen);

        return matchesFilter;
      })
      .sort((a, b) => {
        switch (sort.key) {
          case "submittedAt":
            return compareStrings(a.submittedAt, b.submittedAt, sort.direction);
          case "project":
            return compareStrings(a.project, b.project, sort.direction);
          case "client":
            return compareStrings(a.client, b.client, sort.direction);
          case "packageName":
            return compareStrings(a.packageName, b.packageName, sort.direction);
          case "sentiment":
            return compareStrings(sentimentLabel(a.score), sentimentLabel(b.score), sort.direction);
          case "urgencyLevel":
            return compareStrings(urgencyLabel(a.urgencyLevel as never), urgencyLabel(b.urgencyLevel as never), sort.direction);
          case "actionRequired":
            return compareStrings(a.actionRequired ? "Yes" : "No", b.actionRequired ? "Yes" : "No", sort.direction);
          case "actionOpen":
            return compareStrings(
              a.actionRequired ? (a.actionOpen ? "Yes" : "No") : "-",
              b.actionRequired ? (b.actionOpen ? "Yes" : "No") : "-",
              sort.direction,
            );
          default:
            return 0;
        }
      });
  }, [actionRequiredOnly, filters, query, sort, submissions]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function sortIndicator(key: SortKey) {
    if (sort.key !== key) return "↕";
    return sort.direction === "asc" ? "↑" : "↓";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project, client, package, sentiment, urgency, or action status"
          className="max-w-xl"
        />
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {submissions.length} forms
          </p>
          <Button type="button" variant="outline" onClick={() => downloadCsv(filtered)}>
            Export to Excel
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("submittedAt")}>
                  Date received {sortIndicator("submittedAt")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("project")}>
                  Project {sortIndicator("project")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("client")}>
                  Client {sortIndicator("client")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("packageName")}>
                  Package {sortIndicator("packageName")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("sentiment")}>
                  Sentiment {sortIndicator("sentiment")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("urgencyLevel")}>
                  Urgency {sortIndicator("urgencyLevel")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("actionRequired")}>
                  Action required {sortIndicator("actionRequired")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("actionOpen")}>
                  Action open {sortIndicator("actionOpen")}
                </button>
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.submittedAt}
                  onChange={(event) => setFilters((current) => ({ ...current, submittedAt: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.submittedAt.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.project}
                  onChange={(event) => setFilters((current) => ({ ...current, project: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.project.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.client}
                  onChange={(event) => setFilters((current) => ({ ...current, client: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.client.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.packageName}
                  onChange={(event) => setFilters((current) => ({ ...current, packageName: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.packageName.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.sentiment}
                  onChange={(event) => setFilters((current) => ({ ...current, sentiment: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.sentiment.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.urgencyLevel}
                  onChange={(event) => setFilters((current) => ({ ...current, urgencyLevel: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.urgencyLevel.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.actionRequired}
                  onChange={(event) => setFilters((current) => ({ ...current, actionRequired: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.actionRequired.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.actionOpen}
                  onChange={(event) => setFilters((current) => ({ ...current, actionOpen: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.actionOpen.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((submission) => (
              <TableRow
                key={submission.id}
                className="cursor-pointer"
                onClick={() => router.push(`/pm/forms/${submission.id}`)}
              >
                <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{submission.project}</TableCell>
                <TableCell>{submission.client}</TableCell>
                <TableCell>{submission.packageName}</TableCell>
                <TableCell>
                  <Badge variant={sentimentVariant(submission.score)}>{sentimentLabel(submission.score)}</Badge>
                </TableCell>
                <TableCell>{urgencyLabel(submission.urgencyLevel as never)}</TableCell>
                <TableCell>{submission.actionRequired ? "Yes" : "No"}</TableCell>
                <TableCell>{submission.actionRequired ? (submission.actionOpen ? "Yes" : "No") : "-"}</TableCell>
              </TableRow>
            ))}
            {!filtered.length ? (
              <TableRow>
                <TableCell colSpan={8}>No forms match your current filters.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
