import { useState, useCallback, useEffect } from "react";
import type { Horse, FloorDigit, ReturnRatePreset } from "./types";
import { getFrameInfoByHorse } from "./utils/frame";
import SettingsPanel from "./components/SettingsPanel";
import HorseRow from "./components/HorseRow";
import PayoutDisplay from "./components/PayoutDisplay";
import "./App.css";

const DEFAULT_HORSE_COUNT = 8;
const DEFAULT_FLOOR_DIGIT: FloorDigit = 1;
const DEFAULT_RETURN_RATE = 0.8;
const DEFAULT_RETURN_RATE_PRESET: ReturnRatePreset = 80;
const STORAGE_KEY = "odds-calculator-state";

function createHorse(id: number): Horse {
  return {
    id,
    name: `${id}`,
    enabled: true,
    winCheck: false,
    placeCheck: false,
    winVotes: 0,
    placeVotes: 0,
  };
}

function initHorses(count: number): Horse[] {
  return Array.from({ length: count }, (_, i) => createHorse(i + 1));
}

interface SavedState {
  floorDigit: FloorDigit;
  returnRate: number;
  returnRatePreset: ReturnRatePreset;
  plusTen: boolean;
  horses: Horse[];
}

function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage が使えない環境では無視
  }
}

export default function App() {
  // horses が single source of truth。horseCount は horses.length から派生させる。
  const [horses, setHorses] = useState<Horse[]>(() => {
    const saved = loadState();
    if (saved?.horses && saved.horses.length > 0) return saved.horses;
    return initHorses(DEFAULT_HORSE_COUNT);
  });

  const [floorDigit, setFloorDigit] = useState<FloorDigit>(() => {
    const saved = loadState();
    return saved?.floorDigit ?? DEFAULT_FLOOR_DIGIT;
  });
  const [returnRate, setReturnRate] = useState(() => {
    const saved = loadState();
    return saved?.returnRate ?? DEFAULT_RETURN_RATE;
  });
  const [returnRatePreset, setReturnRatePreset] = useState<ReturnRatePreset>(
    () => {
      const saved = loadState();
      return saved?.returnRatePreset ?? DEFAULT_RETURN_RATE_PRESET;
    },
  );
  const [plusTen, setPlusTen] = useState(() => {
    const saved = loadState();
    return saved?.plusTen ?? false;
  });

  // horseCount は horses.length から派生 (状態の二重管理を防ぐ)
  const horseCount = horses.length;

  // 状態が変わるたびに localStorage に保存
  useEffect(() => {
    saveState({
      floorDigit,
      returnRate,
      returnRatePreset,
      plusTen,
      horses,
    });
  }, [floorDigit, returnRate, returnRatePreset, plusTen, horses]);

  // 出走馬数が変わったとき: 増減分だけ追加・削除、既存は保持
  const handleHorseCountChange = useCallback((n: number) => {
    setHorses((prev) => {
      if (n === prev.length) return prev;
      if (n > prev.length) {
        const added = Array.from({ length: n - prev.length }, (_, i) =>
          createHorse(prev.length + i + 1),
        );
        return [...prev, ...added];
      }
      return prev.slice(0, n);
    });
  }, []);

  const handleHorseUpdate = useCallback((updated: Horse) => {
    setHorses((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  }, []);

  const handleReturnRatePresetChange = useCallback(
    (preset: ReturnRatePreset, rate: number) => {
      setReturnRatePreset(preset);
      setReturnRate(rate);
    },
    [],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>馬券オッズ計算ツール</h1>
      </header>

      <main className="app-main">
        <SettingsPanel
          horseCount={horseCount}
          onHorseCountChange={handleHorseCountChange}
          floorDigit={floorDigit}
          onFloorDigitChange={setFloorDigit}
          returnRate={returnRate}
          returnRatePreset={returnRatePreset}
          onReturnRatePresetChange={handleReturnRatePresetChange}
          plusTen={plusTen}
          onPlusTenChange={setPlusTen}
        />

        <section className="horse-list-section">
          <h2>出走馬一覧</h2>
          <div className="table-wrapper">
            <table className="horse-table">
              <thead>
                <tr>
                  <th className="col-enabled" title="有効">
                    有効
                  </th>
                  <th className="col-win-check" title="単勝チェック">
                    単
                  </th>
                  <th className="col-place-check" title="複勝チェック">
                    複
                  </th>
                  <th className="col-frame">枠</th>
                  <th className="col-name">馬名</th>
                  <th className="col-votes">単勝得票数</th>
                  <th className="col-votes">複勝得票数</th>
                  <th className="col-odds">単勝オッズ</th>
                  <th className="col-place-odds">
                    複勝オッズ <span className="th-sub">(範囲)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {horses.map((horse) => {
                  const frame = getFrameInfoByHorse(horse.id, horseCount);
                  return (
                    <HorseRow
                      key={horse.id}
                      horse={horse}
                      allHorses={horses}
                      frame={frame}
                      returnRate={returnRate}
                      floorDigit={floorDigit}
                      plusTen={plusTen}
                      onUpdate={handleHorseUpdate}
                    />
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="total-label">
                    合計得票数
                  </td>
                  <td className="col-votes total-value">
                    {horses
                      .filter((h) => h.enabled)
                      .reduce((s, h) => s + h.winVotes, 0)
                      .toLocaleString()}
                  </td>
                  <td className="col-votes total-value">
                    {horses
                      .filter((h) => h.enabled)
                      .reduce((s, h) => s + h.placeVotes, 0)
                      .toLocaleString()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <PayoutDisplay
          horses={horses}
          returnRate={returnRate}
          floorDigit={floorDigit}
          plusTen={plusTen}
        />
      </main>
    </div>
  );
}
