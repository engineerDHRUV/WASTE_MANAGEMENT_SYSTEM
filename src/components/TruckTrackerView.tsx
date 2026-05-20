import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Truck as TruckIcon, 
  MapPin, 
  Map, 
  Play, 
  Settings, 
  CheckCircle, 
  Navigation,
  Sparkles,
  Layers,
  Fuel
} from 'lucide-react';
import { GarbageBin, Truck, CITY_LOCATIONS, RouteManager } from '../dsaClasses';

interface TruckTrackerViewProps {
  bins: GarbageBin[];
  trucks: Truck[];
  activeRoutePath: string[] | null;
  activeRouteDistance: number;
  onDispatchTruck: (truckId: string, path: string[], distance: number, targetsCollected: string[]) => void;
  onAutoAssign: (truckId: string) => void;
}

export default function TruckTrackerView({
  bins,
  trucks,
  activeRoutePath,
  activeRouteDistance,
  onDispatchTruck,
  onAutoAssign
}: TruckTrackerViewProps) {
  
  // Custom manual route planning sandbox states
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('TRK-01');

  const locations = Object.keys(CITY_LOCATIONS).filter(n => n !== "Connaught Place");

  // Toggle stop in manual builder
  const handleToggleStop = (loc: string) => {
    if (selectedStops.includes(loc)) {
      setSelectedStops(prev => prev.filter(s => s !== loc));
    } else {
      setSelectedStops(prev => [...prev, loc]);
    }
  };

  // Compute total manual routing distance using Dijkstra
  const computeManualRouteDetails = () => {
    if (selectedStops.length === 0) return { path: [], distance: 0, pathStr: "" };
    
    // Instanciate on-the-fly RouteManager
    const rManager = new RouteManager(bins, {}); // Graph loaded statically in implementation
    // Standard static graph loaded inside RouteManager constructor bypasses graph mock problems
    // Let's call the optimizeRoute on RouteManager which runs Dijkstra sequentially
    const opt = rManager.optimizeRoute("Connaught Place", selectedStops);
    return {
      path: opt.path,
      distance: opt.distance,
      pathStr: opt.path.join(' ➔ ')
    };
  };

  const manualDetails = computeManualRouteDetails();

  const handleManualDispatch = () => {
    if (selectedStops.length === 0) return;
    
    // Perform dispatch animation
    onDispatchTruck(selectedTruckId, manualDetails.path, manualDetails.distance, [...selectedStops]);
    setSelectedStops([]); // Reset
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* HEADER SECTION */}
      <div className="select-none">
        <h1 className="text-2xl font-bold tracking-tight">Active Fleet Operations Console</h1>
        <p className="text-xs text-slate-400 mt-0.5">Dispatched vehicles, automated route generators, and custom path scheduling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE TRUCK STATUS CARDS */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
            <TruckIcon className="w-4 h-4 text-emerald-500" />
            <span>Active Service Vehicles</span>
          </h3>

          <div className="space-y-4">
            {trucks.map((truck) => {
              const isOnRoute = truck.status === 'on route';
              return (
                <div 
                  key={truck.id} 
                  className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isOnRoute ? 'border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.06)] active-green-pulse' : 'hover:border-slate-700/30'}`}
                >
                  
                  {/* Status header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 tracking-wider block font-bold">VEHICLE PROFILE</span>
                      <h4 className="text-base font-bold text-slate-100 font-mono">{truck.id}</h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isOnRoute ? 'bg-sky-500/20 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                      {isOnRoute ? 'DISPATCHED' : 'PARKED'}
                    </span>
                  </div>

                  {/* Route progress */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-3 font-medium">
                    <div className="text-xs flex justify-between">
                      <span className="text-slate-400">Current GPS Station</span>
                      <span className="text-slate-200 font-mono font-bold">{truck.currentLocation}</span>
                    </div>

                    {isOnRoute && truck.assignedRoute && (
                      <div className="space-y-1.5">
                        <div className="text-xs text-slate-400 font-semibold uppercase font-mono text-[9px]">ACTIVE DESTINATIONS:</div>
                        <div className="p-2.5 bg-[#070b14] rounded-lg border border-white/5 text-[10px] font-mono leading-relaxed max-w-full overflow-hidden truncate">
                          {truck.assignedRoute.join(' ➔ ')}
                        </div>

                        {/* Animated Loading line representing truck transit */}
                        <div className="space-y-1 text-[10px] text-sky-450 font-bold flex items-center gap-2">
                          <Navigation className="w-3.5 h-3.5 animate-bounce" />
                          <span>Executing Dijkstra segments...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Auto-Assign Actions for parked cars */}
                  {!isOnRoute && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <button
                        onClick={() => onAutoAssign(truck.id)}
                        className="w-full bg-emerald-600/15 hover:bg-emerald-650 text-emerald-400 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/20 transition-all duration-200 hover:scale-102 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Optimize &amp; Auto-Assign</span>
                      </button>
                    </div>
                  )}

                  {isOnRoute && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 blur-2xl rounded-full" />
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT 2 COLUMNS: ROUTING SANDBOX (MANUAL BUILDER) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Layers className="w-5 h-5 text-emerald-500" />
            <div>
              <h2 className="text-base font-bold">Manual Route Sandbox Scheduling</h2>
              <p className="text-xs text-slate-400 mt-0.5">Toggle cities in order, optimize paths, and assign manually</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none font-medium">
            
            {/* Stops Checklist */}
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">Toggle Stop Points to Visit</span>
              
              <div className="grid grid-cols-1 gap-2.5">
                {locations.map((loc) => {
                  const isSelected = selectedStops.includes(loc);

                  const overflowBin = bins.find(b => b.location === loc && b.isFull());

                  return (
                    <button
                      key={loc}
                      onClick={() => handleToggleStop(loc)}
                      className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-left transition-all duration-200 cursor-pointer ${isSelected ? 'bg-emerald-950/25 border-emerald-400 text-slate-100 ring-1 ring-emerald-500' : 'bg-slate-900/40 border-white/5 hover:border-slate-500/20 text-slate-350'}`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{loc}</span>
                      </div>

                      {overflowBin && (
                        <span className="text-[9px] font-mono px-2 py-0.5 font-bold rounded bg-red-500/20 border border-red-500/10 text-red-350">
                          OVERLOAD
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Path Preview and Assign */}
            <div className="bg-[#080c15] p-5 rounded-2xl border border-white/5 flex flex-col justify-between h-full min-h-[280px]">
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block">Sandbox Optimization Preview</span>
                
                {selectedStops.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs font-mono leading-relaxed">
                    Sandbox empty. Toggle stop points on the left to queue coordinates.
                  </div>
                ) : (
                  <div className="space-y-3 select-none">
                    <div className="text-xs space-y-1">
                      <span className="text-slate-500 block">Optimized Transit Loop Layout Sequence:</span>
                      <div className="p-3 bg-slate-900 border border-white/5 font-mono text-[10px] leading-relaxed rounded-xl text-emerald-400 glow-text-green">
                        {manualDetails.pathStr}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mt-2 select-none">
                      <div>
                        <span className="text-slate-400 block font-semibold">Total Loop Travel</span>
                        <span className="font-mono font-bold text-slate-200 text-sm mt-0.5 block">{manualDetails.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Calculated Diesel Spent</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                          {(manualDetails.distance * 0.35).toFixed(1)} L
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Dispatch Options */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Select Collector Truck</label>
                  <select
                    value={selectedTruckId}
                    onChange={(e) => setSelectedTruckId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/5 text-xs text-slate-300 p-2 rounded-lg focus:outline-none"
                  >
                    {trucks.map(t => (
                      <option key={t.id} value={t.id} disabled={t.status === 'on route'}>
                        {t.id} {t.status === 'on route' ? '(Dispatched)' : '(Idle at Depot CP)'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={selectedStops.length === 0 || trucks.find(t => t.id === selectedTruckId)?.status === 'on route'}
                  onClick={handleManualDispatch}
                  className="w-full bg-[#1e2a44] hover:bg-emerald-600 border border-emerald-500/30 font-semibold py-2 rounded-lg text-xs text-emerald-300 hover:text-white transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Dispatch manual sequence</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

    </motion.div>
  );
}
