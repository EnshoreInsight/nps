"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RecentComment = {
  id: string;
  who: string;
  comment: string;
  submittedAt: string;
  project: string;
};

const PAGE_SIZE = 5;

export function RecentCommentsCard({ comments }: { comments: RecentComment[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(comments.length / PAGE_SIZE));

  const visibleComments = useMemo(() => {
    const start = page * PAGE_SIZE;
    return comments.slice(start, start + PAGE_SIZE);
  }, [comments, page]);

  const canGoPrevious = page > 0;
  const canGoNext = page < pageCount - 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Recent comments</CardTitle>
        {comments.length ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={!canGoPrevious}>
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={!canGoNext}>
              Next
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {visibleComments.length ? (
          <div className="space-y-4">
            {visibleComments.map((entry) => (
              <div key={entry.id} className="rounded-[1.25rem] border border-border/70 bg-slate-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-foreground">{entry.who}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.submittedAt).toLocaleDateString("en-GB")} · {entry.project}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-700">{entry.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No customer comments are available for the current filters.</p>
        )}
      </CardContent>
    </Card>
  );
}
