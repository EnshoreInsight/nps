"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProject, updateProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FORM_INTRO, DEFAULT_FORM_OUTRO } from "@/lib/project-defaults";
import { stringifyOptions } from "@/lib/project-options";

type ProjectFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  client?: string;
  description?: string | null;
  feedbackIntro?: string | null;
  thankYouMessage?: string | null;
  packageOptions?: unknown;
  categoryOptions?: unknown;
};

export function ProjectForm({
  mode = "create",
  project,
}: {
  mode?: "create" | "edit";
  project?: ProjectFormValues;
}) {
  const isEdit = mode === "edit";
  const [state, formAction] = useFormState(isEdit ? updateProject : createProject, undefined);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          {isEdit ? <input type="hidden" name="projectId" value={project?.id} /> : null}
          {state?.error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {state.error}
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project name</label>
            <Input
              name="name"
              placeholder="Project name"
              required
              defaultValue={project?.name ?? ""}
              readOnly={isEdit}
              className={isEdit ? "bg-slate-100 text-slate-500" : undefined}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Public form slug</label>
            <Input
              name="slug"
              placeholder="public-form-slug"
              required
              pattern="[a-z0-9-]+"
              title="Use lowercase letters, numbers, and hyphens only."
              defaultValue={project?.slug ?? ""}
            />
            <p className="text-sm text-muted-foreground">
              This becomes the public form URL. Use lowercase letters, numbers, and hyphens only, for example <code>alpha-grid</code>.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Client name</label>
            <Input name="client" placeholder="Client name" required defaultValue={project?.client ?? ""} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Internal description</label>
            <Textarea name="description" placeholder="Internal project description" defaultValue={project?.description ?? ""} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Intro</label>
            <Textarea
              name="feedbackIntro"
              placeholder="Public form intro copy"
              defaultValue={project?.feedbackIntro ?? DEFAULT_FORM_INTRO}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Form Outro</label>
            <Textarea
              name="thankYouMessage"
              placeholder="Public thank-you copy"
              defaultValue={project?.thankYouMessage ?? DEFAULT_FORM_OUTRO}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Question 2 package options</label>
            <Textarea
              name="packageOptions"
              placeholder="One option per line"
              defaultValue={stringifyOptions(project?.packageOptions)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Question 6 category options</label>
            <Textarea
              name="categoryOptions"
              placeholder="One option per line"
              defaultValue={stringifyOptions(project?.categoryOptions)}
            />
          </div>
          <ProjectSubmitButton isEdit={isEdit} />
        </form>
      </CardContent>
    </Card>
  );
}

function ProjectSubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return <Button type="submit">{pending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save changes" : "Create project"}</Button>;
}
