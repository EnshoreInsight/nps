import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildFeedbackExportCsv, buildFeedbackExportFilename } from "@/lib/exports/feedback-export";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      client: true,
      slug: true,
      feedbackSubmissions: {
        orderBy: {
          submittedAt: "asc",
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const csv = buildFeedbackExportCsv(
    project.feedbackSubmissions.map((submission) => ({
      ...submission,
      project: {
        name: project.name,
        client: project.client,
        slug: project.slug,
      },
    })),
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFeedbackExportFilename(project.slug, "full")}"`,
      "Cache-Control": "no-store",
    },
  });
}
