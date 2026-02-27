export type GameMode = 'classic' | 'time';

export interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
  isRemoving?: boolean;
}

export interface GameState {
  blocks: Block[];
  targetSum: number;
  score: number;
  mode: GameMode;
  isGameOver: boolean;
  timeLeft: number;
  gridRows: number;
  gridCols: number;
}

export const GRID_COLS = 6;
export const GRID_ROWS = 10;
export const INITIAL_ROWS = 4;
export const TIME_LIMIT = 10; // Seconds for Time Mode
