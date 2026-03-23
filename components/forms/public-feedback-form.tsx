"use client";

import { useState } from "react";
import { FeedbackSubmitButton } from "@/components/forms/feedback-submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type PublicFeedbackFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  projectId: string;
  projectName: string;
  client: string;
  packageOptions: string[];
  categoryOptions: string[];
};

export function PublicFeedbackForm({
  action,
  projectId,
  projectName,
  client,
  packageOptions,
  categoryOptions,
}: PublicFeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action={action}
      className="space-y-10"
      onSubmitCapture={() => {
        setIsSubmitting(true);
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />

      {isSubmitting ? (
        <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50 px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Submitting</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-800">Submitting your feedback...</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Please wait while we save your response and route the notification. This can take a few seconds, especially
            when email delivery is slow.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              1. Please confirm the client you&apos;re providing feedback on behalf of:{" "}
              <span className="text-rose-500">*</span>
            </label>
            <Input
              name="client"
              defaultValue={client}
              required
              className="h-12 rounded-2xl border-slate-300 bg-white text-base"
            />
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              2. Please confirm which {projectName} package you&apos;re providing feedback on:{" "}
              <span className="text-rose-500">*</span>
            </label>
            <select
              name="packageName"
              className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-base text-slate-700"
              required
            >
              <option value="">Select a package</option>
              {packageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              3. Please provide an email address: <span className="text-rose-500">*</span>
            </label>
            <Input
              name="email"
              type="email"
              placeholder="you@client.com"
              required
              className="h-12 rounded-2xl border-slate-300 bg-white text-base"
            />
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              4. Following your latest interaction with Enshore Subsea, how likely are you to recommend Enshore
              Subsea&apos;s services? <span className="text-rose-500">*</span>
            </label>
            <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
              <div className="grid grid-cols-[repeat(11,minmax(0,1fr))]">
                {Array.from({ length: 11 }, (_, index) => (
                  <label
                    key={index}
                    className="group relative cursor-pointer border-r border-slate-300 last:border-r-0"
                  >
                    <input
                      type="radio"
                      name="score"
                      value={index}
                      className="peer sr-only"
                      required={index === 0}
                    />
                    <span className="flex h-12 items-center justify-center text-lg text-slate-700 transition-colors group-hover:bg-sky-50 peer-checked:bg-sky-100 peer-checked:font-semibold peer-checked:text-sky-800">
                      {index}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Not at all likely</span>
              <span>Extremely likely</span>
            </div>
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              5. Please could you give a quick optional comment to explain your rating above?
            </label>
            <Textarea
              name="comment"
              placeholder="Optional comment"
              className="min-h-32 rounded-2xl border-slate-300 bg-white text-base"
            />
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              6. Which category does your feedback mostly align with? <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              className="flex h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-base text-slate-700"
              required
            >
              <option value="">Select a category</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
            <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
              7. Would you like an Enshore Subsea representative to contact you to discuss your feedback?{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-700">
                <input type="radio" name="contactRequested" value="YES" required className="h-4 w-4" />
                Yes
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-base text-slate-700">
                <input type="radio" name="contactRequested" value="NO" required className="h-4 w-4" />
                No
              </label>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <p className="mb-5 text-sm leading-6 text-slate-500">
              By pressing submit on this form you are agreeing to the privacy statement from the original survey.
              Submitted data is used for customer feedback purposes only, and anonymized aggregated satisfaction data may
              be shared publicly.
            </p>
            <FeedbackSubmitButton />
          </div>
        </>
      )}
    </form>
  );
}
