import React, { useState, useCallback, useEffect } from 'react';
import { SheetData, CellData, generateCellId } from '@/lib/types';
import Cell from './Cell';

interface SpreadsheetGridProps {
  sheetData: SheetData;
  onCellUpdate: (cellId: string, data: CellData) => void;
}

const INITIAL_ROWS = 20;
const INITIAL_COLS = 10;

const SpreadsheetGrid: React.FC<SpreadsheetGridProps> = ({
  sheetData,
  onCellUpdate,
}) => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [rows] = useState(INITIAL_ROWS);
  const [cols] = useState(INITIAL_COLS);

  const columnHeaders = React.useMemo(() => {
    return Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
  }, [cols]);

  const handleCellSelect = useCallback((cellId: string) => {
    setSelectedCell(cellId);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;

    const match = selectedCell.match(/^([A-Z])(\d+)$/);
    if (!match) return;

    const currentCol = match[1].charCodeAt(0) - 65;
    const currentRow = parseInt(match[2], 10) - 1;

    let newCol = currentCol;
    let newRow = currentRow;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(rows - 1, currentRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(cols - 1, currentCol + 1);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          newCol = currentCol > 0 ? currentCol - 1 : cols - 1;
          if (currentCol === 0) newRow = Math.max(0, currentRow - 1);
        } else {
          newCol = currentCol < cols - 1 ? currentCol + 1 : 0;
          if (currentCol === cols - 1) newRow = Math.min(rows - 1, currentRow + 1);
        }
        break;
      default:
        return;
    }

    const newCellId = generateCellId(newRow, newCol);
    setSelectedCell(newCellId);
  }, [selectedCell, rows, cols]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="overflow-auto flex-1 bg-card">
      <div className="inline-block min-w-full">
        {/* Header row */}
        <div className="flex sticky top-0 z-10">
          {/* Corner cell */}
          <div className="cell cell-header min-w-[50px] flex-shrink-0 border-t border-l" />
          {/* Column headers */}
          {columnHeaders.map((col) => (
            <div
              key={col}
              className="cell cell-header border-t"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row number */}
            <div className="cell cell-header min-w-[50px] flex-shrink-0 border-l flex items-center justify-center">
              {rowIndex + 1}
            </div>
            {/* Cells */}
            {Array.from({ length: cols }, (_, colIndex) => {
              const cellId = generateCellId(rowIndex, colIndex);
              return (
                <Cell
                  key={cellId}
                  cellId={cellId}
                  row={rowIndex}
                  col={colIndex}
                  data={sheetData[cellId]}
                  sheetData={sheetData}
                  onUpdate={onCellUpdate}
                  isSelected={selectedCell === cellId}
                  onSelect={handleCellSelect}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpreadsheetGrid;
