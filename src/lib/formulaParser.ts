import { SheetData, parseCellId } from './types';

export const evaluateFormula = (
  formula: string,
  sheetData: SheetData,
  visited: Set<string> = new Set()
): string => {
  if (!formula.startsWith('=')) {
    return formula;
  }

  const expression = formula.substring(1).trim().toUpperCase();

  // Check for SUM function
  const sumMatch = expression.match(/^SUM\(([A-Z]\d+):([A-Z]\d+)\)$/);
  if (sumMatch) {
    return evaluateSum(sumMatch[1], sumMatch[2], sheetData, visited);
  }

  // Handle basic arithmetic: A1+B1, A1-B1, A1*B1, A1/B1
  return evaluateArithmetic(expression, sheetData, visited);
};

const getCellValue = (
  cellId: string,
  sheetData: SheetData,
  visited: Set<string>
): number => {
  if (visited.has(cellId)) {
    return NaN; // Circular reference
  }

  const cellData = sheetData[cellId];
  if (!cellData) return 0;

  let value: string;
  if (cellData.formula) {
    visited.add(cellId);
    value = evaluateFormula(cellData.formula, sheetData, visited);
    visited.delete(cellId);
  } else {
    value = cellData.value;
  }

  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const evaluateSum = (
  startCell: string,
  endCell: string,
  sheetData: SheetData,
  visited: Set<string>
): string => {
  const start = parseCellId(startCell);
  const end = parseCellId(endCell);

  if (!start || !end) return '#REF!';

  let sum = 0;
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
      sum += getCellValue(cellId, sheetData, new Set(visited));
    }
  }

  return sum.toString();
};

const evaluateArithmetic = (
  expression: string,
  sheetData: SheetData,
  visited: Set<string>
): string => {
  // Replace cell references with their values
  let evalExpr = expression;

  // Find all cell references (e.g., A1, B2, etc.)
  const cellRefs = expression.match(/[A-Z]\d+/g) || [];

  for (const ref of cellRefs) {
    const value = getCellValue(ref, sheetData, new Set(visited));
    evalExpr = evalExpr.replace(new RegExp(ref, 'g'), value.toString());
  }

  // Safely evaluate the arithmetic expression
  try {
    // Only allow numbers and basic operators
    if (!/^[\d\s+\-*/().]+$/.test(evalExpr)) {
      return '#ERROR!';
    }
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${evalExpr}`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Number.isInteger(result) ? result.toString() : result.toFixed(2);
    }
    return '#ERROR!';
  } catch {
    return '#ERROR!';
  }
};

export const isFormula = (value: string): boolean => {
  return value.startsWith('=');
};
