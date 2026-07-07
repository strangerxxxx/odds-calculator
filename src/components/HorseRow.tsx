import type { Horse, FloorDigit, FrameInfo } from "../types";
import { calcWinOdds, calcPlaceOddsRange } from "../utils/odds";

interface Props {
  horse: Horse;
  allHorses: Horse[];
  frame: FrameInfo;
  returnRate: number;
  floorDigit: FloorDigit;
  plusTen: boolean;
  onUpdate: (updated: Horse) => void;
}

export default function HorseRow({
  horse,
  allHorses,
  frame,
  returnRate,
  floorDigit,
  plusTen,
  onUpdate,
}: Props) {
  const { enabled, winCheck, placeCheck } = horse;

  const handleEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onUpdate({
      ...horse,
      enabled: checked,
      winCheck: checked ? horse.winCheck : false,
      placeCheck: checked ? horse.placeCheck : false,
    });
  };

  const handleWinCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onUpdate({
      ...horse,
      winCheck: checked,
      placeCheck: checked ? true : horse.placeCheck,
    });
  };

  const handlePlaceCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...horse, placeCheck: e.target.checked });
  };

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...horse, name: e.target.value });
  };

  const handleWinVotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    onUpdate({ ...horse, winVotes: val });
  };

  const handlePlaceVotes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    onUpdate({ ...horse, placeVotes: val });
  };

  // オッズ計算
  const winResult = calcWinOdds(
    horse,
    allHorses,
    returnRate,
    floorDigit,
    plusTen,
  );
  const placeRangeResult = calcPlaceOddsRange(
    horse,
    allHorses,
    returnRate,
    floorDigit,
    plusTen,
  );

  const formatOdds = (v: number | null) =>
    v === null ? "—" : v.toFixed(floorDigit);

  const formatPlaceRange = () => {
    if (!enabled) return { text: "—", plusTenApplied: false };
    if (placeRangeResult === null) return { text: "—", plusTenApplied: false };
    const { min, max, plusTenApplied } = placeRangeResult;
    const text =
      min === max
        ? formatOdds(min)
        : `${formatOdds(min)} ～ ${formatOdds(max)}`;
    return { text, plusTenApplied };
  };

  const winOddsText = enabled && winResult ? formatOdds(winResult.odds) : "—";
  const winPlusTen = enabled && winResult ? winResult.plusTenApplied : false;

  const placeInfo = formatPlaceRange();

  // 枠バッジ: 四角形
  const frameBadgeStyle: React.CSSProperties = {
    backgroundColor: frame.color,
    color: frame.textColor,
    border: frame.frameNumber === 1 ? "1px solid #aaa" : "none",
  };

  return (
    <tr className={!enabled ? "row-disabled" : ""}>
      {/* 有効チェックボックス */}
      <td className="col-enabled">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleEnabled}
          aria-label={`${horse.id}番馬 有効`}
        />
      </td>

      {/* 単勝チェックボックス */}
      <td className="col-win-check">
        <input
          type="checkbox"
          checked={winCheck}
          disabled={!enabled}
          onChange={handleWinCheck}
          aria-label={`${horse.id}番馬 単勝`}
        />
      </td>

      {/* 複勝チェックボックス */}
      <td className="col-place-check">
        <input
          type="checkbox"
          checked={placeCheck}
          disabled={!enabled || winCheck}
          onChange={handlePlaceCheck}
          aria-label={`${horse.id}番馬 複勝`}
        />
      </td>

      {/* 枠色 + 馬番 (四角) */}
      <td className="col-frame">
        <span className="frame-badge" style={frameBadgeStyle}>
          {horse.id}
        </span>
      </td>

      {/* 名前 */}
      <td className="col-name">
        <input
          type="text"
          value={horse.name}
          onChange={handleName}
          disabled={!enabled}
          className="name-input"
          aria-label={`${horse.id}番馬 名前`}
        />
      </td>

      {/* 単勝得票数 */}
      <td className="col-votes">
        <input
          type="number"
          min={0}
          value={horse.winVotes}
          onChange={handleWinVotes}
          disabled={!enabled}
          className="votes-input"
          aria-label={`${horse.id}番馬 単勝得票数`}
        />
      </td>

      {/* 複勝得票数 */}
      <td className="col-votes">
        <input
          type="number"
          min={0}
          value={horse.placeVotes}
          onChange={handlePlaceVotes}
          disabled={!enabled}
          className="votes-input"
          aria-label={`${horse.id}番馬 複勝得票数`}
        />
      </td>

      {/* 単勝オッズ: 10倍未満(プラス10除く)は赤太字、10倍以上は黒細字 */}
      <td
        className={
          enabled && winResult
            ? winPlusTen
              ? "col-odds odds-plus-ten"
              : winResult.odds < 10
                ? "col-odds odds-highlight"
                : "col-odds odds-normal"
            : "col-odds odds-normal"
        }
      >
        {winOddsText}
      </td>

      {/* 複勝オッズ: 常に黒細字 */}
      <td className="col-place-odds odds-normal">{placeInfo.text}</td>
    </tr>
  );
}
