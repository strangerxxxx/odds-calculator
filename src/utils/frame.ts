import type { FrameInfo } from "../types";

/** 枠番ごとの色定義 */
const FRAME_COLORS: FrameInfo[] = [
  { frameNumber: 1, color: "#ffffff", textColor: "#333333", label: "白" },
  { frameNumber: 2, color: "#222222", textColor: "#ffffff", label: "黒" },
  { frameNumber: 3, color: "#c62927", textColor: "#ffffff", label: "赤" },
  { frameNumber: 4, color: "#1973cd", textColor: "#ffffff", label: "青" },
  { frameNumber: 5, color: "#ffeb3b", textColor: "#333333", label: "黄" },
  { frameNumber: 6, color: "#2f7d32", textColor: "#ffffff", label: "緑" },
  { frameNumber: 7, color: "#ffa727", textColor: "#333333", label: "橙" },
  { frameNumber: 8, color: "#f8bbd0", textColor: "#333333", label: "桃" },
];

/**
 * 馬番から枠番を求める
 *
 * 8頭以下: 馬番 = 枠番 (1枠に1頭ずつ)
 * 9頭以上:
 *   n = floor(horseCount / 8), k = horseCount % 8
 *   1 ～ (8-k) 枠: n頭ずつ
 *   (8-k+1) ～ 8 枠: (n+1)頭ずつ
 */
export function getFrameNumber(
  horseNumber: number,
  horseCount: number,
): number {
  if (horseCount <= 8) {
    return horseNumber;
  }

  const n = Math.floor(horseCount / 8);
  const k = horseCount % 8;
  // 1枠 ～ (8-k)枠はn頭ずつ → (8-k)*n頭までに割り当て
  const boundary = (8 - k) * n;

  if (horseNumber <= boundary) {
    return Math.ceil(horseNumber / n);
  } else {
    // boundary以降は(n+1)頭ずつ
    const remaining = horseNumber - boundary;
    return 8 - k + Math.ceil(remaining / (n + 1));
  }
}

/**
 * 枠番から FrameInfo を取得する
 */
export function getFrameInfo(frameNumber: number): FrameInfo {
  return FRAME_COLORS[frameNumber - 1];
}

/**
 * 馬番から FrameInfo を直接取得する
 */
export function getFrameInfoByHorse(
  horseNumber: number,
  horseCount: number,
): FrameInfo {
  const frameNumber = getFrameNumber(horseNumber, horseCount);
  return getFrameInfo(frameNumber);
}
