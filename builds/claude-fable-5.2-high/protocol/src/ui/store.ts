// Minimal external store bridging the game loop and the React shell (menus, buy menu, scoreboard, results).
import type { HistoryEntry, Settings } from '../client/settings';
import type { MatchSummary, RosterEntry, Side } from '../protocol/types';

export interface BuyView {
  money: number;
  side: Side;
  timeLeft: number;
  canBuy: boolean;
  phase: string;
  refundable: string[];
  primary: string;
  sidearm: string;
  armor: number;
  helmet: boolean;
  kit: boolean;
  util: string[];
  mates: RosterEntry[];
  nextMin: number;
  infinite: boolean;
}

export interface BoardView {
  roster: RosterEntry[];
  score: [number, number];
  sides: [Side, Side];
  round: number;
  myTeam: number;
  myId: number;
  mode: string;
}

export interface UiState {
  screen: 'loading' | 'menu' | 'game' | 'error';
  loadingText: string;
  error: string;
  overlay: '' | 'buy' | 'pause' | 'result';
  scoreboard: boolean;
  needClick: boolean;
  buy: BuyView | null;
  buyMsg: string;
  board: BoardView | null;
  summary: MatchSummary | null;
  settings: Settings;
  history: HistoryEntry[];
}

type Listener = () => void;

export class UiStore {
  private listeners = new Set<Listener>();
  constructor(public state: UiState) {}
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  get = (): UiState => this.state;
  set(patch: Partial<UiState>): void {
    let changed = false;
    for (const k in patch) {
      if ((this.state as unknown as Record<string, unknown>)[k] !== (patch as Record<string, unknown>)[k]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }
}
