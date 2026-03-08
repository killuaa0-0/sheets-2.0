import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { SheetData, CellData, generateCellId } from '@/lib/types';
import { evaluateFormula, isFormula } from '@/lib/formulaParser';

interface CellProps {
  cellId: string;
  row: number;
  col: number;
  data: CellData | undefined;
  sheetData: SheetData;
  onUpdate: (cellId: string, data: CellData) => void;
  isSelected: boolean;
  onSelect: (cellId: string) => void;
}

const Cell: React.FC<CellProps> = memo(({
  cellId,
  data,
  sheetData,
  onUpdate,
  isSelected,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = React.useMemo(() => {
    if (!data) return '';
    if (data.formula) {
      return evaluateFormula(data.formula, sheetData);
    }
    return data.value;
  }, [data, sheetData]);

  const handleClick = useCallback(() => {
    onSelect(cellId);
  }, [cellId, onSelect]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(data?.formula || data?.value || '');
  }, [data]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== (data?.formula || data?.value || '')) {
      const newData: CellData = isFormula(editValue)
        ? { value: '', formula: editValue }
        : { value: editValue };
      onUpdate(cellId, newData);
    }
  }, [cellId, data, editValue, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  }, [handleBlur]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={`cell flex items-center cursor-cell ${
        isSelected ? 'ring-2 ring-cell-selected ring-inset bg-cell-selected-bg' : ''
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent outline-none text-sm"
        />
      ) : (
        <span className="truncate">{displayValue}</span>
      )}
    </div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
