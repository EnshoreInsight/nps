"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveProject, restoreProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectRow = {
  id: string;
  name: string;
  client: string;
  slug: string;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: string | null;
  assignments: Array<{
    id: string;
    assignment: string;
    userName: string;
  }>;
};

export function ProjectsTable({
  projects,
  archived = false,
}: {
  projects: ProjectRow[];
  archived?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);
  const router = useRouter();

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return projects;

    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.client,
        project.slug,
        ...project.assignments.map((assignment) => assignment.userName),
        ...project.assignments.map((assignment) => assignment.assignment),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [projects, query]);

  async function handleCopyPublicUrl(slug: string, projectId: string) {
    const publicUrl = `${window.location.origin}/f/${slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedProjectId(projectId);
      window.setTimeout(() => {
        setCopiedProjectId((current) => (current === projectId ? null : current));
      }, 2000);
    } catch {
      setCopiedProjectId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects, clients, team members, or urgency coverage"
          className="max-w-xl"
        />
        <p className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Public URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Project team</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/projects/${project.id}`)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>{project.client}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-32 justify-center"
                      asChild
                    >
                      <Link
                        href={`/f/${project.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Go to form
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-32 justify-center"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCopyPublicUrl(project.slug, project.id);
                      }}
                    >
                      {copiedProjectId === project.id ? "Copied URL" : "Copy public URL"}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{project.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  {project.assignments.length ? (
                    <div className="space-y-1">
                      {project.assignments.map((assignment) => (
                        <div key={assignment.id}>
                          {assignment.userName}
                          {assignment.assignment ? ` (${assignment.assignment})` : ""}
                        </div>
                      ))}
                    </div>
                  ) : (
                    "No users linked yet"
                  )}
                </TableCell>
                <TableCell>
                  <form
                    action={archived ? restoreProject : archiveProject}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="submit" variant="outline">
                      {archived ? "Restore" : "Archive"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {!filteredProjects.length ? (
              <TableRow>
                <TableCell colSpan={6}>No projects match your search.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
