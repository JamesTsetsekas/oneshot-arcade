// Aperture Annex tactical data for bots: staging points, routes, holds,
// post-arm positions and utility lineups (validated against the shared
// grenade simulation at load).

import type { UtilityId } from '../content/rules';

export type P2 = [number, number];

export interface Hold {
  pos: P2;
  watch: P2;
}

export interface Lineup {
  site: 'A' | 'B';
  type: UtilityId;
  from: P2;
  target: P2;
  /** filled in by validation */
  yaw?: number;
  pitch?: number;
  lob?: boolean;
  valid?: boolean;
  landing?: [number, number, number];
}

export const TACTICS = {
  sites: {
    A: { center: [-35.5, 6.5] as P2, entries: [[-37.5, -6], [-24.5, 5.5], [-34, 20]] as P2[] },
    B: { center: [34.5, 5.5] as P2, entries: [[33, -6], [24.5, -2], [36, 16.5], [41, -3.5]] as P2[] },
  },
  attack: {
    A: {
      staging: [-38, -19] as P2,
      midStage: [-14, -7] as P2,
      main: [[-24, -31], [-38, -19], [-37.5, -6]] as P2[],
      mid: [[-4, -20], [-6, -7], [-16, -7], [-22, -6], [-22, 4.5], [-26, 5.5]] as P2[],
    },
    B: {
      staging: [33, -19] as P2,
      midStage: [8, -2] as P2,
      main: [[22, -31], [33, -19], [33, -6]] as P2[],
      mid: [[-4, -20], [-1, -6], [9, -2], [18, -2], [25.5, -1]] as P2[],
    },
  },
  holds: {
    A: [
      { pos: [-32.5, 15.5], watch: [-37.5, -4] },
      { pos: [-44, 12], watch: [-37.5, -3] },
      { pos: [-30.5, 7], watch: [-24, 5.5] },
      { pos: [-39, 15], watch: [-37.5, -4] },
    ] as Hold[],
    B: [
      { pos: [39.5, 12.5], watch: [33, -4] },
      { pos: [30.5, 12.5], watch: [24, -2] },
      { pos: [36.5, 1.5], watch: [41, -4] },
      { pos: [35.5, 9], watch: [33, -4] },
    ] as Hold[],
    mid: [
      { pos: [7.5, -12.5], watch: [-4, -16] },
      { pos: [6, 3], watch: [-2, -10] },
      { pos: [-8, -2], watch: [-4, -16] },
    ] as Hold[],
  },
  postPlant: {
    A: [[-33, 15.5], [-27, 6.5], [-38.5, -2.5], [-44, 9]] as P2[],
    B: [[30.5, 12.5], [39, 12.5], [32, -2.5], [27, 1]] as P2[],
  },
  lineups: [
    // smoke the defender fallback/back entrance and the short door when executing A
    { site: 'A', type: 'veil', from: [-37.5, -10], target: [-34, 17] },
    { site: 'A', type: 'veil', from: [-38.5, -12], target: [-27, 7] },
    { site: 'A', type: 'flash', from: [-37.5, -9], target: [-36, 4] },
    // B: smoke back entrance and the glass door
    { site: 'B', type: 'veil', from: [33, -10], target: [36, 15] },
    { site: 'B', type: 'veil', from: [34, -12], target: [29, 11] },
    { site: 'B', type: 'flash', from: [33, -9], target: [34, 3] },
  ] as Lineup[],
};

export type SiteId = 'A' | 'B';
