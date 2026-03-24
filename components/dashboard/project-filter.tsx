"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type ProjectOption = {
  id: string;
  name: string;
  isArchived?: boolean;
};

type ArchivedProjectGroup = {
  year: string;
  projects: ProjectOption[];
};

type MonthOption = {
  value: string;
  label: string;
};

function buildStorageKey(storageNamespace: string, userId: string) {
  return `enshore-insight-${storageNamespace}-projects:${userId}`;
}

function buildArchiveStorageKey(storageNamespace: string, userId: string) {
  return `enshore-insight-${storageNamespace}-archived-years:${userId}`;
}

function buildMonthStorageKey(storageNamespace: string, userId: string) {
  return `enshore-insight-${storageNamespace}-months:${userId}`;
}

export function DashboardProjectFilter({
  userId,
  projects,
  selectedProjectIds,
  selectedArchivedYears,
  archivedProjectGroups,
  availableMonths = [],
  selectedMonths = [],
  storageNamespace = "dashboard",
}: {
  userId: string;
  projects: ProjectOption[];
  selectedProjectIds: string[];
  selectedArchivedYears: string[];
  archivedProjectGroups: ArchivedProjectGroup[];
  availableMonths?: MonthOption[];
  selectedMonths?: string[];
  storageNamespace?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeProjects = useMemo(() => projects.filter((project) => !project.isArchived), [projects]);
  const visibleProjects = useMemo(
    () => [
      ...activeProjects,
      ...archivedProjectGroups
        .filter((group) => selectedArchivedYears.includes(group.year))
        .flatMap((group) => group.projects),
    ],
    [activeProjects, archivedProjectGroups, selectedArchivedYears],
  );
  const visibleProjectIds = visibleProjects.map((project) => project.id);
  const isAllSelected = visibleProjectIds.length > 0 && selectedProjectIds.length === visibleProjectIds.length;
  const isAllMonthsSelected =
    availableMonths.length > 0 && selectedMonths.length === availableMonths.length;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const storageKey = buildStorageKey(storageNamespace, userId);
    const archiveStorageKey = buildArchiveStorageKey(storageNamespace, userId);
    const monthStorageKey = buildMonthStorageKey(storageNamespace, userId);
    const currentProjects = searchParams.get("projects");
    const currentArchivedYears = searchParams.get("archivedYears");
    const currentMonths = searchParams.get("months");

    if (currentArchivedYears) {
      localStorage.setItem(archiveStorageKey, currentArchivedYears);
    } else {
      const savedArchivedYears = localStorage.getItem(archiveStorageKey);
      if (savedArchivedYears) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("archivedYears", savedArchivedYears);
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }
    }

    if (currentMonths) {
      localStorage.setItem(monthStorageKey, currentMonths);
    } else {
      const savedMonths = localStorage.getItem(monthStorageKey);
      if (savedMonths && savedMonths !== "__all__") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("months", savedMonths);
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }

      if (isAllMonthsSelected) {
        localStorage.setItem(monthStorageKey, "__all__");
      }
    }

    if (currentProjects) {
      localStorage.setItem(storageKey, currentProjects);
      return;
    }

    if (isAllSelected) {
      const savedProjects = localStorage.getItem(storageKey);
      if (savedProjects && savedProjects !== "__all__") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("projects", savedProjects);
        router.replace(`${pathname}?${params.toString()}`);
        return;
      }

      localStorage.setItem(storageKey, "__all__");
    }
  }, [isAllMonthsSelected, isAllSelected, pathname, router, searchParams, storageNamespace, userId]);

  function persistSelection(
    nextSelectedIds: string[],
    nextArchivedYears = selectedArchivedYears,
    nextSelectedMonths = selectedMonths,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const storageKey = buildStorageKey(storageNamespace, userId);
    const archiveStorageKey = buildArchiveStorageKey(storageNamespace, userId);
    const monthStorageKey = buildMonthStorageKey(storageNamespace, userId);
    const nextVisibleProjectIds = [
      ...activeProjects.map((project) => project.id),
      ...archivedProjectGroups
        .filter((group) => nextArchivedYears.includes(group.year))
        .flatMap((group) => group.projects.map((project) => project.id)),
    ];

    if (!nextSelectedIds.length) {
      params.set("projects", "__none__");
      localStorage.setItem(storageKey, "__none__");
    } else if (nextSelectedIds.length === nextVisibleProjectIds.length) {
      params.delete("projects");
      localStorage.setItem(storageKey, "__all__");
    } else {
      const value = nextSelectedIds.join(",");
      params.set("projects", value);
      localStorage.setItem(storageKey, value);
    }

    if (nextArchivedYears.length) {
      const yearValue = nextArchivedYears.join(",");
      params.set("archivedYears", yearValue);
      localStorage.setItem(archiveStorageKey, yearValue);
    } else {
      params.delete("archivedYears");
      localStorage.removeItem(archiveStorageKey);
    }

    if (!nextSelectedMonths.length && availableMonths.length) {
      params.set("months", "__none__");
      localStorage.setItem(monthStorageKey, "__none__");
    } else if (!availableMonths.length || nextSelectedMonths.length === availableMonths.length) {
      params.delete("months");
      localStorage.setItem(monthStorageKey, "__all__");
    } else {
      const monthValue = nextSelectedMonths.join(",");
      params.set("months", monthValue);
      localStorage.setItem(monthStorageKey, monthValue);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function toggleProject(projectId: string) {
    const nextSelectedIds = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter((id) => id !== projectId)
      : [...selectedProjectIds, projectId].sort((a, b) => {
          const projectA = projects.find((project) => project.id === a)?.name ?? "";
          const projectB = projects.find((project) => project.id === b)?.name ?? "";
          return projectA.localeCompare(projectB);
        });

    persistSelection(nextSelectedIds);
  }

  function toggleArchivedYear(year: string) {
    const archivedProjectIds = archivedProjectGroups
      .filter((group) => group.year === year)
      .flatMap((group) => group.projects.map((project) => project.id));
    const isAddingYear = !selectedArchivedYears.includes(year);
    const nextArchivedYears = isAddingYear
      ? [...selectedArchivedYears, year].sort((a, b) => Number(b) - Number(a))
      : selectedArchivedYears.filter((item) => item !== year);

    const nextSelectedIds = isAddingYear
      ? [...new Set([...selectedProjectIds, ...archivedProjectIds])].sort((a, b) => {
          const projectA = projects.find((project) => project.id === a)?.name ?? "";
          const projectB = projects.find((project) => project.id === b)?.name ?? "";
          return projectA.localeCompare(projectB);
        })
      : selectedProjectIds.filter((projectId) => !archivedProjectIds.includes(projectId));

    persistSelection(nextSelectedIds, nextArchivedYears);
  }

  function toggleMonth(month: string) {
    const nextSelectedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter((value) => value !== month)
      : [...selectedMonths, month].sort((a, b) => b.localeCompare(a));

    persistSelection(selectedProjectIds, selectedArchivedYears, nextSelectedMonths);
  }

  const triggerLabel = isAllSelected
    ? "All projects"
    : selectedProjectIds.length === 0
      ? "No projects selected"
    : selectedProjectIds.length === 1
      ? projects.find((project) => project.id === selectedProjectIds[0])?.name ?? "1 project"
      : `${selectedProjectIds.length} projects selected`;

  return (
    <div className="relative" ref={containerRef}>
      <Button type="button" variant="outline" className="min-w-72 justify-between" onClick={() => setIsOpen((value) => !value)}>
        <span>{triggerLabel}</span>
        <span className="text-xs text-muted-foreground">{isOpen ? "Close" : "Filter"}</span>
      </Button>
      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-96 rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-xl">
          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => persistSelection(isAllSelected ? [] : visibleProjectIds)}
                className="h-4 w-4"
              />
              All
            </label>

            <div className="space-y-2 border-t border-border/70 pt-3">
              {activeProjects.map((project) => (
                <label key={project.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedProjectIds.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="h-4 w-4"
                  />
                  {project.name}
                </label>
              ))}
            </div>

            {archivedProjectGroups.length ? (
              <div className="space-y-3 border-t border-border/70 pt-3">
                {archivedProjectGroups.map((group) => (
                  <div key={group.year} className="space-y-2">
                    <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedArchivedYears.includes(group.year)}
                        onChange={() => toggleArchivedYear(group.year)}
                        className="h-4 w-4"
                      />
                      Include {group.year} archived projects
                    </label>
                    {selectedArchivedYears.includes(group.year) ? (
                      <div className="space-y-2 pl-4">
                        {group.projects.map((project) => (
                          <label key={project.id} className="flex items-center gap-3 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={selectedProjectIds.includes(project.id)}
                              onChange={() => toggleProject(project.id)}
                              className="h-4 w-4"
                            />
                            {project.name}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {availableMonths.length ? (
              <div className="space-y-3 border-t border-border/70 pt-3">
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isAllMonthsSelected}
                    onChange={() =>
                      persistSelection(
                        selectedProjectIds,
                        selectedArchivedYears,
                        isAllMonthsSelected ? [] : availableMonths.map((month) => month.value),
                      )
                    }
                    className="h-4 w-4"
                  />
                  All months
                </label>
                <div className="space-y-2 pl-1">
                  {availableMonths.map((month) => (
                    <label key={month.value} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month.value)}
                        onChange={() => toggleMonth(month.value)}
                        className="h-4 w-4"
                      />
                      {month.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
