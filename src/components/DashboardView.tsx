import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Trash2, 
  Truck as TruckIcon, 
  Activity, 
  Zap, 
  Play, 
  FileJson, 
  RefreshCw,
  Search,
  Sliders,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react';
import { GarbageBin, Truck, RouteManager, CITY_GRAPH } from '../dsaClasses';
import { LogMessage, RouteHistoryItem } from '../types';
import CityMap from './CityMap';

interface DashboardViewProps {
  bins: GarbageBin[];
  trucks: Truck[];
  logs: LogMessage[];
  history: RouteHistoryItem[];
  activeRoutePath: string[] | null;
  activeRouteDistance: number;
  activeRouteLegs: any[];
  isSimulating: boolean;
  onOptimizeRoute: () => void;
  onClearLogs: () => void;
  onToggleSimulation: () => void;
  onUpdateBinFill: (id: string, value: number) => void;
}

export default function DashboardView({
  bins,
  trucks,
  logs,
  history,
  activeRoutePath,
  activeRouteDistance,
  activeRouteLegs,
  isSimulating,
  onOptimizeRoute,
  onClearLogs,
  onToggleSimulation,
  onUpdateBinFill
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'partial' | 'empty'>('all');

  // Core metrics calculations
  const totalBincount = bins.length;
  const fullBinsCount = bins.filter(b => b.isFull()).length;
  const activeTrucksCount = trucks.filter(t => t.status === 'on route').length;
  
  // Accumulated Fuel Saved from real-time route optimization history
  const totalFuelSaved = history.reduce((acc, curr) => acc + curr.fuelSaved, 0);

  // Filtered Bins list for the live interactive table
  const filteredBins = bins.filter(bin => {
    const matchesSearch = bin.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bin.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && bin.getStatus() === statusFilter;
  });

  // Calculate high priority queue simulation metrics
  const sortedPriorityQueue = [...bins].sort((a, b) => b.fillLevel - a.fillLevel);

  // Helper static fixed schedule distance count (visiting all 8 nodes in a simple sequential sweep loop)
  // Distance of full-service sweep: ~44.9 kms. Simple formula: Sweep - Optimized = Saved distance
  const fixedRouteDistance = 44.9;

  // Render priority progress bars
  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'rgba(239, 68, 68, 0.8)'; // Red
    if (percent >= 40) return 'rgba(245, 158, 11, 0.8)'; // Orange
    return 'rgba(16, 185, 129, 0.8)'; // Green
  };

  const getProgressBg = (percent: number) => {
    if (percent >= 80) return 'bg-red-500/25';
    if (percent >= 40) return 'bg-amber-500/25';
    return 'bg-emerald-500/25';
  };

  const triggerExportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "smart_waste_route_history.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* 1. HERO STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Bins */}
        <div id="stat-total-bins" className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Municipal Bins</p>
              <h3 className="text-3xl font-bold mt-2 font-mono">{totalBincount}</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Active monitoring endpoints</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
        </div>

        {/* Overloaded Bins */}
        <div id="stat-full-bins" className={`glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 ${fullBinsCount > 0 ? 'border-red-500/20 hover:border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.05)]' : 'hover:border-slate-500/30'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Overloaded Bins</p>
              <h3 className={`text-3xl font-bold mt-2 font-mono ${fullBinsCount > 0 ? 'text-red-400 glow-text-red' : 'text-slate-200'}`}>
                {fullBinsCount}
              </h3>
            </div>
            <div className={`p-3 rounded-lg border text-red-400 ${fullBinsCount > 0 ? 'bg-red-500/10 border-red-500/30 animate-pulse' : 'bg-slate-500/10 border-slate-500/20'}`}>
              <AlertCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${fullBinsCount > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{fullBinsCount > 0 ? `${fullBinsCount} bins require immediate route` : 'All storage parameters safe'}</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 blur-3xl rounded-full" />
        </div>

        {/* Trucks Active */}
        <div id="stat-active-trucks" className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Active Dispatch</p>
              <h3 className="text-3xl font-bold mt-2 font-mono">{activeTrucksCount} <span className="text-base text-slate-500">/ {trucks.length}</span></h3>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <TruckIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${activeTrucksCount > 0 ? 'bg-sky-450 animate-ping' : 'bg-slate-500'}`} />
            <span>{activeTrucksCount > 0 ? 'Collectors executing Dijkstra routes' : 'Fleet parked at Depot CP'}</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 blur-3xl rounded-full" />
        </div>

        {/* Fuel Saved Today */}
        <div id="stat-fuel-saved" className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase glow-text-green">Energy / Fuel Saved</p>
              <h3 className="text-3xl font-bold mt-2 text-emerald-400 font-mono glow-text-green">{totalFuelSaved.toFixed(1)} L</h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 active-green-pulse">
              <Zap className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-4 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{(totalFuelSaved * 2.62).toFixed(1)} kg CO₂ reduction achieved</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
        </div>

      </div>

      {/* 2. MAIN WORKSPACE ROW: LIVE MAP & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <span>Real-Time Municipal Transit Grid</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Visually shows road distances, overload alerts, and optimized paths</p>
              </div>

              {/* Control Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Toggle simulations */}
                <button
                  id="btn-toggle-simulation"
                  onClick={onToggleSimulation}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${isSimulating ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Stop Auto-Fill' : 'Auto-Fill Cities'}</span>
                </button>

                {/* Optimize Route Trigger */}
                <button
                  id="btn-optimize-route"
                  onClick={onOptimizeRoute}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-300"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Dispatch &amp; Optimize</span>
                </button>
              </div>
            </div>

            {/* Reusable City SVG Map */}
            <CityMap 
              bins={bins} 
              activeRoutePath={activeRoutePath} 
              trucks={trucks} 
            />
          </div>

          {/* Active Optimized Route Leg Detail Console */}
          {activeRoutePath && activeRoutePath.length > 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-5 border-emerald-500/30"
            >
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                <span>Optimized Dispatch Sequence Execution (Depot Hub start)</span>
              </h4>
              
              <div className="flex flex-wrap items-center gap-2 mt-3 select-none">
                {activeRoutePath.map((node, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-md text-xs font-mono border ${i === 0 || i === activeRoutePath.length - 1 ? 'bg-amber-950/40 border-amber-400/30 text-amber-300 font-bold' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
                      {node}
                    </div>
                    {i < activeRoutePath.length - 1 && (
                      <span className="text-emerald-400 font-bold text-sm">➔</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800 select-none">
                <div className="text-xs">
                  <span className="text-slate-400 block">Total Traveling Loop</span>
                  <span className="text-base font-bold font-mono text-slate-200">{activeRouteDistance.toFixed(1)} km</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block">Regular Sweeper distance</span>
                  <span className="text-base font-bold font-mono text-slate-200">44.9 km</span>
                </div>
                <div className="text-xs">
                  <span className="text-emerald-400 font-medium block">Route Savings (This cycle)</span>
                  <span className="text-base font-bold font-mono text-emerald-400 glow-text-green">
                    +{(fixedRouteDistance - activeRouteDistance).toFixed(1)} km ({( ((fixedRouteDistance - activeRouteDistance)/fixedRouteDistance) * 100 ).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </motion.div>
          )}

        </div>

        {/* Right 1 Col: Priority Queue & Diagnostics Console */}
        <div className="flex flex-col gap-6">
          
          {/* Priority Queue Module */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col h-[320px] relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase text-slate-200">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>Priority Queue (Heap representation)</span>
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Heap order prioritizes maximum bin fill values descending</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 font-mono rounded">
                Max Heap
              </span>
            </div>

            {/* Sorted Bins list queue representation */}
            <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1 select-none">
              {sortedPriorityQueue.map((bin, index) => {
                const isOver = bin.isFull();
                return (
                  <div 
                    key={bin.id} 
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${isOver ? 'bg-red-950/15 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.04)] alert-red-pulse' : 'bg-slate-900/45 border-white/5'}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 font-mono block">
                          [{index + 1}] {bin.location}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${isOver ? 'bg-red-500/20 text-red-300' : bin.fillLevel >= 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {bin.fillLevel}%
                        </span>
                      </div>
                      
                      {/* Animated progress fill bar */}
                      <div className={`w-full h-1.5 rounded-full ${getProgressBg(bin.fillLevel)} overflow-hidden`}>
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${bin.fillLevel}%`,
                            backgroundColor: getProgressColor(bin.fillLevel)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Logs Diagnostics terminal emulator */}
          <div className="glass-panel rounded-2xl p-5 flex flex-col h-[320px] relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase text-slate-300">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <span>Municipal Fleet Live Logs</span>
                </h3>
              </div>
              <button 
                onClick={onClearLogs}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors duration-200 font-medium cursor-pointer"
              >
                Clear Console
              </button>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto font-mono mt-3 space-y-2.5 text-xs text-slate-300 pr-1">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <Activity className="w-8 h-8 text-slate-600 mb-2 stroke-[1.2] animate-pulse" />
                  <span>No log signals recorded. Click "Dispatch &amp; Optimize" to prompt route activities.</span>
                </div>
              ) : (
                logs.map((log) => {
                  let badge = "";
                  let textColor = "text-slate-300";

                  if (log.type === 'danger') {
                    badge = "⚡ ALERT";
                    textColor = "text-red-400";
                  } else if (log.type === 'warning') {
                    badge = "⚠️ QUEUE";
                    textColor = "text-amber-400";
                  } else if (log.type === 'success') {
                    badge = "✓ FLEET";
                    textColor = "text-emerald-400";
                  } else {
                    badge = "i SYSTEM";
                    textColor = "text-sky-400";
                  }

                  return (
                    <div key={log.id} className="flex gap-2 select-none">
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        [{log.timestamp}]
                      </span>
                      <div className="leading-tight">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded mr-1.5 opacity-85 ${log.type === 'danger' ? 'bg-red-500/25 text-red-350' : log.type === 'warning' ? 'bg-amber-500/25 text-amber-300' : log.type === 'success' ? 'bg-emerald-500/25 text-emerald-350' : 'bg-slate-800 text-slate-300'}`}>
                          {badge}
                        </span>
                        <span className={`${textColor}`}>{log.message}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. INTERACTIVE BINS STATUS GRID / SEARCH CONTROL */}
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-emerald-500" />
              <span>Real-Time Bin Capacities</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Directly adjust slider bars to test limits and watch priority lists sort instantly</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#0e1424] border border-white/5 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 w-full sm:w-52"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[#070b14] border border-white/5 p-0.5 rounded-lg select-none">
              {(['all', 'full', 'partial', 'empty'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all duration-200 ${statusFilter === st ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {st}
                </button>
              ))}
            </div>
            
          </div>
        </div>

        {/* Bins Table Grid */}
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/50">
                <th className="py-3 px-4">Bin ID</th>
                <th className="py-3 px-4">Assigned Location</th>
                <th className="py-3 px-4">Threshold status</th>
                <th className="py-3 px-4">Fill Level Percentage</th>
                <th className="py-3 px-4">Manual controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredBins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    No registered municipal bins matches filter conditions.
                  </td>
                </tr>
              ) : (
                filteredBins.map((bin) => {
                  const isFull = bin.isFull();
                  return (
                    <tr 
                      key={bin.id} 
                      className={`hover:bg-slate-900/30 transition-colors duration-150 ${isFull ? 'bg-red-500/[0.02]' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{bin.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{bin.location}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Capacity: {bin.capacity}L</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bin.getStatus() === 'full' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : bin.getStatus() === 'partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {bin.getStatus()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 max-w-xs">
                          <span className="font-mono w-10 font-bold block">{bin.fillLevel}%</span>
                          <div className={`flex-1 h-2 rounded-full ${getProgressBg(bin.fillLevel)} overflow-hidden`}>
                            <div 
                              className="h-full rounded-full transition-all duration-300"
                              style={{ 
                                width: `${bin.fillLevel}%`,
                                backgroundColor: getProgressColor(bin.fillLevel)
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={bin.fillLevel}
                            onChange={(e) => onUpdateBinFill(bin.id, parseInt(e.target.value))}
                            className="w-24 accent-emerald-500 cursor-pointer h-1 rounded-lg"
                          />
                          <button 
                            onClick={() => onUpdateBinFill(bin.id, 0)}
                            className="bg-slate-800 hover:bg-slate-700 hover:text-red-400 transition-colors duration-200 px-2.5 py-1 border border-slate-700 text-[10px] rounded font-semibold text-slate-300"
                          >
                            Empty bin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DRIP ROUTE HISTORY LIST VIEW */}
      {history.length > 0 && (
        <div id="route-history-panel" className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase text-slate-355">
                <FileJson className="w-4 h-4 text-emerald-500" />
                <span>Cycle Routing Optimization History Log</span>
              </h3>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">Summary data of fuel savings and optimized distances per collection loop</p>
            </div>
            <button
              onClick={triggerExportHistory}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors duration-200"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Export History JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono select-none">
            {history.slice(-3).reverse().map((item, idx) => (
              <div 
                key={item.id} 
                className={`p-3.5 rounded-xl border ${idx === 0 ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-slate-900/60 border-white/5'} text-[11px] leading-relaxed relative overflow-hidden`}
              >
                <div className="flex items-center justify-between font-bold mb-2">
                  <span className="text-[10px] text-slate-500">CYCLE #{item.id.substring(0,6).toUpperCase()}</span>
                  <span className="text-emerald-400">{item.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Distances Travelled: </span>
                  <span className="font-bold text-slate-100">{item.distance.toFixed(1)} km</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Fuel Spent Saved: </span>
                  <span className="font-bold text-emerald-400">+{item.fuelSaved.toFixed(1)} Liters</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold font-mono">Bins Serviced: </span>
                  <span className="font-bold text-slate-100">{item.binsCollectedCount} bins cleaned</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 border-t border-white/5 pt-1.5 leading-normal">
                  <span className="font-bold text-[9px] uppercase tracking-wide block text-slate-400 mb-0.5">Sequence traversal path:</span>
                  {item.path.join(' ➔ ')}
                </div>
                {idx === 0 && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 blur-xl rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
