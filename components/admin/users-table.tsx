"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveUser, restoreUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isCore: boolean;
  projectAccess: string[];
};

export function UsersTable({
  users,
  archived = false,
}: {
  users: UserRow[];
  archived?: boolean;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, ...user.projectAccess].join(" ").toLowerCase().includes(normalized),
    );
  }, [users, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users, roles, or project access"
          className="max-w-xl"
        />
        <p className="text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>
      <div className="overflow-x-auto rounded-[1.5rem] border border-border/80 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Project access</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                className={archived ? "" : "cursor-pointer"}
                onClick={archived ? undefined : () => router.push(`/admin/users/${user.id}`)}
              >
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.projectAccess.length ? (
                    <div className="space-y-1">
                      {user.projectAccess.map((projectName) => (
                        <div key={projectName}>{projectName}</div>
                      ))}
                    </div>
                  ) : (
                    "No project access"
                  )}
                </TableCell>
                <TableCell>
                  {!archived && user.isCore ? (
                    <span className="text-sm text-muted-foreground">Protected</span>
                  ) : (
                    <form
                      action={archived ? restoreUser : archiveUser}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <Button type="submit" variant="outline">
                        {archived ? "Restore" : "Archive"}
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={5}>No users match your search.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
