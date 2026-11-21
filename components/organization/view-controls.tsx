"use client";

import type { Pagination } from "@/types/organization-views";
import { Field, inputClass, secondaryClass } from "./ui";

export function ViewFilters({
  search,
  status,
  disabled,
  onSearch,
  onStatus,
}: {
  search: string;
  status?: string;
  disabled?: boolean;
  onSearch: (value: string) => void;
  onStatus?: (value: string) => void;
}) {
  return (
    <fieldset
      disabled={disabled}
      className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px]"
    >
      <Field label="Search">
        <input
          type="search"
          maxLength={200}
          className={inputClass}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by name or details"
        />
      </Field>
      {onStatus && (
        <Field label="Status">
          <select
            className={inputClass}
            value={status}
            onChange={(event) => onStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      )}
    </fieldset>
  );
}

export function ViewPagination({
  pagination,
  disabled,
  onPage,
}: {
  pagination: Pagination;
  disabled?: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <p>
        {pagination.total} records · Page {pagination.page} of{" "}
        {Math.max(1, pagination.totalPages)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={secondaryClass}
          disabled={disabled || pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={secondaryClass}
          disabled={disabled || pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export const viewTableClass = "w-full min-w-[760px] text-left text-sm";
export const viewHeadClass =
  "whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500";
export const viewCellClass = "px-5 py-4 text-slate-600";
export const viewActionClass =
  "rounded-lg px-2 py-2 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:opacity-40";
