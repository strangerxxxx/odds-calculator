export type FloorDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Horse {
  id: number; // 馬番 (1始まり)
  name: string;
  enabled: boolean; // 有効チェックボックス
  winCheck: boolean; // 単勝チェックボックス
  placeCheck: boolean; // 複勝チェックボックス
  winVotes: number; // 単勝得票数
  placeVotes: number; // 複勝得票数
}

export type ReturnRatePreset = 100 | 90 | 80 | 77.5 | 75 | 72.5 | 70 | "custom";

export interface FrameInfo {
  frameNumber: number; // 1～8
  color: string; // CSS color
  textColor: string; // 文字色 (コントラスト確保)
  label: string; // 枠色の名称
}
