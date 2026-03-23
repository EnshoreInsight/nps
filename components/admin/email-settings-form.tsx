"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateEmailSettings } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FeedbackEmailTemplateContext,
  getFeedbackEmailPreviewContexts,
  renderFeedbackEmail,
  renderFeedbackEmailSubject,
} from "@/lib/email/template";

type EmailSettingsFormProps = {
  initialValues: {
    subjectTemplate: string;
    bannerUrl: string;
    trackerBannerUrl: string;
    templateHtml: string;
  };
};

export function EmailSettingsForm({ initialValues }: EmailSettingsFormProps) {
  const [state, formAction] = useFormState(updateEmailSettings, undefined);
  const [subjectTemplate, setSubjectTemplate] = useState(initialValues.subjectTemplate);
  const [bannerUrl, setBannerUrl] = useState(initialValues.bannerUrl);
  const [trackerBannerUrl, setTrackerBannerUrl] = useState(initialValues.trackerBannerUrl);
  const [templateHtml, setTemplateHtml] = useState(initialValues.templateHtml);
  const [previewIndex, setPreviewIndex] = useState(0);

  const previewContexts = useMemo(
    () =>
      getFeedbackEmailPreviewContexts().map((context) => ({
        ...context,
        bannerUrl,
        trackerBannerUrl,
      })),
    [bannerUrl, trackerBannerUrl],
  );

  const preview = previewContexts[previewIndex] as FeedbackEmailTemplateContext;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_480px]">
      <Card>
        <CardHeader>
          <CardTitle>Shared email settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            {state?.error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {state.error}
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email title</label>
              <Input
                name="subjectTemplate"
                value={subjectTemplate}
                onChange={(event) => setSubjectTemplate(event.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Keep <code>{"{{project name}}"}</code> at the start. You can also use <code>{"{{urgency subject}}"}</code> and <code>{"{{urgency level}}"}</code>.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Top banner image URL</label>
              <Input
                name="bannerUrl"
                value={bannerUrl}
                onChange={(event) => setBannerUrl(event.target.value)}
                required
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tracker banner image URL</label>
              <Input
                name="trackerBannerUrl"
                value={trackerBannerUrl}
                onChange={(event) => setTrackerBannerUrl(event.target.value)}
                required
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">HTML email template</label>
              <Textarea
                name="templateHtml"
                value={templateHtml}
                onChange={(event) => setTemplateHtml(event.target.value)}
                className="min-h-[32rem] font-mono text-xs leading-6"
                required
              />
              <p className="text-sm text-muted-foreground">
                Supported placeholders include <code>{"{{project name}}"}</code>, <code>{"{{response id}}"}</code>, <code>{"{{submitted at}}"}</code>, <code>{"{{client}}"}</code>, <code>{"{{package}}"}</code>, <code>{"{{email}}"}</code>, <code>{"{{score}}"}</code>, <code>{"{{comment}}"}</code>, <code>{"{{category}}"}</code>, <code>{"{{contact requested}}"}</code>, <code>{"{{urgency level}}"}</code>, <code>{"{{urgency subject}}"}</code>, <code>{"{{urgency summary}}"}</code>, <code>{"{{urgency action}}"}</code>, <code>{"{{sla due}}"}</code>, <code>{"{{tracker link}}"}</code>, <code>{"{{banner}}"}</code>, <code>{"{{tracker banner}}"}</code>, and <code>{"{{urgency table}}"}</code>.
              </p>
            </div>
            <EmailSettingsSubmitButton />
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {previewContexts.map((context, index) => (
                <button
                  key={context.urgencyLevel}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    previewIndex === index
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-border bg-white text-muted-foreground"
                  }`}
                >
                  {context.urgencyLevel.replace("_", " ").replace("_", " ")}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border/80 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Subject</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {renderFeedbackEmailSubject(subjectTemplate, preview)}
              </p>
            </div>
            <div className="max-h-[60rem] overflow-auto rounded-2xl border border-border/80 bg-white shadow-sm">
              <div
                className="min-h-[28rem]"
                dangerouslySetInnerHTML={{
                  __html: renderFeedbackEmail(templateHtml, preview),
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmailSettingsSubmitButton() {
  const { pending } = useFormStatus();

  return <Button type="submit">{pending ? "Saving..." : "Save email settings"}</Button>;
}
