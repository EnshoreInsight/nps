import { notFound } from "next/navigation";
import { submitFeedback } from "@/app/actions";
import { PublicFeedbackForm } from "@/components/forms/public-feedback-form";
import { Card, CardContent } from "@/components/ui/card";
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
            <PublicFeedbackForm
              action={submitFeedback}
              projectId={project.id}
              projectName={project.name}
              client={project.client}
              packageOptions={packageOptions}
              categoryOptions={categoryOptions}
            />
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
