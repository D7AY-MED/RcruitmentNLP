/**
 * Users page — unified candidates + recruiters (the priority page).
 *
 * Performance:
 * - `useQuery` caches results per (search,type,page) → instant back-navigation,
 *   stale-while-revalidate, request de-dupe.
 * - Server-side pagination (25/page) keeps payloads small and rendering cheap.
 * - Debounced search (350ms). Memoized columns/actions to avoid re-renders.
 * - Skeleton table on first load (no "Loading…" text).
 * - Mutations (create/disable/delete) invalidate the cache then reload.
 */
import React, { useCallback, useMemo, useState } from "react";
import { Users as UsersIcon, Eye, Pencil, Ban, CheckCircle2, Trash2, UserPlus } from "lucide-react";
import { useQuery } from "../hooks/useQuery";
import { useDebounce } from "../hooks/useDebounce";
import * as usersService from "../services/users.service";
import type { UserRow, UserType, Paginated } from "../types";
import {
  Card,
  PageHeader,
  Button,
  SearchInput,
  Select,
  DataTable,
  Avatar,
  Badge,
  StatusBadge,
  ActionsMenu,
  Pagination,
  useConfirm,
} from "../components/ui";
import type { Column } from "../components/ui";
import { CreateUserModal } from "../components/users/CreateUserModal";
import { UserDetailDrawer } from "../components/users/UserDetailDrawer";
import { toast } from "../hooks/useToast";
import { formatDate } from "../lib/format";

const PAGE_SIZE = 25;

export function UsersPage() {
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | UserType>("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<{ type: UserType; id: string } | null>(null);
  const debounced = useDebounce(search);

  // A filter/search change resets to page 1.
  const key = `users:${typeFilter || "all"}:${debounced}:${page}`;
  const { data, loading, validating, error, reload } = useQuery<Paginated<UserRow>>(key, () =>
    usersService.listUsers({
      search: debounced || undefined,
      type: typeFilter || undefined,
      page,
      pageSize: PAGE_SIZE,
    })
  );

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const onSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const onType = useCallback((v: "" | UserType) => {
    setTypeFilter(v);
    setPage(1);
  }, []);

  const refreshAfterMutation = useCallback(() => {
    usersService.invalidateUsers();
    reload();
  }, [reload]);

  const handleDisableToggle = useCallback(
    async (u: UserRow) => {
      const action = u.disabled ? "enable" : "disable";
      const ok = await confirm({
        title: u.disabled ? "Enable user?" : "Disable user?",
        message: u.disabled
          ? `${u.full_name} will be able to sign in again.`
          : `${u.full_name} will be blocked from signing in (their data is kept).`,
        confirmLabel: u.disabled ? "Enable" : "Disable",
        danger: !u.disabled,
      });
      if (!ok) return;
      try {
        if (u.disabled) await usersService.enableUser(u.type, u.id);
        else await usersService.disableUser(u.type, u.id);
        toast.success(`User ${action}d`);
        refreshAfterMutation();
      } catch (e: any) {
        toast.error(e.message || `Failed to ${action} user`);
      }
    },
    [confirm, refreshAfterMutation]
  );

  const handleDelete = useCallback(
    async (u: UserRow) => {
      const ok = await confirm({
        title: "Delete user?",
        message: `This permanently deletes ${u.full_name} and their account. This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
      try {
        await usersService.deleteUser(u.type, u.id);
        toast.success("User deleted");
        refreshAfterMutation();
      } catch (e: any) {
        toast.error(e.message || "Failed to delete user");
      }
    },
    [confirm, refreshAfterMutation]
  );

  const columns: Column<UserRow>[] = useMemo(
    () => [
      {
        header: "User",
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar name={u.full_name} />
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-ink">{u.full_name || "—"}</p>
              <p className="truncate text-xs text-gray-500 dark:text-muted">{u.email}</p>
            </div>
          </div>
        ),
      },
      {
        header: "Type",
        cell: (u) => (
          <Badge tone={u.type === "recruiter" ? "emerald" : "indigo"}>
            {u.type === "recruiter" ? "Recruiter" : "Candidate"}
          </Badge>
        ),
      },
      { header: "Company", cell: (u) => <span className="text-gray-600 dark:text-ink">{u.company_name || "—"}</span> },
      { header: "Status", cell: (u) => <StatusBadge active={!u.disabled} /> },
      { header: "Joined", cell: (u) => <span className="text-gray-500 dark:text-muted">{formatDate(u.created_at)}</span> },
      {
        header: "",
        align: "right",
        width: "56px",
        cell: (u) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionsMenu
              items={[
                { label: "View details", icon: <Eye className="h-4 w-4" />, onClick: () => setSelected({ type: u.type, id: u.id }) },
                { label: "Edit", icon: <Pencil className="h-4 w-4" />, onClick: () => setSelected({ type: u.type, id: u.id }) },
                u.disabled
                  ? { label: "Enable", icon: <CheckCircle2 className="h-4 w-4" />, onClick: () => handleDisableToggle(u) }
                  : { label: "Disable", icon: <Ban className="h-4 w-4" />, onClick: () => handleDisableToggle(u) },
                { label: "Delete", icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => handleDelete(u) },
              ]}
            />
          </div>
        ),
      },
    ],
    [handleDisableToggle, handleDelete]
  );

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage candidates and recruiters across the platform"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4" />
            New user
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-border-brand">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={onSearch} placeholder="Search by name, email or company…" className="sm:max-w-xs" />
            <Select value={typeFilter} onChange={(e) => onType(e.target.value as "" | UserType)} className="sm:w-44">
              <option value="">All types</option>
              <option value="candidate">Candidates</option>
              <option value="recruiter">Recruiters</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-muted">
            {validating && !loading && <span className="text-gray-400 dark:text-muted">Refreshing…</span>}
            <Badge tone="gray">{total} total</Badge>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(u) => `${u.type}:${u.id}`}
          loading={loading}
          error={error}
          onRetry={reload}
          onRowClick={(u) => setSelected({ type: u.type, id: u.id })}
          empty={{
            title: "No users found",
            description: search || typeFilter ? "Try adjusting your search or filters." : "Create your first user to get started.",
            icon: <UsersIcon className="h-6 w-6" />,
            action: (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <UserPlus className="h-4 w-4" />
                New user
              </Button>
            ),
          }}
        />

        {!loading && total > 0 && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        )}
      </Card>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={refreshAfterMutation} />
      <UserDetailDrawer
        open={!!selected}
        userRef={selected}
        onClose={() => setSelected(null)}
        onChanged={refreshAfterMutation}
      />
    </div>
  );
}
