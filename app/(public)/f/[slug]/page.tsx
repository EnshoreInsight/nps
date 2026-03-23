import { notFound } from "next/navigation";
import { submitFeedback } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_FORM_INTRO, DEFAULT_FORM_OUTRO } from "@/lib/project-defaults";
import { getProjectOptions } from "@/lib/project-options";
import { prisma } from "@/lib/prisma";

function splitIntoParagraphs(content: string) {
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export default async function PublicFeedbackPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { submitted?: string };
}) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
  });

  if (!project || !project.isActive) {
    notFound();
  }

  const isSubmitted = searchParams.submitted === "1";
  const introParagraphs = splitIntoParagraphs(project.feedbackIntro ?? DEFAULT_FORM_INTRO);
  const packageOptions = getProjectOptions(project.packageOptions, [
    "PLGR",
    "Cable Lay",
    "Cable Burial",
    "Cable Jointing",
    "OSP Pull In",
    "Landfall Pull In",
    "Overall Project Management",
  ]);
  const categoryOptions = getProjectOptions(project.categoryOptions, ["Safety", "Quality", "Delivery", "Service"]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-enshore-pattern px-6 py-12">
      <div className="relative mx-auto max-w-6xl">
        <Card className="w-full overflow-hidden rounded-[2rem] border-white/70 bg-white/95 shadow-[0_20px_60px_rgba(36,88,104,0.18)]">
          <div className="px-8 pb-4 pt-10 md:px-12 md:pt-14">
            <p className="text-5xl font-bold tracking-tight text-[#67bfd0] drop-shadow-[0_4px_10px_rgba(65,169,191,0.45)] md:text-6xl">
              Enshore Insight
            </p>
            <p className="mt-8 text-sm uppercase tracking-[0.2em] text-slate-500">{project.client}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-700 md:text-5xl">
              Your feedback is important to us
            </h1>
            {!isSubmitted ? (
              <div className="mt-8 max-w-4xl space-y-6 text-lg leading-8 text-slate-600">
                {introParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
          </div>
          <CardContent className="px-8 pb-10 pt-2 md:px-12">
          {isSubmitted ? (
            <div className="py-10">
              <p className="text-3xl font-semibold text-slate-800">
                {project.thankYouMessage ?? DEFAULT_FORM_OUTRO}
              </p>
            </div>
          ) : (
            <form action={submitFeedback} className="space-y-10">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
                <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
                  1. Please confirm the client you&apos;re providing feedback on behalf of: <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="client"
                  defaultValue={project.client}
                  required
                  className="h-12 rounded-2xl border-slate-300 bg-white text-base"
                />
              </div>
              <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/75 p-6">
                <label className="block text-xl font-semibold leading-8 text-slate-800 md:text-2xl">
                  2. Please confirm which {project.name} package you&apos;re providing feedback on: <span className="text-rose-500">*</span>
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
                  4. Following your latest interaction with Enshore Subsea, how likely are you to recommend Enshore Subsea&apos;s services? <span className="text-rose-500">*</span>
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
                  7. Would you like an Enshore Subsea representative to contact you to discuss your feedback? <span className="text-rose-500">*</span>
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
                  By pressing submit on this form you are agreeing to the privacy statement from the original survey. Submitted
                  data is used for customer feedback purposes only, and anonymized aggregated satisfaction data may be shared publicly.
                </p>
                <Button type="submit" size="lg" className="rounded-full px-8">
                  Submit feedback
                </Button>
              </div>
            </form>
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
