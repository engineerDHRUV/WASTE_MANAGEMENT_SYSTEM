import { motion } from 'motion/react';
import { CITY_LOCATIONS, CITY_GRAPH, GarbageBin, Truck } from '../dsaClasses';

interface CityMapProps {
  bins: GarbageBin[];
  activeRoutePath: string[] | null;
  trucks: Truck[];
  highlightNode?: string | null;
  highlightPath?: string[] | null;
  relaxTargetNode?: string | null;
  onNodeClick?: (nodeName: string) => void;
}

export default function CityMap({
  bins,
  activeRoutePath,
  trucks,
  highlightNode = null,
  highlightPath = null,
  relaxTargetNode = null,
  onNodeClick
}: CityMapProps) {
  
  // Extract unique edges for routing visualization
  const edges: { source: string; target: string; dist: number }[] = [];
  const seenEdges = new Set<string>();

  Object.entries(CITY_GRAPH).forEach(([source, neighbors]) => {
    Object.entries(neighbors).forEach(([target, dist]) => {
      const edgeKey = [source, target].sort().join('-');
      if (!seenEdges.has(edgeKey)) {
        seenEdges.add(edgeKey);
        edges.push({ source, target, dist });
      }
    });
  });

  // Helper: Find status of bins in a specific location
  const getLocationStatus = (locName: string) => {
    const locBins = bins.filter(b => b.location === locName);
    if (locBins.length === 0) return { fill: 0, count: 0, status: 'empty' };
    const maxFill = Math.max(...locBins.map(b => b.fillLevel));
    let status = 'empty';
    if (maxFill >= 80) status = 'full';
    else if (maxFill >= 40) status = 'partial';
    return { fill: maxFill, count: locBins.length, status };
  };

  // Helper: Parse path nodes to list of SVG points
  const getPathPointsStr = (path: string[]) => {
    return path
      .map(node => {
        const coords = CITY_LOCATIONS[node];
        return coords ? `${coords.x}%,${coords.y}%` : '';
      })
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div className="relative w-full h-[380px] lg:h-[450px] bg-[#0b0f19] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
      {/* Background Subtle grid effect */}
      <div className="absolute inset-0 grid-bg opacity-30 select-none pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 top-1/4 radial-fade pointer-events-none" />

      {/* SVG Container wrapping interactive elements */}
      <svg className="w-full h-full select-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Glow Filters */}
        <defs>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. DRAW STREET EDGES */}
        <g id="street-roads-group">
          {edges.map((edge, index) => {
            const srcNode = CITY_LOCATIONS[edge.source];
            const tgtNode = CITY_LOCATIONS[edge.target];
            if (!srcNode || !tgtNode) return null;

            // Highlight if part of Dijkstra path illustration or active optimization path
            let isPathHighlight = false;
            let pathColor = "stroke-slate-700/40";
            let strokeWidth = "0.7";

            if (highlightPath) {
              for (let i = 0; i < highlightPath.length - 1; i++) {
                if (
                  (highlightPath[i] === edge.source && highlightPath[i + 1] === edge.target) ||
                  (highlightPath[i] === edge.target && highlightPath[i + 1] === edge.source)
                ) {
                  isPathHighlight = true;
                  pathColor = "stroke-emerald-400";
                  strokeWidth = "1.5";
                  break;
                }
              }
            }

            return (
              <g key={`edge-${index}`}>
                <line
                  x1={`${srcNode.x}%`}
                  y1={`${srcNode.y}%`}
                  x2={`${tgtNode.x}%`}
                  y2={`${tgtNode.y}%`}
                  className={`${pathColor} transition-all duration-300`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isPathHighlight ? "none" : "2,2"}
                />
                
                {/* Distance text overlay at midpoint */}
                {!isPathHighlight && (
                  <text
                    x={`${(srcNode.x + tgtNode.x) / 2}%`}
                    y={`${(srcNode.y + tgtNode.y) / 2 - 1.5}%`}
                    fill="#475569"
                    fontSize="1.8"
                    textAnchor="middle"
                    className="font-mono bg-[#0f172a] select-none pointer-events-none font-semibold px-1"
                  >
                    {edge.dist.toFixed(1)} km
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 2. ACTIVE OPTIMIZATION ROUTE PATH OVERLAY */}
        {activeRoutePath && activeRoutePath.length > 1 && (
          <g id="active-route-group">
            {activeRoutePath.map((node, idx) => {
              if (idx === 0) return null;
              const prevNodeName = activeRoutePath[idx - 1];
              const pCoords = CITY_LOCATIONS[prevNodeName];
              const currCoords = CITY_LOCATIONS[node];
              if (!pCoords || !currCoords) return null;

              return (
                <g key={`active-route-leg-${idx}`}>
                  {/* Outer glow stroke */}
                  <line
                    x1={`${pCoords.x}%`}
                    y1={`${pCoords.y}%`}
                    x2={`${currCoords.x}%`}
                    y2={`${currCoords.y}%`}
                    stroke="rgba(34, 197, 94, 0.4)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    className="glow-animated"
                  />
                  {/* Primary sharp route center */}
                  <line
                    x1={`${pCoords.x}%`}
                    y1={`${pCoords.y}%`}
                    x2={`${currCoords.x}%`}
                    y2={`${currCoords.y}%`}
                    stroke="#22c55e"
                    strokeWidth="1.0"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* 3. DRAW BINS/LOCATIONS AS PINS */}
        <g id="location-nodes-group">
          {Object.entries(CITY_LOCATIONS).map(([name, coords]) => {
            const locInfo = getLocationStatus(name);
            const isDepot = name === "Connaught Place";
            const isHighlighted = highlightNode === name;
            const isRelaxTarget = relaxTargetNode === name;

            // Compute Pin Colors
            let nodeColor = "#10b981"; // green
            let filterGlow = "url(#glow-green)";
            let badgeClass = "";

            if (isDepot) {
              nodeColor = "#eab308"; // Gold
              filterGlow = "url(#glow-blue)";
            } else if (locInfo.status === 'full') {
              nodeColor = "#ef4444"; // red
              filterGlow = "url(#glow-red)";
              badgeClass = "alert-red-pulse";
            } else if (locInfo.status === 'partial') {
              nodeColor = "#f59e0b"; // orange
              filterGlow = "url(#glow-amber)";
            }

            // Highlighting during Dijkstra step-by-step
            if (isHighlighted) {
              nodeColor = "#38bdf8"; // cyan focus
              filterGlow = "url(#glow-blue)";
              badgeClass = "ring-4 ring-sky-400 ring-offset-2 ring-offset-[#0b0f19] transition-all duration-300";
            } else if (isRelaxTarget) {
              nodeColor = "#a855f7"; // purple relax Target
              filterGlow = "url(#glow-amber)";
              badgeClass = "ring-4 ring-fuchsia-400 transition-all duration-300";
            }

            return (
              <g
                key={`node-${name}`}
                className="cursor-pointer group"
                onClick={() => onNodeClick && onNodeClick(name)}
              >
                {/* Visual pulses around critical overload items */}
                {locInfo.status === 'full' && !isDepot && (
                  <circle
                    cx={`${coords.x}%`}
                    cy={`${coords.y}%`}
                    r="3.5"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.5"
                    className="animate-ping origin-center opacity-75"
                    style={{ transformOrigin: `${coords.x}% ${coords.y}%` }}
                  />
                )}

                {/* Main node pin circle */}
                <circle
                  cx={`${coords.x}%`}
                  cy={`${coords.y}%`}
                  r={isHighlighted ? "2.6" : isDepot ? "2.3" : "1.8"}
                  fill={nodeColor}
                  filter={filterGlow}
                  className={`transition-all duration-300 ${badgeClass}`}
                />

                {/* Small inner ring for aesthetic depth */}
                <circle
                  cx={`${coords.x}%`}
                  cy={`${coords.y}%`}
                  r="0.6"
                  fill="#ffffff"
                />

                {/* Tooltip background on node hover */}
                {/* SVG text rendering always readable */}
                <text
                  x={`${coords.x}%`}
                  y={`${coords.y - 4}%`}
                  fill="#ffffff"
                  fontSize="2.0"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="hidden group-hover:block pointer-events-none drop-shadow-md fill-white antialiased bg-[#020617]/90 px-1 border rounded"
                >
                  {name} {isDepot ? '(Depot)' : `(${locInfo.fill}%)`}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Labels & Legends in Corners */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none bg-[#090d16]/80 backdrop-blur-sm border border-white/5 rounded-lg p-2.5">
        <div className="text-[10px] tracking-wider text-slate-400 font-medium uppercase">City Map Node status</div>
        <div className="flex flex-col gap-1 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-400" />
            <span>Overloaded (≥80% Fill)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-400" />
            <span>Moderate (40–79%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400" />
            <span>Eco Safe (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 border border-amber-300" />
            <span>Base depot station</span>
          </div>
        </div>
      </div>

      {/* Active route highlight floating alert */}
      {activeRoutePath && (
        <div className="absolute bottom-3 right-3 bg-emerald-950/80 backdrop-blur-sm border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 flex items-center gap-1.5 shadow-lg active-green-pulse">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Active optimized route path rendered</span>
        </div>
      )}

      {/* Manual Pin Selection Indicator */}
      <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 font-mono">
        * Hover node pins for instant fill details
      </div>
    </div>
  );
}
