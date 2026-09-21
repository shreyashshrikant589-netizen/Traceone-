import type { ReactNode } from 'react';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';

type DataTableProps<T> = {
  columns: Array<{ key: string; header: string; render?: (row: T) => ReactNode }>;
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
};

export default function DataTable<T>({ columns, rows, loading = false, emptyMessage = 'No records found' }: DataTableProps<T>) {
  if (loading) return <TableSkeleton columns={columns.length} />;
  if (rows.length === 0) return <EmptyState title={emptyMessage} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            {columns.map((column) => (
              <th key={column.key} className="pb-3 pr-4 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-slate-100 last:border-0">
              {columns.map((column) => (
                <td key={`${index}-${column.key}`} className="py-3 pr-4 align-top text-slate-700">
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
