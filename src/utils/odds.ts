import type { Horse, FloorDigit } from "../types";

const TICKET_PRICE = 100; // 1票 = 100円
const PLUS_TEN_THRESHOLD = 1.1; // プラス10の適用閾値

/**
 * 浮動小数点誤差を除去してから切り捨てる
 * 例: 2.3 * 100 = 229.99999... → まず十分な精度で丸めてから floor
 */
export function floorTo(value: number, digit: FloorDigit): number {
  const factor = Math.pow(10, digit);
  // 浮動小数点誤差対策: factor倍した値を一度 round して誤差を除去してから floor
  return Math.floor(Math.round(value * factor * 1e9) / 1e9) / factor;
}

/**
 * 複勝の的中頭数を返す
 * 出走馬数 4以下: 1頭, 5～7: 2頭, 8以上: 3頭
 */
export function placeWinnerCount(horseCount: number): number {
  if (horseCount <= 4) return 1;
  if (horseCount <= 7) return 2;
  return 3;
}

/**
 * 単勝の生のオッズ (切り捨て前・最低1倍保証前) を計算する
 * winnerCount: 実際の勝馬数 (同着時は2以上、通常は1)
 */
function calcWinOddsRaw(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  winnerCount: number,
): number | null {
  if (!horse.enabled || horse.winVotes <= 0) return null;
  const enabledHorses = allHorses.filter((h) => h.enabled);
  const totalPool =
    enabledHorses.reduce((sum, h) => sum + h.winVotes, 0) * TICKET_PRICE;
  const W = horse.winVotes * TICKET_PRICE;
  const D = totalPool - W;
  // 算式: (W + D/P) * R / W
  return ((W + D / winnerCount) * returnRate) / W;
}

/**
 * 単勝オッズを計算する (最低1倍保証・プラス10考慮)
 * @param winnerCount 実際の勝馬数 (同着時は2以上、通常は1)
 * @returns { odds, plusTenApplied }
 */
export function calcWinOdds(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  floorDigit: FloorDigit,
  plusTen: boolean = false,
  winnerCount: number = 1,
): { odds: number; plusTenApplied: boolean } | null {
  const raw = calcWinOddsRaw(horse, allHorses, returnRate, winnerCount);
  if (raw === null) return null;

  // 最低1倍保証
  const clampedRaw = Math.max(1, raw);
  let odds = floorTo(clampedRaw, floorDigit);
  odds = Math.max(1, odds);

  // プラス10: 生オッズ(切り捨て前)が1.1倍未満のとき適用を検討
  let plusTenApplied = false;
  if (plusTen && raw < PLUS_TEN_THRESHOLD) {
    const enabledHorses = allHorses.filter((h) => h.enabled);
    const totalSales =
      enabledHorses.reduce((s, h) => s + h.winVotes, 0) * TICKET_PRICE;
    const W = horse.winVotes * TICKET_PRICE;
    const payoutTotal = PLUS_TEN_THRESHOLD * W;
    if (payoutTotal <= totalSales) {
      odds = PLUS_TEN_THRESHOLD;
      plusTenApplied = true;
    }
  }

  return { odds, plusTenApplied };
}

/**
 * 複勝の生のオッズ (切り捨て前・最低1倍保証前) を計算する
 * checkedPlaceHorses: 実際に的中とみなす馬リスト (同着含む、自馬を含む)
 * P は checkedPlaceHorses.length を使う (同着対応)
 */
function calcPlaceOddsRaw(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  checkedPlaceHorses: Horse[],
): number | null {
  if (!horse.enabled || horse.placeVotes <= 0) return null;

  const enabledHorses = allHorses.filter((h) => h.enabled);

  // 実際の勝馬数 P = チェックされた馬数 (同着考慮)
  const P = checkedPlaceHorses.length;
  if (P === 0) return null;

  const totalPool =
    enabledHorses.reduce((sum, h) => sum + h.placeVotes, 0) * TICKET_PRICE;
  const W = horse.placeVotes * TICKET_PRICE;

  // D = 全有効馬の複勝総額 - チェック馬全員の複勝総額
  const checkedPool =
    checkedPlaceHorses.reduce((s, h) => s + h.placeVotes, 0) * TICKET_PRICE;
  const D = totalPool - checkedPool;

  return ((W + D / P) * returnRate) / W;
}

/**
 * 複勝オッズを計算する (実際の的中馬リスト指定・最低1倍保証・プラス10考慮)
 * @param checkedPlaceHorses 複勝チェックが入っている馬リスト (自馬含む)
 * @returns { odds, plusTenApplied }
 */
export function calcPlaceOdds(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  floorDigit: FloorDigit,
  checkedPlaceHorses: Horse[],
  plusTen: boolean = false,
): { odds: number; plusTenApplied: boolean } | null {
  const raw = calcPlaceOddsRaw(
    horse,
    allHorses,
    returnRate,
    checkedPlaceHorses,
  );
  if (raw === null) return null;

  const clampedRaw = Math.max(1, raw);
  let odds = floorTo(clampedRaw, floorDigit);
  odds = Math.max(1, odds);

  let plusTenApplied = false;
  if (plusTen && raw < PLUS_TEN_THRESHOLD) {
    const enabledHorses = allHorses.filter((h) => h.enabled);
    const totalSales =
      enabledHorses.reduce((s, h) => s + h.placeVotes, 0) * TICKET_PRICE;
    // チェックされた全頭に1.1倍適用したとき総払戻が総売上以下か (同着考慮)
    const allCheckedPayoutTotal = checkedPlaceHorses.reduce(
      (s, h) => s + h.placeVotes * TICKET_PRICE * PLUS_TEN_THRESHOLD,
      0,
    );
    if (allCheckedPayoutTotal <= totalSales) {
      odds = PLUS_TEN_THRESHOLD;
      plusTenApplied = true;
    }
  }

  return { odds, plusTenApplied };
}

/**
 * HorseRow表示用: 複勝オッズの範囲 [min, max] を計算する (チェック状態に依存しない表示用)
 * プラス10・最低1倍保証あり
 */
export function calcPlaceOddsRange(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  floorDigit: FloorDigit,
  plusTen: boolean = false,
): { min: number; max: number; plusTenApplied: boolean } | null {
  if (!horse.enabled || horse.placeVotes <= 0) return null;

  const enabledHorses = allHorses.filter((h) => h.enabled);
  const P = placeWinnerCount(enabledHorses.length);

  const othersVotes = enabledHorses
    .filter((h) => h.id !== horse.id)
    .map((h) => h.placeVotes)
    .sort((a, b) => b - a);

  if (othersVotes.length < P - 1) return null;

  const totalPool =
    enabledHorses.reduce((sum, h) => sum + h.placeVotes, 0) * TICKET_PRICE;
  const W = horse.placeVotes * TICKET_PRICE;

  const applyPlusTenCheck = (
    rawOdds: number,
    othersPoolForCheck: number,
  ): { odds: number; plusTenApplied: boolean } => {
    const clampedRaw = Math.max(1, rawOdds);
    let odds = floorTo(clampedRaw, floorDigit);
    odds = Math.max(1, odds);
    let plusTenApplied = false;
    if (plusTen && rawOdds < PLUS_TEN_THRESHOLD) {
      const totalSales = totalPool;
      const payoutTotal =
        PLUS_TEN_THRESHOLD * W + othersPoolForCheck * PLUS_TEN_THRESHOLD;
      if (payoutTotal <= totalSales) {
        odds = PLUS_TEN_THRESHOLD;
        plusTenApplied = true;
      }
    }
    return { odds, plusTenApplied };
  };

  if (P === 1) {
    const raw = (totalPool * returnRate) / (P * W);
    const result = applyPlusTenCheck(raw, 0);
    return {
      min: result.odds,
      max: result.odds,
      plusTenApplied: result.plusTenApplied,
    };
  }

  // 最小払戻: 他の的中馬が得票数最大 (P-1頭)
  const topPool =
    othersVotes.slice(0, P - 1).reduce((s, v) => s + v, 0) * TICKET_PRICE;
  const D_min = totalPool - W - topPool;
  const rawMin = ((W + D_min / P) * returnRate) / W;
  const resultMin = applyPlusTenCheck(rawMin, topPool);

  // 最大払戻: 他の的中馬が得票数最小 (P-1頭)
  const bottomPool =
    othersVotes.slice(-(P - 1)).reduce((s, v) => s + v, 0) * TICKET_PRICE;
  const D_max = totalPool - W - bottomPool;
  const rawMax = ((W + D_max / P) * returnRate) / W;
  const resultMax = applyPlusTenCheck(rawMax, bottomPool);

  const minOdds = Math.min(resultMin.odds, resultMax.odds);
  const maxOdds = Math.max(resultMin.odds, resultMax.odds);
  const anyPlusTen = resultMin.plusTenApplied || resultMax.plusTenApplied;

  return { min: minOdds, max: maxOdds, plusTenApplied: anyPlusTen };
}

/**
 * 単勝払戻金 (円) を計算する
 * 切り捨て桁数が0～2の場合は整数、3以上の場合は floorDigit-2 桁として払い戻す
 * @param winnerCount 実際の勝馬数 (同着時は2以上、通常は1)
 */
export function calcWinPayout(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  floorDigit: FloorDigit,
  plusTen: boolean = false,
  winnerCount: number = 1,
): { payout: number; plusTenApplied: boolean } | null {
  const result = calcWinOdds(
    horse,
    allHorses,
    returnRate,
    floorDigit,
    plusTen,
    winnerCount,
  );
  if (result === null) return null;
  // 払戻金の桁数: 0～2なら整数、3以上なら floorDigit-2 桁
  const payoutDigit: FloorDigit =
    floorDigit <= 2 ? 0 : (Math.max(0, floorDigit - 2) as FloorDigit);
  return {
    payout: floorTo(result.odds * TICKET_PRICE, payoutDigit),
    plusTenApplied: result.plusTenApplied,
  };
}

/**
 * 複勝払戻金 (円) を計算する (実際の的中馬リスト指定)
 * 切り捨て桁数が0～2の場合は整数、3以上の場合は floorDigit-2 桁として払い戻す
 */
export function calcPlacePayout(
  horse: Horse,
  allHorses: Horse[],
  returnRate: number,
  floorDigit: FloorDigit,
  checkedPlaceHorses: Horse[],
  plusTen: boolean = false,
): { payout: number; plusTenApplied: boolean } | null {
  const result = calcPlaceOdds(
    horse,
    allHorses,
    returnRate,
    floorDigit,
    checkedPlaceHorses,
    plusTen,
  );
  if (result === null) return null;
  // 払戻金の桁数: 0～2なら整数、3以上なら floorDigit-2 桁
  const payoutDigit: FloorDigit =
    floorDigit <= 2 ? 0 : (Math.max(0, floorDigit - 2) as FloorDigit);
  return {
    payout: floorTo(result.odds * TICKET_PRICE, payoutDigit),
    plusTenApplied: result.plusTenApplied,
  };
}
