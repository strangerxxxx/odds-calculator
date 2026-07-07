import { useState } from "react";
import type { FloorDigit, ReturnRatePreset } from "../types";

interface Props {
  horseCount: number;
  onHorseCountChange: (n: number) => void;
  floorDigit: FloorDigit;
  onFloorDigitChange: (d: FloorDigit) => void;
  returnRate: number;
  returnRatePreset: ReturnRatePreset;
  onReturnRatePresetChange: (preset: ReturnRatePreset, rate: number) => void;
  plusTen: boolean;
  onPlusTenChange: (v: boolean) => void;
}

const PRESET_OPTIONS: {
  label: string;
  value: ReturnRatePreset;
  rate: number;
}[] = [
  { label: "100.00%", value: 100, rate: 1.0 },
  { label: "90.00%", value: 90, rate: 0.9 },
  { label: "80.00%", value: 80, rate: 0.8 },
  { label: "77.50%", value: 77.5, rate: 0.775 },
  { label: "75.00%", value: 75, rate: 0.75 },
  { label: "72.50%", value: 72.5, rate: 0.725 },
  { label: "70.00%", value: 70, rate: 0.7 },
  { label: "その他", value: "custom", rate: 0 },
];

const HORSE_COUNT_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 2); // 2～29

export default function SettingsPanel({
  horseCount,
  onHorseCountChange,
  floorDigit,
  onFloorDigitChange,
  returnRate,
  returnRatePreset,
  onReturnRatePresetChange,
  plusTen,
  onPlusTenChange,
}: Props) {
  // カスタム払戻率の入力途中の値をローカル状態で保持する。
  // controlled input に直接 returnRate を渡すと、入力中に親が書き換えて
  // カーソルがリセットされる問題を防ぐ。
  const [customRateInput, setCustomRateInput] = useState(() =>
    (returnRate * 100).toFixed(2),
  );

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    if (raw === "custom") {
      // カスタムに切り替えたとき、現在の returnRate をローカル状態に反映
      setCustomRateInput((returnRate * 100).toFixed(2));
      onReturnRatePresetChange("custom", returnRate);
    } else {
      const found = PRESET_OPTIONS.find((o) => String(o.value) === raw);
      if (found && found.value !== "custom") {
        onReturnRatePresetChange(found.value, found.rate);
      }
    }
  };

  const handleCustomRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setCustomRateInput(inputValue);

    // 有効な数値のときだけ親に伝える（入力途中は無視）
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0 && val <= 100) {
      onReturnRatePresetChange("custom", val / 100);
    }
  };

  const handleCustomRateBlur = () => {
    // フォーカスを外したとき、不正な値なら現在の returnRate に戻す
    const val = parseFloat(customRateInput);
    if (isNaN(val) || val <= 0 || val > 100) {
      setCustomRateInput((returnRate * 100).toFixed(2));
    } else {
      setCustomRateInput(val.toFixed(2));
    }
  };

  return (
    <div className="settings-panel">
      <h2>設定</h2>
      <div className="settings-row">
        <label htmlFor="horse-count">出走馬数</label>
        <select
          id="horse-count"
          value={horseCount}
          onChange={(e) => onHorseCountChange(Number(e.target.value))}
        >
          {HORSE_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}頭
            </option>
          ))}
        </select>
      </div>

      <div className="settings-row">
        <label htmlFor="floor-digit">切り捨て桁数</label>
        <select
          id="floor-digit"
          value={floorDigit}
          onChange={(e) =>
            onFloorDigitChange(Number(e.target.value) as FloorDigit)
          }
        >
          {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as FloorDigit[]).map((d) => (
            <option key={d} value={d}>
              {d === 0 ? "整数（小数第0位）" : `小数第${d}位`}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-row">
        <label htmlFor="return-rate">設定払戻率</label>
        <select
          id="return-rate"
          value={String(returnRatePreset)}
          onChange={handlePresetChange}
        >
          {PRESET_OPTIONS.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
        {returnRatePreset === "custom" && (
          <input
            type="number"
            className="custom-rate-input"
            min={0.01}
            max={100}
            step={0.01}
            value={customRateInput}
            onChange={handleCustomRateChange}
            onBlur={handleCustomRateBlur}
            aria-label="払戻率（%）"
          />
        )}
        {returnRatePreset === "custom" && <span className="unit">%</span>}
      </div>

      <div className="settings-row">
        <label htmlFor="plus-ten">プラス10</label>
        <input
          id="plus-ten"
          type="checkbox"
          checked={plusTen}
          onChange={(e) => onPlusTenChange(e.target.checked)}
          aria-label="プラス10"
        />
        <span className="plus-ten-desc">
          オッズが1.1倍未満かつ払戻総額が売得金以内の場合、1.1倍として表示
        </span>
      </div>
    </div>
  );
}
