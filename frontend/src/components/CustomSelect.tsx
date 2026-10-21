"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  direction?: "up" | "down";
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  className = "",
  size = "md",
  direction = "down",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl text-left text-slate-800 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs ${
          size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs sm:text-sm"
        } ${isOpen ? "ring-2 ring-sky-500 border-sky-500" : "hover:border-slate-300"}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-sky-600" : ""
          }`}
        />
      </button>

      {/* Floating Options Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-[100] w-full min-w-[160px] bg-white border border-slate-200 rounded-2xl shadow-2xl py-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-sky-50 text-sky-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
