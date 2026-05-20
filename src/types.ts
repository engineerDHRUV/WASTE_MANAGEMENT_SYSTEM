export interface LocationNode {
  name: string;
  x: number; // 0 to 100 for SVG grids
  y: number; // 0 to 100 for SVG grids
  description: string;
}

export interface Edge {
  source: string;
  target: string;
  distance: number; // Distance in km
}

export type BinStatus = 'empty' | 'partial' | 'full';

export interface LogMessage {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export interface RouteHistoryItem {
  id: string;
  timestamp: string;
  truckId: string;
  path: string[];
  distance: number;
  binsCollectedCount: number;
  fuelSaved: number;
}
