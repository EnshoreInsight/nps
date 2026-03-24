import { format, getYear } from "date-fns";
import { FeedbackActionStatus, Prisma, UrgencyLevel } from "@prisma/client";
import { calculateNps } from "@/lib/domain/feedback";
import { prisma } from "@/lib/prisma";

type AccessibleProject = {
  id: string;
  name: string;
  client: string;
  isArchived: boolean;
  archivedAt: Date | null;
};

function buildAccessibleProjectWhere(userId: string, role: string, includeArchived: boolean): Prisma.ProjectWhereInput {
  const archiveState = includeArchived ? {} : { isArchived: false };

  if (role === "ADMIN") {
    return archiveState;
  }

  return {
    ...archiveState,
    OR: [
      {
        emailRecipients: {
          some: {
            userId,
          },
        },
      },
      {
        assignments: {
          some: {
            userId,
          },
        },
      },
    ],
  };
}

function buildSubmissionWhere(projectIds: string[]): Prisma.FeedbackSubmissionWhereInput {
  if (!projectIds.length) {
    return {
      projectId: "__none__",
    };
  }

  return {
    projectId: {
      in: projectIds,
    },
  };
}

function buildArchivedProjectGroups(accessibleProjects: AccessibleProject[]) {
  return Object.values(
    accessibleProjects
      .filter((project) => project.isArchived)
      .reduce<Record<string, { year: string; projects: AccessibleProject[] }>>((acc, project) => {
        const year = project.archivedAt ? String(getYear(project.archivedAt)) : "Archived";
        if (!acc[year]) {
          acc[year] = { year, projects: [] };
        }
        acc[year].projects.push(project);
        return acc;
      }, {}),
  )
    .map((group) => ({
      year: group.year,
      projects: group.projects.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => Number(b.year) - Number(a.year));
}

export async function getAccessibleProjects(userId: string, role: string) {
  const accessibleProjects: AccessibleProject[] = await prisma.project.findMany({
    where: buildAccessibleProjectWhere(userId, role, true),
    select: {
      id: true,
      name: true,
      client: true,
      isArchived: true,
      archivedAt: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    availableProjects: accessibleProjects,
    archivedProjectGroups: buildArchivedProjectGroups(accessibleProjects),
  };
}

export function resolveSelectedProjectIds({
  availableProjects,
  requestedProjectIds = [],
  archivedYears = [],
}: {
  availableProjects: AccessibleProject[];
  requestedProjectIds?: string[];
  archivedYears?: string[];
}) {
  const filteredProjectIds = availableProjects
    .filter((project) => {
      if (!project.isArchived) return true;
      const archiveYear = project.archivedAt ? String(getYear(project.archivedAt)) : "Archived";
      return archivedYears.includes(archiveYear);
    })
    .map((project) => project.id);

  if (requestedProjectIds.includes("__none__")) {
    return {
      selectedProjectIds: [],
      selectedArchivedYears: archivedYears,
    };
  }

  const validRequestedProjectIds = requestedProjectIds.filter((projectId) =>
    filteredProjectIds.includes(projectId),
  );

  return {
    selectedProjectIds: validRequestedProjectIds.length ? validRequestedProjectIds : filteredProjectIds,
    selectedArchivedYears: archivedYears,
  };
}

function npsTone(nps: number) {
  if (nps >= 30) return "positive";
  if (nps >= 0) return "neutral";
  return "negative";
}

function getMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function getMonthLabel(date: Date) {
  return format(date, "MMMM yyyy");
}

const COMMENT_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "have",
  "from",
  "your",
  "they",
  "them",
  "their",
  "were",
  "been",
  "very",
  "just",
  "into",
  "than",
  "then",
  "there",
  "would",
  "could",
  "should",
  "about",
  "because",
  "service",
  "services",
  "enshore",
  "subsea",
  "project",
  "team",
  "good",
  "great",
  "really",
  "more",
  "most",
  "some",
  "much",
  "well",
  "also",
  "only",
  "like",
  "when",
  "what",
  "which",
  "will",
  "need",
  "needs",
  "been",
  "our",
  "out",
  "all",
  "can",
  "too",
  "had",
  "got",
  "get",
  "did",
  "was",
  "are",
  "not",
  "but",
  "you",
]);

function buildCommentCloud(comments: string[]) {
  const counts = new Map<string, number>();

  comments.forEach((comment) => {
    comment
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && !COMMENT_STOP_WORDS.has(word))
      .forEach((word) => {
        counts.set(word, (counts.get(word) ?? 0) + 1);
      });
  });

  const rankedWords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 24);

  const maxCount = rankedWords[0]?.[1] ?? 1;

  return rankedWords.map(([text, count]) => ({
    text,
    count,
    weight: Math.max(1, Math.round((count / maxCount) * 5)),
  }));
}

export async function getDashboardData({
  userId,
  role,
  requestedProjectIds,
  archivedYears = [],
  requestedMonths = [],
}: {
  userId: string;
  role: string;
  requestedProjectIds?: string[];
  archivedYears?: string[];
  requestedMonths?: string[];
}) {
  const { availableProjects: accessibleProjects, archivedProjectGroups } = await getAccessibleProjects(userId, role);
  const { selectedProjectIds, selectedArchivedYears } = resolveSelectedProjectIds({
    availableProjects: accessibleProjects,
    requestedProjectIds,
    archivedYears,
  });
  const submissionWhere = buildSubmissionWhere(selectedProjectIds);

  const submissions = await prisma.feedbackSubmission.findMany({
    where: submissionWhere,
    include: {
      project: true,
      action: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const availableMonths = Array.from(
    submissions.reduce<Map<string, { value: string; label: string }>>((acc, submission) => {
      const value = getMonthKey(submission.submittedAt);
      if (!acc.has(value)) {
        acc.set(value, {
          value,
          label: getMonthLabel(submission.submittedAt),
        });
      }
      return acc;
    }, new Map()),
  )
    .map(([, item]) => item)
    .sort((a, b) => b.value.localeCompare(a.value));

  const validRequestedMonths = requestedMonths.filter((month) =>
    availableMonths.some((availableMonth) => availableMonth.value === month),
  );
  const selectedMonths = requestedMonths.includes("__none__")
    ? []
    : validRequestedMonths.length
    ? validRequestedMonths
    : availableMonths.map((month) => month.value);

  const filteredSubmissions = submissions.filter((submission) =>
    selectedMonths.includes(getMonthKey(submission.submittedAt)),
  );

  const totalScores = filteredSubmissions.map((submission) => submission.score);
  const nps = calculateNps(totalScores);
  const averageScore = totalScores.length
    ? Number((totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length).toFixed(1))
    : 0;

  const projectComparison = Object.values(
    filteredSubmissions.reduce<
      Record<
        string,
        {
          projectId: string;
          project: string;
          scores: number[];
          openActions: number;
          responses: number;
          promoters: number;
          passives: number;
          detractors: number;
        }
      >
    >((acc, submission) => {
      const key = submission.projectId;
      if (!acc[key]) {
        acc[key] = {
          projectId: submission.projectId,
          project: submission.project.name,
          scores: [],
          openActions: 0,
          responses: 0,
          promoters: 0,
          passives: 0,
          detractors: 0,
        };
      }

      acc[key].scores.push(submission.score);
      acc[key].responses += 1;

      if (submission.score >= 9) acc[key].promoters += 1;
      else if (submission.score >= 7) acc[key].passives += 1;
      else acc[key].detractors += 1;

      if (submission.action && submission.action.status !== FeedbackActionStatus.CLOSED) {
        acc[key].openActions += 1;
      }

      return acc;
    }, {}),
  )
    .map((item) => ({
      projectId: item.projectId,
      project: item.project,
      responses: item.responses,
      nps: calculateNps(item.scores),
      openActions: item.openActions,
      promoters: item.promoters,
      passives: item.passives,
      detractors: item.detractors,
    }))
    .sort((a, b) => a.project.localeCompare(b.project));

  const categoryData = Object.values(
    filteredSubmissions.reduce<Record<string, { name: string; value: number }>>((acc, submission) => {
      if (!acc[submission.category]) {
        acc[submission.category] = { name: submission.category, value: 0 };
      }
      acc[submission.category].value += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  const packagePerformance = Object.values(
    filteredSubmissions.reduce<
      Record<string, { packageName: string; totalScore: number; responses: number }>
    >((acc, submission) => {
      if (!acc[submission.packageName]) {
        acc[submission.packageName] = {
          packageName: submission.packageName,
          totalScore: 0,
          responses: 0,
        };
      }

      acc[submission.packageName].totalScore += submission.score;
      acc[submission.packageName].responses += 1;
      return acc;
    }, {}),
  )
    .map((item) => ({
      packageName: item.packageName,
      averageScore: Number((item.totalScore / item.responses).toFixed(1)),
      responses: item.responses,
    }))
    .sort((a, b) => a.packageName.localeCompare(b.packageName));

  const openActions = filteredSubmissions
    .filter(
      (submission) => submission.action && submission.action.status !== FeedbackActionStatus.CLOSED,
    )
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
    .map((submission) => ({
      id: submission.action!.id,
      firstResponseAt: submission.action!.firstResponseAt,
      status: submission.action!.status,
      feedbackSubmission: {
        category: submission.category,
        score: submission.score,
        urgencyLevel: submission.urgencyLevel as UrgencyLevel,
        project: {
          name: submission.project.name,
        },
      },
    }))
    .slice(0, 12);

  const trendData = Object.values(
    filteredSubmissions.reduce<
      Record<string, { dayKey: string; label: string; submissions: number; totalScore: number }>
    >((acc, submission) => {
      const dayKey = format(submission.submittedAt, "yyyy-MM-dd");
      if (!acc[dayKey]) {
        acc[dayKey] = {
          dayKey,
          label: format(submission.submittedAt, "dd MMM"),
          submissions: 0,
          totalScore: 0,
        };
      }

      acc[dayKey].submissions += 1;
      acc[dayKey].totalScore += submission.score;
      return acc;
    }, {}),
  )
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .map((item) => ({
      label: item.label,
      submissions: item.submissions,
      averageScore: Number((item.totalScore / item.submissions).toFixed(1)),
    }));

  const actionVolumeTrend = Object.values(
    filteredSubmissions.reduce<
      Record<string, { dayKey: string; label: string; opened: number; closed: number }>
    >((acc, submission) => {
      if (submission.action) {
        const openedDayKey = format(submission.action.createdAt, "yyyy-MM-dd");
        if (!acc[openedDayKey]) {
          acc[openedDayKey] = {
            dayKey: openedDayKey,
            label: format(submission.action.createdAt, "dd MMM"),
            opened: 0,
            closed: 0,
          };
        }
        acc[openedDayKey].opened += 1;

        if (submission.action.closedAt) {
          const closedDayKey = format(submission.action.closedAt, "yyyy-MM-dd");
          if (!acc[closedDayKey]) {
            acc[closedDayKey] = {
              dayKey: closedDayKey,
              label: format(submission.action.closedAt, "dd MMM"),
              opened: 0,
              closed: 0,
            };
          }
          acc[closedDayKey].closed += 1;
        }
      }

      return acc;
    }, {}),
  )
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .reduce<Array<{ label: string; opened: number; closed: number; backlog: number }>>(
      (acc, item) => {
        const previousBacklog = acc[acc.length - 1]?.backlog ?? 0;
        const backlog = Math.max(0, previousBacklog + item.opened - item.closed);

        acc.push({
          label: item.label,
          opened: item.opened,
          closed: item.closed,
          backlog,
        });

        return acc;
      },
      [],
    );

  return {
    availableProjects: accessibleProjects,
    archivedProjectGroups,
    selectedProjectIds,
    selectedArchivedYears,
    availableMonths,
    selectedMonths,
    selectedProjectNames: accessibleProjects
      .filter((project) => selectedProjectIds.includes(project.id))
      .map((project) => project.name),
    kpis: {
      responsesReceived: filteredSubmissions.length,
      nps,
      npsTone: npsTone(nps),
      openActions: filteredSubmissions.filter(
        (submission) => submission.action?.status !== FeedbackActionStatus.CLOSED,
      ).length,
      overdueSla: filteredSubmissions.filter(
        (submission) =>
          submission.slaDueAt &&
          submission.slaDueAt < new Date() &&
          submission.action?.status !== FeedbackActionStatus.CLOSED,
      ).length,
      contactRequested: filteredSubmissions.filter(
        (submission) => submission.contactRequested === "YES",
      ).length,
      averageScore,
    },
    sentimentBreakdown: [
      {
        name: "Promoters",
        value: filteredSubmissions.filter((submission) => submission.score >= 9).length,
      },
      {
        name: "Passives",
        value: filteredSubmissions.filter(
          (submission) => submission.score >= 7 && submission.score <= 8,
        ).length,
      },
      {
        name: "Detractors",
        value: filteredSubmissions.filter((submission) => submission.score <= 6).length,
      },
    ],
    categoryData,
    packagePerformance,
    recentComments: filteredSubmissions
      .filter((submission) => submission.comment.trim().length > 0)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .map((submission) => ({
        id: submission.id,
        who: submission.client,
        comment: submission.comment,
        submittedAt: submission.submittedAt.toISOString(),
        project: submission.project.name,
      })),
    commentCloud: buildCommentCloud(
      filteredSubmissions
        .map((submission) => submission.comment)
        .filter((comment) => comment.trim().length > 0),
    ),
    projectComparison,
    trendData,
    actionVolumeTrend,
    openActions,
  };
}
