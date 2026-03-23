import { ContactPreference, type Project, type FeedbackSubmission } from "@prisma/client";

type FeedbackSubmissionWithProject = FeedbackSubmission & {
  project: Pick<Project, "name" | "client" | "slug">;
};

function escapeCsv(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  const escaped = normalized.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function formatUkDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function buildFeedbackExportCsv(submissions: FeedbackSubmissionWithProject[]) {
  const headers = [
    "Project",
    "Client",
    "Submission Date",
    "Customer",
    "Package",
    "Customer Email",
    "Score",
    "Category",
    "Comment",
    "Contact Requested",
    "Urgency Level",
  ];

  const rows = submissions.map((submission) => [
    submission.project.name,
    submission.client,
    formatUkDateTime(submission.submittedAt),
    submission.client,
    submission.packageName,
    submission.email,
    submission.score,
    submission.category,
    submission.comment,
    submission.contactRequested === ContactPreference.YES ? "Yes" : "No",
    submission.urgencyLevel,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsv(value)).join(","))
    .join("\r\n");
}

export function buildFeedbackExportFilename(projectSlug: string, rangeLabel: "full" | "weekly") {
  const dateStamp = new Intl.DateTimeFormat("en-CA").format(new Date());
  return `${projectSlug}-feedback-${rangeLabel}-${dateStamp}.csv`;
}
