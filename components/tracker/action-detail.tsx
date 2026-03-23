import { updateAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { sentimentLabel, sentimentVariant, urgencyLabel } from "@/lib/domain/feedback";

type ActionDetailProps = {
  action: {
    id: string;
    status: string;
    contacted: boolean;
    contactedAt: Date | null;
    firstResponseAt: Date | null;
    closedAt: Date | null;
    ownerNotes: string | null;
    feedbackSubmission: {
      id: string;
      client: string;
      packageName: string;
      category: string;
      email: string;
      score: number;
      comment: string;
      urgencyLevel: string;
      submittedAt: Date;
      project: {
        name: string;
      };
    };
    auditEntries: Array<{
      id: string;
      field: string;
      fromValue: string | null;
      toValue: string | null;
      createdAt: Date;
      user: {
        name: string;
      };
    }>;
  };
};

export function ActionDetail({ action, saved = false }: ActionDetailProps & { saved?: boolean }) {
  const now = new Date();
  const maxContactedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const updateRows = action.auditEntries.map((entry) => {
    if (entry.field === "notification" && entry.toValue) {
      try {
        const payload = JSON.parse(entry.toValue) as {
          status?: string;
          reason?: string;
          recipients?: number;
        };

        const description =
          payload.status === "SENT"
            ? `Notification email sent to ${payload.recipients ?? 0} recipient(s).`
            : payload.status === "NOT_SENT"
              ? `Notification email not sent: ${payload.reason ?? "No reason provided."}`
              : `Notification email failed: ${payload.reason ?? "No reason provided."}`;

        return {
          id: entry.id,
          date: new Date(entry.createdAt).toLocaleDateString(),
          status: action.status,
          contacted: action.contacted ? "Yes" : "No",
          description,
          updatedBy: entry.user.name,
        };
      } catch {
        return {
          id: entry.id,
          date: new Date(entry.createdAt).toLocaleDateString(),
          status: action.status,
          contacted: action.contacted ? "Yes" : "No",
          description: entry.toValue || "-",
          updatedBy: entry.user.name,
        };
      }
    }

    if (entry.field === "action_update" && entry.toValue) {
      try {
        const payload = JSON.parse(entry.toValue) as {
          status?: string;
          contacted?: boolean;
          contactedAt?: string;
          description?: string;
        };

        return {
          id: entry.id,
          date: payload.contactedAt ? new Date(payload.contactedAt).toLocaleDateString() : new Date(entry.createdAt).toLocaleDateString(),
          status: payload.status ?? "-",
          contacted: payload.contacted ? "Yes" : "No",
          description: payload.description?.trim() ? payload.description : "-",
          updatedBy: entry.user.name,
        };
      } catch {
        return {
          id: entry.id,
          date: new Date(entry.createdAt).toLocaleDateString(),
          status: action.status,
          contacted: action.contacted ? "Yes" : "No",
          description: entry.toValue || "-",
          updatedBy: entry.user.name,
        };
      }
    }

    return {
      id: entry.id,
      date: new Date(entry.createdAt).toLocaleDateString(),
      status: entry.field === "status" ? entry.toValue || action.status : action.status,
      contacted:
        entry.field === "contacted"
          ? entry.toValue === "true"
            ? "Yes"
            : "No"
          : action.contacted
            ? "Yes"
            : "No",
      description:
        entry.field === "ownerNotes"
          ? entry.toValue || "-"
          : `${entry.field.replace(/At$/, " date")} updated`,
      updatedBy: entry.user.name,
    };
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{action.feedbackSubmission.project.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {action.feedbackSubmission.client} • {action.feedbackSubmission.packageName} • Submitted{" "}
                {new Date(action.feedbackSubmission.submittedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={sentimentVariant(action.feedbackSubmission.score)}>
                {sentimentLabel(action.feedbackSubmission.score)}
              </Badge>
              <Badge
                variant={
                  action.feedbackSubmission.urgencyLevel === "LEVEL_1"
                    ? "danger"
                    : action.feedbackSubmission.urgencyLevel === "LEVEL_3"
                      ? "warning"
                      : "default"
                }
              >
                {urgencyLabel(action.feedbackSubmission.urgencyLevel as never)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {saved ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Action update saved.
            </div>
          ) : null}
          <div className="grid gap-4 rounded-[1.5rem] bg-secondary p-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Score</p>
              <p className="mt-1 text-2xl font-semibold">{action.feedbackSubmission.score}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">First response date</p>
              <p className="mt-1 font-medium">{action.firstResponseAt ? new Date(action.firstResponseAt).toLocaleDateString() : "Not yet recorded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Latest response date</p>
              <p className="mt-1 font-medium">{action.contactedAt ? new Date(action.contactedAt).toLocaleDateString() : "Not yet recorded"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Close date</p>
              <p className="mt-1 font-medium">{action.closedAt ? new Date(action.closedAt).toLocaleDateString() : "Still open"}</p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-white p-5">
            <p className="font-medium">Customer comment</p>
            <p className="mt-2 text-muted-foreground">{action.feedbackSubmission.comment || "No comment supplied."}</p>
          </div>

          <form action={updateAction} className="grid gap-4 lg:grid-cols-4">
            <input type="hidden" name="actionId" value={action.id} />
            <input type="hidden" name="returnPath" value={`/pm/tracker/${action.id}`} />
            <select name="status" defaultValue={action.status} className="h-11 rounded-2xl border border-input bg-white px-4 text-sm">
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <select name="contacted" defaultValue={String(action.contacted)} className="h-11 rounded-2xl border border-input bg-white px-4 text-sm">
              <option value="false">Contacted: No</option>
              <option value="true">Contacted: Yes</option>
            </select>
            <Input
              name="contactedAt"
              type="date"
              defaultValue=""
              max={maxContactedAt}
            />
            <Button type="submit">Save update</Button>
            <div className="lg:col-span-4">
              <Textarea
                name="ownerNotes"
                defaultValue=""
                placeholder="Action description"
                className="min-h-[96px]"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action log history</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contacted</TableHead>
                <TableHead>Action description</TableHead>
                <TableHead>Updated by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updateRows.length ? (
                updateRows.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.contacted}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.updatedBy}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No action updates yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
