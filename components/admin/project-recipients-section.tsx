import { createRecipient, removeRecipient, updateRecipient } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectRecipient = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  receivesL1: boolean;
  receivesL2: boolean;
  receivesL3: boolean;
  receivesL4: boolean;
};

export function ProjectRecipientsSection({
  projectId,
  users,
  recipients,
}: {
  projectId?: string;
  users: Array<{ id: string; name: string; email: string }>;
  recipients: ProjectRecipient[];
}) {
  const linkedUserIds = new Set(recipients.map((recipient) => recipient.userId).filter(Boolean));
  const availableUsers = users.filter((user) => !linkedUserIds.has(user.id));

  if (!projectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project access and notifications</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create the project first, then reopen it to add the people who should receive feedback notifications.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
          <CardTitle>Project access and notifications</CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Urgency levels</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.length ? (
                recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell className="align-top font-medium">{recipient.name}</TableCell>
                    <TableCell className="align-top">{recipient.email}</TableCell>
                    <TableCell className="align-top">
                      <form id={`recipient-levels-${recipient.id}`} action={updateRecipient}>
                        <input type="hidden" name="recipientId" value={recipient.id} />
                        <input type="hidden" name="projectId" value={projectId} />
                        <div className="grid gap-y-3 sm:grid-cols-2 sm:gap-x-6">
                          {([
                            ["receivesL1", "Level 1", recipient.receivesL1],
                            ["receivesL2", "Level 2", recipient.receivesL2],
                            ["receivesL3", "Level 3", recipient.receivesL3],
                            ["receivesL4", "Level 4", recipient.receivesL4],
                          ] as const).map(([field, label, checked]) => (
                            <label key={field} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name={field} defaultChecked={Boolean(checked)} />
                              {label}
                            </label>
                          ))}
                        </div>
                      </form>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-col gap-3">
                        <Button type="submit" variant="outline" className="w-32" form={`recipient-levels-${recipient.id}`}>
                          Save levels
                        </Button>
                        <form action={removeRecipient}>
                          <input type="hidden" name="recipientId" value={recipient.id} />
                          <input type="hidden" name="projectId" value={projectId} />
                          <Button type="submit" variant="outline" className="w-32">
                            Remove
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>No notification recipients configured yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <form action={createRecipient} className="space-y-4 rounded-[1.5rem] bg-secondary p-5">
          <input type="hidden" name="projectId" value={projectId} />
          <select name="userId" className="h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm" required>
            <option value="">{availableUsers.length ? "Select user" : "All users already linked"}</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["receivesL1", "Receives Level 1", "Score 0-6", "Contact Requested", true],
              ["receivesL2", "Receives Level 2", "Score 0-6", "No Contact Requested", true],
              ["receivesL3", "Receives Level 3", "Score 7-10", "Contact Requested", true],
              ["receivesL4", "Receives Level 4", "Score 7-10", "No Contact Requested", false],
            ] as const).map(([field, title, scoreText, contactText, defaultChecked]) => (
              <label key={field} className="space-y-2 rounded-2xl bg-white px-4 py-3 text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <input type="checkbox" name={field} defaultChecked={defaultChecked} />
                  {title}
                </span>
                <span className="block pl-6 text-muted-foreground">{scoreText}</span>
                <span className="block pl-6 text-muted-foreground">{contactText}</span>
              </label>
            ))}
          </div>
          <Button type="submit">Add recipient</Button>
        </form>
      </CardContent>
    </Card>
  );
}
