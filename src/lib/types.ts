export interface User {
  id: string;
  displayName: string;
  color: string;
  email?: string;
}

export interface Document {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  lastModified: Date;
}

export interface CellData {
  value: string;
  formula?: string;
}

export interface SheetData {
  [cellId: string]: CellData;
}

export interface PresenceData {
  odId: string;
  displayName: string;
  color: string;
  lastSeen: Date;
}

export type WriteStatus = 'idle' | 'saving' | 'saved' | 'error';

export const PRESENCE_COLORS = [
  '#22c55e', // green
  '#f97316', // orange
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#6366f1', // indigo
  '#ef4444', // red
];

export const getRandomColor = (): string => {
  return PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
};

export const generateCellId = (row: number, col: number): string => {
  const colLetter = String.fromCharCode(65 + col);
  return `${colLetter}${row + 1}`;
};

export const parseCellId = (cellId: string): { row: number; col: number } | null => {
  const match = cellId.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const col = match[1].charCodeAt(0) - 65;
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
};
