"use client";

import React, { useMemo } from "react";

interface AuthenticQrMatrixProps {
  token: string;
  size?: number;
}

export function AuthenticQrMatrix({ token, size = 220 }: AuthenticQrMatrixProps) {
  // 25x25 QR Matrix Generator
  const matrix = useMemo(() => {
    const N = 25;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // Helper: Draw 7x7 Finder Pattern with 1:1:3:1:1 ratio
    const drawFinder = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startRow + r][startCol + c] = true;
          } else {
            grid[startRow + r][startCol + c] = false;
          }
        }
      }
    };

    // 1. Finder Patterns at 3 corners
    drawFinder(0, 0); // Top-Left
    drawFinder(0, N - 7); // Top-Right
    drawFinder(N - 7, 0); // Bottom-Left

    // 2. Timing Patterns (Row 6 and Column 6 alternating)
    for (let i = 7; i < N - 7; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Alignment Pattern (5x5 at row 16-20, col 16-20)
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isOuter = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[16 + r][16 + c] = isOuter || isCenter;
      }
    }

    // 4. Seeded Data Modules (Deterministic based on token string)
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }

    let seed = Math.abs(hash);
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip Finder areas
        const inTopLeft = r <= 7 && c <= 7;
        const inTopRight = r <= 7 && c >= N - 8;
        const inBottomLeft = r >= N - 8 && c <= 7;
        const inTiming = r === 6 || c === 6;
        const inAlignment = r >= 16 && r <= 20 && c >= 16 && c <= 20;

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inAlignment) {
          grid[r][c] = pseudoRandom() > 0.48;
        }
      }
    }

    return grid;
  }, [token]);

  const moduleSize = size / 25;

  return (
    <div
      style={{ width: size, height: size }}
      className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-md flex items-center justify-center relative select-none"
    >
      <svg
        width={size - 20}
        height={size - 20}
        viewBox="0 0 25 25"
        className="shape-rendering-crisp"
      >
        {matrix.map((row, r) =>
          row.map((isDark, c) => {
            if (!isDark) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill="#0f172a"
              />
            );
          })
        )}
      </svg>

      {/* Central Brand Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 rounded-lg bg-blue-600 border-2 border-white flex items-center justify-center shadow-md">
          <span className="text-[10px] font-mono font-black text-white">PK</span>
        </div>
      </div>
    </div>
  );
}
