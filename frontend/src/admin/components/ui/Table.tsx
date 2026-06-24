/**
 * Generic, polished data table.
 *
 * Column-driven so every list page (users, jobs, applications, companies,
 * admins) shares one implementation with consistent styling, hover rows,
 * sticky header, and built-in loading / empty / error states. Generic over the
 * row type; `rowKey` guarantees stable React keys (no duplicate-key warnings).
 */
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState, Skeleton } from "./primitives";
import { Pagination } from "./Pagination";

export interface Column<T> {
  header: React.ReactNode;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Right-align (e.g. the actions column). */
  align?: "left" | "right";
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  empty?: { title: string; description?: string; icon?: React.ReactNode; action?: React.ReactNode };
  /** Number of shimmer rows to show on first load. */
  skeletonRows?: number;
  /** When set, the table paginates client-side at this page size. */
  pageSize?: number;
}

/** Shimmer rows that mirror the real table layout (modern skeleton UI). */
function TableSkeleton<T>({ columns, rows }: { columns: Column<T>[]; rows: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-gray-100 last:border-0">
              {columns.map((col, c) => (
                <td key={c} className="px-4 py-3">
                  {c === 0 ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className={cn("h-3", c % 2 ? "w-16" : "w-24")} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  onRowClick,
  empty,
  skeletonRows = 6,
  pageSize,
}: TableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = pageSize ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;

  // Keep the current page valid as the row set changes (search/filter).
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const visibleRows = useMemo(() => {
    if (!pageSize) return rows;
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageSize, page]);

  if (loading) return <TableSkeleton columns={columns} rows={skeletonRows} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!rows.length) {
    return (
      <EmptyState
        title={empty?.title ?? "Nothing here yet"}
        description={empty?.description}
        icon={empty?.icon}
        action={empty?.action}
      />
    );
  }

  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60">
            {columns.map((col, i) => (
              <th
                key={i}
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500",
                  col.align === "right" ? "text-right" : "text-left"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-gray-100 transition-colors last:border-0",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {columns.map((col, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-4 py-3 text-gray-700",
                    col.align === "right" ? "text-right" : "text-left",
                    col.className
                  )}
                  onClick={
                    // Let an actions column stop row-click propagation itself.
                    undefined
                  }
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {pageSize && rows.length > pageSize && (
      <Pagination page={page} pageSize={pageSize} total={rows.length} onPage={setPage} />
    )}
    </>
  );
}
