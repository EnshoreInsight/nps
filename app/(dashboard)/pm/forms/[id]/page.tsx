import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ensureProjectAccess, requireRole } from "@/lib/authz";
import { sentimentLabel, sentimentVariant, urgencyLabel } from "@/lib/domain/feedback";
import { prisma } from "@/lib/prisma";

export default async function PmFormDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);

  const submission = await prisma.feedbackSubmission.findUnique({
    where: { id: params.id },
    include: {
      project: true,
      action: true,
    },
  });

  if (!submission) {
    notFound();
  }

  await ensureProjectAccess(submission.projectId, session.user.id, session.user.role);

  const actionRequired = submission.contactRequested === "YES";
  const actionOpen = actionRequired ? submission.action?.status !== "CLOSED" : false;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${submission.project.name} feedback`}
        description="Review the full submitted form, including sentiment, urgency, and action status."
        actions={
          <div className="flex gap-3">
            {submission.action ? (
              <Button asChild>
                <Link href={`/pm/tracker/${submission.action.id}`}>Open linked action</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/pm/forms">Back to forms</Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{submission.project.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted {new Date(submission.submittedAt).toLocaleString()} by {submission.client}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={sentimentVariant(submission.score)}>{sentimentLabel(submission.score)}</Badge>
              <Badge
                variant={
                  submission.urgencyLevel === "LEVEL_1"
                    ? "danger"
                    : submission.urgencyLevel === "LEVEL_3"
                      ? "warning"
                      : "default"
                }
              >
                {urgencyLabel(submission.urgencyLevel)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 rounded-[1.5rem] bg-secondary p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="mt-1 text-2xl font-semibold">{submission.score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Action required</p>
              <p className="mt-1 font-medium">{actionRequired ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Action still open</p>
              <p className="mt-1 font-medium">{actionRequired ? (actionOpen ? "Yes" : "No") : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Linked action status</p>
              <p className="mt-1 font-medium">{submission.action?.status ?? "No action created"}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="mt-2 font-medium">{submission.client}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Package</p>
              <p className="mt-2 font-medium">{submission.packageName}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-2 font-medium">{submission.email}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="mt-2 font-medium">{submission.category}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">Contact requested</p>
              <p className="mt-2 font-medium">{submission.contactRequested}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
              <p className="text-sm text-muted-foreground">SLA due</p>
              <p className="mt-2 font-medium">
                {submission.slaDueAt ? new Date(submission.slaDueAt).toLocaleString() : "No direct-contact SLA"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
            <p className="font-medium">Customer comment</p>
            <p className="mt-2 text-muted-foreground">{submission.comment || "No comment supplied."}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
