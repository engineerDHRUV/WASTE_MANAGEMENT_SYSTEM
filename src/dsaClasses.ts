import { LocationNode, BinStatus } from './types';

export class GarbageBin {
  id: string;
  location: string;
  fillLevel: number; // 0 to 100
  capacity: number; // In liters

  constructor(id: string, location: string, fillLevel: number, capacity: number) {
    this.id = id;
    this.location = location;
    this.fillLevel = Math.max(0, Math.min(100, fillLevel));
    this.capacity = capacity;
  }

  isFull(): boolean {
    return this.fillLevel >= 80;
  }

  updateFill(val: number): void {
    this.fillLevel = Math.max(0, Math.min(100, val));
  }

  getStatus(): BinStatus {
    if (this.fillLevel < 40) return 'empty';
    if (this.fillLevel < 80) return 'partial';
    return 'full';
  }
}

export class Truck {
  id: string;
  currentLocation: string;
  assignedRoute: string[] | null;
  status: 'idle' | 'on route';

  constructor(id: string, currentLocation: string) {
    this.id = id;
    this.currentLocation = currentLocation;
    this.assignedRoute = null;
    this.status = 'idle';
  }

  assignRoute(route: string[]): void {
    this.assignedRoute = route;
    if (route && route.length > 0) {
      this.status = 'on route';
    } else {
      this.status = 'idle';
    }
  }

  startCollection(): void {
    if (this.assignedRoute && this.assignedRoute.length > 0) {
      this.status = 'on route';
    }
  }

  getStatus(): 'idle' | 'on route' {
    return this.status;
  }
}

export interface DijkstraStep {
  action: 'INIT' | 'VISIT' | 'RELAX' | 'TARGET_FOUND';
  description: string;
  distances: { [key: string]: number };
  visited: string[];
  current: string | null;
  relaxTarget?: string;
}

export class RouteManager {
  bins: GarbageBin[];
  graph: { [key: string]: { [neighbor: string]: number } };

  constructor(bins: GarbageBin[], graph: { [key: string]: { [neighbor: string]: number } }) {
    this.bins = bins;
    this.graph = graph;
  }

  getFullBins(): GarbageBin[] {
    return this.bins.filter(bin => bin.isFull());
  }

  buildPriorityQueue(): GarbageBin[] {
    // Return all bins sorted by fillLevel descending
    return [...this.bins].sort((a, b) => b.fillLevel - a.fillLevel);
  }

  dijkstra(start: string, end: string): { path: string[]; distance: number; steps: DijkstraStep[] } {
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const unvisited = new Set<string>();
    const steps: DijkstraStep[] = [];

    const nodes = Object.keys(this.graph);
    for (const node of nodes) {
      distances[node] = Infinity;
      previous[node] = null;
      unvisited.add(node);
    }
    distances[start] = 0;

    steps.push({
      action: 'INIT',
      description: `Initialize distances. Set starting location "${start}" distance = 0. All other locations set to infinity (∞).`,
      distances: { ...distances },
      visited: [],
      current: null
    });

    const visitedList: string[] = [];

    while (unvisited.size > 0) {
      // Find unvisited node with min distance
      let current: string | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          current = node;
        }
      }

      if (current === null || minDistance === Infinity) {
        break;
      }

      unvisited.delete(current);
      visitedList.push(current);

      steps.push({
        action: 'VISIT',
        description: `Extract node with lowest tentative distance: "${current}" (${minDistance.toFixed(1)} km) and mark as visited.`,
        distances: { ...distances },
        visited: [...visitedList],
        current
      });

      if (current === end) {
        steps.push({
          action: 'TARGET_FOUND',
          description: `Destination "${end}" reached! Construction of optimal shortest path from "${start}" to "${end}" completed successfully.`,
          distances: { ...distances },
          visited: [...visitedList],
          current
        });
        break;
      }

      const neighbors = this.graph[current];
      for (const neighbor in neighbors) {
        if (unvisited.has(neighbor)) {
          const alternate = distances[current] + neighbors[neighbor];
          if (alternate < distances[neighbor]) {
            distances[neighbor] = alternate;
            previous[neighbor] = current;

            steps.push({
              action: 'RELAX',
              description: `Relaxing path to neighboring node "${neighbor}": Distance via current node "${current}" is ${distances[current].toFixed(1)} + ${neighbors[neighbor].toFixed(1)} = ${alternate.toFixed(1)} km. This is less than previous recorded distance (${distances[neighbor] === Infinity ? '∞' : distances[neighbor].toFixed(1) + ' km'}). Updating path estimate.`,
              distances: { ...distances },
              visited: [...visitedList],
              current,
              relaxTarget: neighbor
            });
          }
        }
      }
    }

    if (distances[end] === Infinity) {
      return { path: [], distance: Infinity, steps };
    }

    const path: string[] = [];
    let curr: string | null = end;
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }

    return { path, distance: distances[end], steps };
  }

  /**
   * Optimize Route:
   * Greedy tour planning across a list of target pins, starting and returning to the base Depot.
   * Compares with a static full-circuit sweep of all nodes (fixed schedule) to show fuel savings.
   */
  optimizeRoute(
    startNode: string,
    targetLocations: string[]
  ): { path: string[]; distance: number; legs: { from: string; to: string; path: string[]; distance: number }[] } {
    if (targetLocations.length === 0) {
      return { path: [startNode], distance: 0, legs: [] };
    }

    // De-duplicate target locations and make sure we don't start/end search on startNode of legs if empty
    let remaining = [...new Set(targetLocations)].filter(loc => loc !== startNode);
    let current = startNode;
    const legs: { from: string; to: string; path: string[]; distance: number }[] = [];
    const overallPath: string[] = [];
    let totalDistance = 0;

    while (remaining.length > 0) {
      let closestLoc: string | null = null;
      let bestPath: string[] = [];
      let minLegDistance = Infinity;

      for (const loc of remaining) {
        const { path, distance } = this.dijkstra(current, loc);
        if (distance < minLegDistance) {
          minLegDistance = distance;
          bestPath = path;
          closestLoc = loc;
        }
      }

      if (!closestLoc) break;

      legs.push({
        from: current,
        to: closestLoc,
        path: bestPath,
        distance: minLegDistance
      });

      totalDistance += minLegDistance;
      remaining = remaining.filter(loc => loc !== closestLoc);
      current = closestLoc;
    }

    // Return trip back to startNode (Depot hub)
    const returnTrip = this.dijkstra(current, startNode);
    legs.push({
      from: current,
      to: startNode,
      path: returnTrip.path,
      distance: returnTrip.distance
    });
    totalDistance += returnTrip.distance;

    // Combine distinct legs into a sequential vertex outline
    for (let i = 0; i < legs.length; i++) {
      const legPath = legs[i].path;
      if (i === 0) {
        overallPath.push(...legPath);
      } else {
        overallPath.push(...legPath.slice(1));
      }
    }

    return {
      path: overallPath,
      distance: totalDistance,
      legs
    };
  }
}

export const CITY_LOCATIONS: { [name: string]: LocationNode } = {
  "Connaught Place": { name: "Connaught Place", x: 50, y: 50, description: "Central commercial circle and primary fleet depot" },
  "MG Road": { name: "MG Road", x: 28, y: 40, description: "High-density lifestyle transit strip with severe peak clogging" },
  "Sector 17": { name: "Sector 17", x: 48, y: 15, description: "Civic center administrative zone and shopping corridors" },
  "Cyber City": { name: "Cyber City", x: 74, y: 30, description: "High-tier commercial technology parks and glass tower offices" },
  "Anand Vihar": { name: "Anand Vihar", x: 18, y: 70, description: "Interstate commuting depot and packed residential blocks" },
  "Rajouri Garden": { name: "Rajouri Garden", x: 15, y: 32, description: "Heavy culinary shopping lanes and residential neighborhoods" },
  "Indiranagar": { name: "Indiranagar", x: 82, y: 65, description: "Cafes, retail complexes, and vibrant suburban residential corridors" },
  "Sardar Patel Marg": { name: "Sardar Patel Marg", x: 55, y: 82, description: "VVIP administrative lanes and highly secures embassy zone" },
};

export const CITY_GRAPH: { [key: string]: { [neighbor: string]: number } } = {
  "Connaught Place": {
    "MG Road": 4.0,
    "Sector 17": 5.5,
    "Cyber City": 4.8,
    "Anand Vihar": 7.2,
    "Indiranagar": 6.2,
    "Sardar Patel Marg": 3.1
  },
  "MG Road": {
    "Sector 17": 5.2,
    "Rajouri Garden": 3.5,
    "Connaught Place": 4.0
  },
  "Sector 17": {
    "MG Road": 5.2,
    "Cyber City": 6.8,
    "Connaught Place": 5.5
  },
  "Cyber City": {
    "Sector 17": 6.8,
    "Connaught Place": 4.8,
    "Indiranagar": 3.9
  },
  "Anand Vihar": {
    "Rajouri Garden": 4.1,
    "Connaught Place": 7.2,
    "Sardar Patel Marg": 6.0
  },
  "Rajouri Garden": {
    "MG Road": 3.5,
    "Anand Vihar": 4.1
  },
  "Indiranagar": {
    "Cyber City": 3.9,
    "Connaught Place": 6.2,
    "Sardar Patel Marg": 5.1
  },
  "Sardar Patel Marg": {
    "Connaught Place": 3.1,
    "Anand Vihar": 6.0,
    "Indiranagar": 5.1
  }
};

export const INITIAL_BINS_DEFS = [
  { id: "BIN-01", location: "Connaught Place", fillLevel: 45, capacity: 120 },
  { id: "BIN-02", location: "MG Road", fillLevel: 85, capacity: 120 },
  { id: "BIN-03", location: "Sector 17", fillLevel: 25, capacity: 150 },
  { id: "BIN-04", location: "Cyber City", fillLevel: 92, capacity: 120 },
  { id: "BIN-05", location: "Anand Vihar", fillLevel: 60, capacity: 200 },
  { id: "BIN-06", location: "Rajouri Garden", fillLevel: 82, capacity: 120 },
  { id: "BIN-07", location: "Indiranagar", fillLevel: 35, capacity: 150 },
  { id: "BIN-08", location: "Sardar Patel Marg", fillLevel: 15, capacity: 120 },
];

export const INITIAL_TRUCKS_DEFS = [
  { id: "TRK-01", currentLocation: "Connaught Place" },
  { id: "TRK-02", currentLocation: "Connaught Place" },
];
