"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter, X } from "lucide-react";
import { CustomSelect } from "./CustomSelect";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  filters?: {
    label: string;
    key: keyof T;
    options: { label: string; value: string }[];
  }[];
  actions?: React.ReactNode;
  emptyMessage?: string;
  defaultRowsPerPage?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Cari data...",
  searchableKeys,
  filters,
  actions,
  emptyMessage = "Tidak ada data yang cocok dengan kriteria pencarian.",
  defaultRowsPerPage = 10,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  // 1. Filtering
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Global Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const keysToSearch = searchableKeys || Object.keys(row);
        const matches = keysToSearch.some((key) => {
          const val = row[key as keyof T];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
        if (!matches) return false;
      }

      // Dropdown Filters
      if (filters) {
        for (const f of filters) {
          const activeFilterVal = selectedFilters[String(f.key)];
          if (activeFilterVal && activeFilterVal !== "ALL") {
            if (String(row[f.key]) !== activeFilterVal) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, searchableKeys, filters, selectedFilters]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/50">
        {/* Search Input & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Optional Dropdown Filters using CustomSelect */}
          {filters &&
            filters.map((f) => (
              <div key={String(f.key)} className="min-w-[170px]">
                <CustomSelect
                  size="sm"
                  value={selectedFilters[String(f.key)] || "ALL"}
                  onChange={(val) => handleFilterChange(String(f.key), val)}
                  options={[
                    { label: `Semua ${f.label}`, value: "ALL" },
                    ...f.options,
                  ]}
                />
              </div>
            ))}

          {(searchTerm || Object.values(selectedFilters).some((v) => v !== "ALL" && v)) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Custom Actions Slot (e.g. Add Button) */}
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* Table Container with fluid horizontal scroll */}
      <div className="overflow-x-auto min-h-[240px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`py-3.5 px-4 sm:px-6 ${
                    col.sortable ? "cursor-pointer hover:bg-slate-100/60" : ""
                  } ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left"
                  } ${col.className || ""}`}
                >
                  <div
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === "center"
                        ? "justify-center"
                        : col.align === "right"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        className={`w-3 h-3 ${
                          sortKey === col.key ? "text-sky-600" : "text-slate-300"
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 px-4 sm:px-6 ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      } ${col.className || ""}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400 text-xs sm:text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
        <div className="flex items-center gap-2">
          <span>Menampilkan</span>
          <div className="w-20">
            <CustomSelect
              size="sm"
              value={String(rowsPerPage)}
              onChange={(val) => {
                setRowsPerPage(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { label: "5", value: "5" },
                { label: "10", value: "10" },
                { label: "25", value: "25" },
              ]}
            />
          </div>
          <span>
            dari <strong className="text-slate-800">{sortedData.length}</strong> data
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-800">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
