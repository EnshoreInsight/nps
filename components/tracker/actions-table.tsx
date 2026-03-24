"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sentimentLabel, sentimentVariant, urgencyLabel } from "@/lib/domain/feedback";

type ActionRow = {
  id: string;
  project: string;
  category: string;
  packageName: string;
  score: number;
  status: string;
  urgencyLevel: string;
  slaDueAt: string | null;
  firstResponseAt: string | null;
  closedAt: string | null;
  submittedAt: string;
  isOverdueResponse: boolean;
};

type SortKey =
  | "submittedAt"
  | "project"
  | "category"
  | "sentiment"
  | "urgencyLevel"
  | "status"
  | "slaDueAt"
  | "firstResponseAt"
  | "closedAt";

type SortState = {
  key: SortKey;
  direction: "asc" | "desc";
};

type Filters = {
  submittedAt: string;
  project: string;
  category: string;
  sentiment: string;
  urgencyLevel: string;
  status: string;
  slaDueAt: string;
  firstResponseAt: string;
  closedAt: string;
};

function compareStrings(a: string, b: string, direction: "asc" | "desc") {
  const result = a.localeCompare(b);
  return direction === "asc" ? result : -result;
}

export function ActionsTable({
  actions,
  initialQuery = "",
  initialIncludeClosed = false,
  overdueOnly = false,
}: {
  actions: ActionRow[];
  initialQuery?: string;
  initialIncludeClosed?: boolean;
  overdueOnly?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [includeClosed, setIncludeClosed] = useState(initialIncludeClosed);
  const [filters, setFilters] = useState<Filters>({
    submittedAt: "",
    project: "",
    category: "",
    sentiment: "",
    urgencyLevel: "",
    status: "",
    slaDueAt: "",
    firstResponseAt: "",
    closedAt: "",
  });
  const [sort, setSort] = useState<SortState>({
    key: "project",
    direction: "asc",
  });
  const router = useRouter();

  const filterOptions = useMemo(
    () => ({
      project: [...new Set(actions.map((action) => action.project))].sort((a, b) => a.localeCompare(b)),
      category: [...new Set(actions.map((action) => action.category))].sort((a, b) => a.localeCompare(b)),
      sentiment: ["Promoter", "Passive", "Detractor"],
      urgencyLevel: [...new Set(actions.map((action) => urgencyLabel(action.urgencyLevel as never)))].sort((a, b) => a.localeCompare(b)),
      status: [...new Set(actions.map((action) => action.status))].sort((a, b) => a.localeCompare(b)),
      slaDueAt: ["Overdue", "Due later", "No SLA set"],
      firstResponseAt: ["Pending", "Recorded"],
      closedAt: ["Open", "Closed"],
      submittedAt: [...new Set(actions.map((action) => new Date(action.submittedAt).toLocaleDateString("en-GB")))].sort((a, b) => a.localeCompare(b)),
    }),
    [actions],
  );

  const filteredActions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visibleActions = includeClosed ? actions : actions.filter((action) => action.status !== "CLOSED");
    const overdueActions = overdueOnly
      ? visibleActions.filter((action) => action.isOverdueResponse)
      : visibleActions;

    return overdueActions
      .filter((action) => {
        const searchableText = [
          action.project,
          action.category,
          action.packageName,
          action.status,
          action.urgencyLevel,
          sentimentLabel(action.score),
        ]
          .join(" ")
          .toLowerCase();

        if (normalized && !searchableText.includes(normalized)) {
          return false;
        }

        return (
          (!filters.submittedAt || new Date(action.submittedAt).toLocaleDateString("en-GB") === filters.submittedAt) &&
          (!filters.project || action.project === filters.project) &&
          (!filters.category || action.category === filters.category) &&
          (!filters.sentiment || sentimentLabel(action.score) === filters.sentiment) &&
          (!filters.urgencyLevel || urgencyLabel(action.urgencyLevel as never) === filters.urgencyLevel) &&
          (!filters.status || action.status === filters.status) &&
          (!filters.slaDueAt ||
            (filters.slaDueAt === "Overdue"
              ? action.isOverdueResponse
              : filters.slaDueAt === "Due later"
                ? Boolean(action.slaDueAt) && !action.isOverdueResponse
                : !action.slaDueAt)) &&
          (!filters.firstResponseAt ||
            (filters.firstResponseAt === "Recorded" ? Boolean(action.firstResponseAt) : !action.firstResponseAt)) &&
          (!filters.closedAt ||
            (filters.closedAt === "Closed" ? Boolean(action.closedAt) : !action.closedAt))
        );
      })
      .sort((a, b) => {
        switch (sort.key) {
          case "submittedAt":
            return compareStrings(a.submittedAt, b.submittedAt, sort.direction);
          case "project":
            return compareStrings(a.project, b.project, sort.direction);
          case "category":
            return compareStrings(a.category, b.category, sort.direction);
          case "sentiment":
            return compareStrings(sentimentLabel(a.score), sentimentLabel(b.score), sort.direction);
          case "urgencyLevel":
            return compareStrings(urgencyLabel(a.urgencyLevel as never), urgencyLabel(b.urgencyLevel as never), sort.direction);
          case "status":
            return compareStrings(a.status, b.status, sort.direction);
          case "slaDueAt":
            return compareStrings(a.slaDueAt ?? "", b.slaDueAt ?? "", sort.direction);
          case "firstResponseAt":
            return compareStrings(a.firstResponseAt ?? "", b.firstResponseAt ?? "", sort.direction);
          case "closedAt":
            return compareStrings(a.closedAt ?? "", b.closedAt ?? "", sort.direction);
          default:
            return 0;
        }
      });
  }, [actions, filters, includeClosed, overdueOnly, query, sort]);

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
          placeholder="Search project, category, package, urgency, sentiment, or status"
          className="max-w-xl"
        />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeClosed}
              onChange={(event) => setIncludeClosed(event.target.checked)}
            />
            Include closed actions
          </label>
          <p className="text-sm text-muted-foreground">
            Showing {filteredActions.length} of {actions.length} actions
          </p>
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
                <button type="button" className="font-medium" onClick={() => toggleSort("category")}>
                  Category {sortIndicator("category")}
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
                <button type="button" className="font-medium" onClick={() => toggleSort("status")}>
                  Status {sortIndicator("status")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("slaDueAt")}>
                  SLA due {sortIndicator("slaDueAt")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("firstResponseAt")}>
                  First response {sortIndicator("firstResponseAt")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="font-medium" onClick={() => toggleSort("closedAt")}>
                  Close date {sortIndicator("closedAt")}
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
                  value={filters.category}
                  onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.category.map((option) => (
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
                  value={filters.status}
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.status.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.slaDueAt}
                  onChange={(event) => setFilters((current) => ({ ...current, slaDueAt: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.slaDueAt.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.firstResponseAt}
                  onChange={(event) => setFilters((current) => ({ ...current, firstResponseAt: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.firstResponseAt.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
              <TableHead>
                <select
                  className="h-9 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  value={filters.closedAt}
                  onChange={(event) => setFilters((current) => ({ ...current, closedAt: event.target.value }))}
                >
                  <option value="">All</option>
                  {filterOptions.closedAt.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActions.map((action) => (
              <TableRow key={action.id} className="cursor-pointer" onClick={() => router.push(`/pm/tracker/${action.id}`)}>
                <TableCell>{new Date(action.submittedAt).toLocaleDateString("en-GB")}</TableCell>
                <TableCell className="font-medium">{action.project}</TableCell>
                <TableCell>{action.category}</TableCell>
                <TableCell>
                  <Badge variant={sentimentVariant(action.score)}>{sentimentLabel(action.score)}</Badge>
                </TableCell>
                <TableCell>{urgencyLabel(action.urgencyLevel as never)}</TableCell>
                <TableCell>{action.status}</TableCell>
                <TableCell>
                  {action.slaDueAt ? (
                    <div className="flex flex-col gap-1">
                      <span>{new Date(action.slaDueAt).toLocaleString("en-GB")}</span>
                      {action.isOverdueResponse ? <Badge variant="danger">Overdue</Badge> : null}
                    </div>
                  ) : (
                    "No SLA set"
                  )}
                </TableCell>
                <TableCell>
                  {action.isOverdueResponse && !action.firstResponseAt ? (
                    <Badge variant="danger">Pending response overdue</Badge>
                  ) : action.firstResponseAt ? (
                    new Date(action.firstResponseAt).toLocaleString("en-GB")
                  ) : (
                    "Pending"
                  )}
                </TableCell>
                <TableCell>{action.closedAt ? new Date(action.closedAt).toLocaleString("en-GB") : "Open"}</TableCell>
              </TableRow>
            ))}
            {!filteredActions.length ? (
              <TableRow>
                <TableCell colSpan={9}>No actions match your current filters.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
