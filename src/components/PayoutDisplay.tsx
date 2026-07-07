import type { Horse, FloorDigit } from "../types";
import { getFrameInfoByHorse } from "../utils/frame";
import {
  calcWinPayout,
  calcPlacePayout,
  placeWinnerCount,
} from "../utils/odds";

interface Props {
  horses: Horse[];
  returnRate: number;
  floorDigit: FloorDigit;
  plusTen: boolean;
}

export default function PayoutDisplay({
  horses,
  returnRate,
  floorDigit,
  plusTen,
}: Props) {
  const enabledHorses = horses.filter((h) => h.enabled);
  const horseCount = enabledHorses.length;
  // 通常の複勝的中頭数 (見出し表示用)
  const P = placeWinnerCount(horseCount);

  // 単勝チェックが入っている馬
  const winHorses = horses.filter((h) => h.enabled && h.winCheck);
  // 複勝チェックが入っている馬
  const placeHorses = horses.filter((h) => h.enabled && h.placeCheck);

  // 実際の複勝的中頭数 (同着時はチェック数)
  const actualPlaceP = placeHorses.length;

  // 払戻金表示桁数: 0～2なら整数、3以上なら floorDigit-2 桁
  const payoutDisplayDigit = floorDigit <= 2 ? 0 : Math.max(0, floorDigit - 2);

  const formatPayout = (v: number) => {
    return (
      v.toLocaleString("ja-JP", {
        minimumFractionDigits: payoutDisplayDigit,
        maximumFractionDigits: payoutDisplayDigit,
      }) + "円"
    );
  };

  const FrameBadge = ({
    horseId,
    totalCount,
  }: {
    horseId: number;
    totalCount: number;
  }) => {
    const frame = getFrameInfoByHorse(horseId, totalCount);
    return (
      <span
        className="frame-badge"
        style={{
          backgroundColor: frame.color,
          color: frame.textColor,
          border: frame.frameNumber === 1 ? "1px solid #aaa" : "none",
        }}
        title={`${frame.frameNumber}枠・${frame.label}`}
      >
        {horseId}
      </span>
    );
  };

  return (
    <div className="payout-display">
      <h2>払戻金</h2>

      {/* 単勝 */}
      <section className="payout-section">
        <h3>
          単勝
          {winHorses.length > 1 && (
            <span className="payout-sub">（同着 {winHorses.length}頭）</span>
          )}
        </h3>
        {winHorses.length === 0 ? (
          <p className="payout-empty">単勝チェックが入っている馬がいません</p>
        ) : (
          <table className="payout-table">
            <thead>
              <tr>
                <th>枠番</th>
                <th>馬名</th>
                <th>払戻金</th>
              </tr>
            </thead>
            <tbody>
              {winHorses.map((h) => {
                const result = calcWinPayout(
                  h,
                  horses,
                  returnRate,
                  floorDigit,
                  plusTen,
                  winHorses.length, // 同着頭数を渡す
                );
                return (
                  <tr key={h.id}>
                    <td>
                      <FrameBadge horseId={h.id} totalCount={horses.length} />
                    </td>
                    <td>{h.name}</td>
                    <td
                      className={`payout-amount${result?.plusTenApplied ? " payout-plus-ten" : ""}`}
                    >
                      {result !== null ? formatPayout(result.payout) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* 複勝 */}
      <section className="payout-section">
        <h3>
          複勝{" "}
          <span className="payout-sub">
            （的中頭数: {actualPlaceP > 0 ? actualPlaceP : P}頭）
          </span>
        </h3>
        {placeHorses.length === 0 ? (
          <p className="payout-empty">複勝チェックが入っている馬がいません</p>
        ) : (
          <table className="payout-table">
            <thead>
              <tr>
                <th>枠番</th>
                <th>馬名</th>
                <th>払戻金</th>
              </tr>
            </thead>
            <tbody>
              {placeHorses.map((h) => {
                const result = calcPlacePayout(
                  h,
                  horses,
                  returnRate,
                  floorDigit,
                  placeHorses,
                  plusTen,
                );
                return (
                  <tr key={h.id}>
                    <td>
                      <FrameBadge horseId={h.id} totalCount={horses.length} />
                    </td>
                    <td>{h.name}</td>
                    <td
                      className={`payout-amount${result?.plusTenApplied ? " payout-plus-ten" : ""}`}
                    >
                      {result !== null ? formatPayout(result.payout) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
