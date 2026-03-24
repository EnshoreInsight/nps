import Link from "next/link";
import { ActionVolumeChart } from "@/components/charts/action-volume-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { PackagePerformanceChart } from "@/components/charts/package-performance-chart";
import { PmTrendChart } from "@/components/charts/pm-trend-chart";
import { SentimentBreakdownChart } from "@/components/charts/sentiment-breakdown-chart";
import { DashboardProjectFilter } from "@/components/dashboard/project-filter";
import { RecentCommentsCard } from "@/components/dashboard/recent-comments-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/authz";
import { sentimentLabel, sentimentVariant, urgencyLabel } from "@/lib/domain/feedback";
import { getDashboardData } from "@/lib/data/dashboard";

function npsCardTone(npsTone: string) {
  if (npsTone === "positive") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (npsTone === "negative") return "border-rose-200 bg-rose-50 text-rose-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function averageScoreTone(score: number) {
  if (score >= 8.5) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (score >= 7) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

function overdueTone(count: number) {
  return count > 0 ? "border-rose-200 bg-rose-50 text-rose-900" : "";
}

function KpiTile({
  href,
  label,
  value,
  className = "",
}: {
  href: string;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <Link href={href}>
      <Card className={`h-full transition hover:-translate-y-0.5 hover:shadow-md ${className}`}>
        <CardContent className="flex h-full min-h-32 flex-col justify-between p-6">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-5xl font-semibold leading-none tabular-nums">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { projects?: string; archivedYears?: string; months?: string };
}) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);
  const requestedProjectIds = searchParams?.projects
    ? searchParams.projects.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const archivedYears = searchParams?.archivedYears
    ? searchParams.archivedYears.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const requestedMonths = searchParams?.months
    ? searchParams.months.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const data = await getDashboardData({
    userId: session.user.id,
    role: session.user.role,
    requestedProjectIds,
    archivedYears,
    requestedMonths,
  });
  const visibleProjectCount = data.availableProjects.filter((project) => {
    if (!project.isArchived) return true;
    const archiveYear = project.archivedAt ? String(project.archivedAt.getFullYear()) : "Archived";
    return data.selectedArchivedYears.includes(archiveYear);
  }).length;
  const overdueTrackerHref = (() => {
    const params = new URLSearchParams();
    params.set("overdue", "1");

    if (data.selectedProjectIds.length > 0 && data.selectedProjectIds.length !== visibleProjectCount) {
      params.set("projects", data.selectedProjectIds.join(","));
    }

    if (data.selectedArchivedYears.length) {
      params.set("archivedYears", data.selectedArchivedYears.join(","));
    }

    return `/pm/tracker?${params.toString()}`;
  })();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Track NPS, action exposure, and feedback performance across the projects available to you."
        actions={
          <DashboardProjectFilter
            userId={session.user.id}
            projects={data.availableProjects}
            selectedProjectIds={data.selectedProjectIds}
            selectedArchivedYears={data.selectedArchivedYears}
            archivedProjectGroups={data.archivedProjectGroups}
            availableMonths={data.availableMonths}
            selectedMonths={data.selectedMonths}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-white px-4 py-2 shadow-sm">
          Viewing{" "}
          {data.selectedProjectIds.length === visibleProjectCount
            ? "All projects"
            : data.selectedProjectIds.length === 0
              ? "No projects selected"
              : `${data.selectedProjectIds.length} selected`}
        </span>
        <span className="rounded-full bg-white px-4 py-2 shadow-sm">
          {data.selectedArchivedYears.length ? `Archived years: ${data.selectedArchivedYears.join(", ")}` : "Active projects only"}
        </span>
        <span className="rounded-full bg-white px-4 py-2 shadow-sm">
          {data.availableMonths.length === 0 || data.selectedMonths.length === data.availableMonths.length
            ? "All months"
            : data.selectedMonths.length === 0
              ? "No months selected"
            : data.selectedMonths
                .map((month) => data.availableMonths.find((item) => item.value === month)?.label ?? month)
                .join(", ")}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <KpiTile href="/pm/forms" label="Responses received" value={data.kpis.responsesReceived} />
        <KpiTile href="/dashboard#sentiment-mix" label="NPS" value={data.kpis.nps} className={npsCardTone(data.kpis.npsTone)} />
        <KpiTile href="/pm/tracker" label="Open actions" value={data.kpis.openActions} />
        <KpiTile href={overdueTrackerHref} label="Responses overdue" value={data.kpis.overdueSla} className={overdueTone(data.kpis.overdueSla)} />
        <KpiTile href="/pm/forms?actionRequired=1" label="Contact requested" value={data.kpis.contactRequested} />
        <KpiTile href="/pm/forms" label="Average score" value={data.kpis.averageScore} className={averageScoreTone(data.kpis.averageScore)} />
      </div>

      <RecentCommentsCard comments={data.recentComments} />

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <Card id="sentiment-mix">
          <CardHeader>
            <CardTitle>Sentiment mix</CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentBreakdownChart data={data.sentimentBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {data.categoryData.length ? (
              <CategoryChart data={data.categoryData} height={420} />
            ) : (
              <p className="text-sm text-muted-foreground">No feedback categories available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Package performance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.packagePerformance.length ? (
              <PackagePerformanceChart data={data.packagePerformance} />
            ) : (
              <p className="text-sm text-muted-foreground">No package data available for the selected projects.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>NPS</TableHead>
                  <TableHead>Open actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.projectComparison.length ? (
                  data.projectComparison.map((item) => (
                    <TableRow key={item.projectId}>
                      <TableCell>{item.project}</TableCell>
                      <TableCell>{item.responses}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            item.nps >= 30
                              ? "bg-emerald-100 text-emerald-800"
                              : item.nps >= 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.nps}
                        </span>
                      </TableCell>
                      <TableCell>{item.openActions}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>No project comparison data available yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open actions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>First response</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.openActions.length ? (
                data.openActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <Link href={`/pm/tracker/${action.id}`} className="hover:underline">
                        {action.feedbackSubmission.project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{action.feedbackSubmission.category}</TableCell>
                    <TableCell>
                      <Badge variant={sentimentVariant(action.feedbackSubmission.score)}>
                        {sentimentLabel(action.feedbackSubmission.score)}
                      </Badge>
                    </TableCell>
                    <TableCell>{urgencyLabel(action.feedbackSubmission.urgencyLevel)}</TableCell>
                    <TableCell>
                      {action.firstResponseAt ? new Date(action.firstResponseAt).toLocaleDateString() : "Pending"}
                    </TableCell>
                    <TableCell>{action.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>No open actions for the selected projects.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio trend</CardTitle>
        </CardHeader>
        <CardContent>
          <PmTrendChart data={data.trendData} height={220} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action volume trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.actionVolumeTrend.length ? (
            <ActionVolumeChart data={data.actionVolumeTrend} height={260} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No action opening or closing activity is available for the selected projects and months.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
