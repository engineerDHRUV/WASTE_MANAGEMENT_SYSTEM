import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart3, 
  Trash2, 
  Settings, 
  Activity, 
  HelpCircle,
  Moon,
  Sun,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

import { 
  GarbageBin, 
  Truck, 
  RouteManager, 
  CITY_GRAPH, 
  INITIAL_BINS_DEFS, 
  INITIAL_TRUCKS_DEFS 
} from './dsaClasses';
import { LogMessage, RouteHistoryItem } from './types';

// Importing sub-views
import DashboardView from './components/DashboardView';
import DsaDetailsView from './components/DsaDetailsView';
import BinsManagerView from './components/BinsManagerView';
import TruckTrackerView from './components/TruckTrackerView';

export default function App() {
  
  // Theme and routing states
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'dsa' | 'bins' | 'trucks'>('dashboard');

  // Core Data state lists
  const [bins, setBins] = useState<GarbageBin[]>(() => 
    INITIAL_BINS_DEFS.map(b => new GarbageBin(b.id, b.location, b.fillLevel, b.capacity))
  );

  const [trucks, setTrucks] = useState<Truck[]>(() => 
    INITIAL_TRUCKS_DEFS.map(t => new Truck(t.id, t.currentLocation))
  );

  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [history, setHistory] = useState<RouteHistoryItem[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Active globally visible optimized route line on Dashboard map
  const [activeRoutePath, setActiveRoutePath] = useState<string[] | null>(null);
  const [activeRouteDistance, setActiveRouteDistance] = useState<number>(0);
  const [activeRouteLegs, setActiveRouteLegs] = useState<any[]>([]);

  // Simulation log tracker reference to prevent duplication issues
  const logCounterRef = useRef<number>(0);

  // Helper: Append new log message
  const addLog = useCallback((message: string, type: 'info' | 'warning' | 'success' | 'danger') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logCounterRef.current += 1;
    const newLog: LogMessage = {
      id: `LOG-${Date.now()}-${logCounterRef.current}`,
      timestamp,
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Limit to last 100 messages
  }, []);

  // Initialize standard logs on start
  useEffect(() => {
    addLog("Smart Waste IoT Municipal Grid online. Ready and waiting for dispatch signals.", "info");
    addLog("Fleet Tracker online. Vehicles parked at Connaught Place base Depot.", "success");
  }, [addLog]);

  // 1. AUTO SIMULATOR: Increments random bins slightly every few seconds
  useEffect(() => {
    let interval: any = null;
    if (isSimulating) {
      interval = setInterval(() => {
        setBins(prevBins => {
          // Choose a random bin to fill
          const randomIndex = Math.floor(Math.random() * prevBins.length);
          const increment = Math.floor(Math.random() * 7) + 3; // +3% to +10%
          
          return prevBins.map((bin, idx) => {
            if (idx === randomIndex) {
              const prevFill = bin.fillLevel;
              const newFill = Math.min(100, prevFill + increment);
              
              const updatedBin = new GarbageBin(bin.id, bin.location, newFill, bin.capacity);
              
              // Trigger alerts if bin crosses critical 80% threshold
              if (prevFill < 80 && newFill >= 80) {
                addLog(`⚡ ALERT: Container ${bin.id} at "${bin.location}" is ${newFill}% full! Transferred to top priority dispatch queue.`, "danger");
              }
              return updatedBin;
            }
            return bin;
          });
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isSimulating, addLog]);

  // 2. FLEET SIMULATION LOGIC: Simulates the on-route movement of dispatched trucks
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prevTrucks => {
        let stateChanged = false;
        
        const nextTrucks = prevTrucks.map(truck => {
          if (truck.status === 'on route' && truck.assignedRoute && truck.assignedRoute.length > 0) {
            stateChanged = true;
            
            // Look up where the truck is currently positioned
            const currentIdx = truck.assignedRoute.indexOf(truck.currentLocation);
            
            if (currentIdx === -1) {
              // Not on path yet, set position to initial node
              const startNode = truck.assignedRoute[0];
              addLog(`Fleet vehicle ${truck.id} dispatched from Depot. Navigating to "${startNode}".`, "info");
              return { ...truck, currentLocation: startNode } as any;
            } else if (currentIdx < truck.assignedRoute.length - 1) {
              // Advance to next node along the path
              const nextLoc = truck.assignedRoute[currentIdx + 1];
              
              // If next station matches a node containing bins, empty them!
              setBins(currentBins => {
                let nodeCleaned = false;
                const nextBins = currentBins.map(b => {
                  if (b.location === nextLoc && b.isFull()) {
                    nodeCleaned = true;
                    addLog(`✓ FLEET: Vehicle ${truck.id} cleared overloaded Container ${b.id} at "${nextLoc}". Sanitization complete.`, "success");
                    return new GarbageBin(b.id, b.location, 0, b.capacity);
                  }
                  return b;
                });
                return nextBins;
              });

              addLog(`Vehicle ${truck.id} transit checkpoint: Arrived at "${nextLoc}".`, "info");
              return { ...truck, currentLocation: nextLoc } as any;
            } else {
              // Truck has reached the end of the looping path (Arrived back at Depot CP)
              addLog(`✓ FLEET: Vehicle ${truck.id} finished route cycle. Returned safely to Connaught Place depot station. All units cleaned.`, "success");
              
              // Determine collected bins count
              const collectorBinList = bins.filter(b => truck.assignedRoute?.includes(b.location) && b.fillLevel > 50).length;

              // Save to Route Optimization History
              setHistory(prevHist => {
                // Approximate optimized vs sweeper distance savings calculations
                const sweepDistance = 44.9;
                const distanceSaved = Math.max(0, sweepDistance - activeRouteDistance);
                const litersSaved = distanceSaved * 0.35; // 0.35 Liters saved per km saved
                
                const newHistoryItem: RouteHistoryItem = {
                  id: `HIS-${Date.now().toString().substring(8)}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  truckId: truck.id,
                  path: [...truck.assignedRoute!],
                  distance: activeRouteDistance || 15.5,
                  binsCollectedCount: Math.max(1, collectorBinList),
                  fuelSaved: litersSaved || 3.2
                };
                return [...prevHist, newHistoryItem];
              });

              // Clean active route highlight displays
              setActiveRoutePath(null);
              setActiveRouteLegs([]);
              setActiveRouteDistance(0);

              return { ...truck, status: 'idle', assignedRoute: null, currentLocation: "Connaught Place" } as any;
            }
          }
          return truck;
        });

        return stateChanged ? nextTrucks : prevTrucks;
      });
    }, 3000); // Ticks every 3.0 seconds representing fast transit steps

    return () => clearInterval(interval);
  }, [addLog, activeRouteDistance, bins]);

  // 3. OPTIMIZE ROUTE TRIGGER: Runs Nearest-Neighbor & Dijkstra calculations to generate loops
  const handleOptimizeRoute = useCallback(() => {
    addLog("System Router prompted: Running Dijkstra shortest-path permutations across priority queue nodes...", "info");
    
    // Instantiate in-memory RouteManager helper
    const rManager = new RouteManager(bins, CITY_GRAPH);
    const fullBins = rManager.getFullBins();

    if (fullBins.length === 0) {
      addLog("Optimization skipped: No overloaded municipal bins detected (all current fill ratios < 80%).", "warning");
      return;
    }

    addLog(`Detected ${fullBins.length} overloaded targets. Sorting heap list and plotting shortest-route legs...`, "info");

    // Gather distinct node names of overloaded bins
    const fullBinLocations = fullBins.map(b => b.location);
    
    // Path optimizer starting and ending at Connaught Place
    const startDepot = "Connaught Place";
    const optimization = rManager.optimizeRoute(startDepot, fullBinLocations);

    // Filter list of idle vehicle units
    const idleTruck = trucks.find(t => t.status === 'idle');

    if (!idleTruck) {
      addLog("Fleet alert: Route calculated successfully, but all transport vehicle units are currently dispatched.", "warning");
      return;
    }

    // Assign route path dynamically
    setActiveRoutePath(optimization.path);
    setActiveRouteDistance(optimization.distance);
    setActiveRouteLegs(optimization.legs);

    // Update truck state to start running
    setTrucks(prevTrucks => prevTrucks.map(t => {
      if (t.id === idleTruck.id) {
        const uTruck = new Truck(t.id, t.currentLocation);
        uTruck.assignRoute(optimization.path);
        return uTruck;
      }
      return t;
    }));

    addLog(`Optimized route successfully compiled! LOOP DISTANCE: ${optimization.distance.toFixed(1)} km. Vehicle "${idleTruck.id}" dispatched on loop schedule.`, "success");
  }, [bins, trucks, addLog]);

  // 4. MANUAL SANBOX FLEET DISPATCHER: Dispatches parked trucks to a custom designed route
  const handleDispatchTruck = useCallback((truckId: string, path: string[], distance: number, targetLocations: string[]) => {
    if (path.length === 0) return;

    setActiveRoutePath(path);
    setActiveRouteDistance(distance);

    setTrucks(prevTrucks => prevTrucks.map(t => {
      if (t.id === truckId) {
        const uTruck = new Truck(t.id, t.currentLocation);
        uTruck.assignRoute(path);
        return uTruck;
      }
      return t;
    }));

    addLog(`🔧 Manual sandbox route approved. Dispatching collector "${truckId}" on custom Dijkstra sweep of ${distance.toFixed(1)} km.`, "success");
  }, [addLog]);

  // 5. AUTO ROUTE ASSIGN CHIP TRIGGER: Quickly optimizes route for a selected truck
  const handleAutoAssign = useCallback((truckId: string) => {
    const rManager = new RouteManager(bins, CITY_GRAPH);
    const fullBins = rManager.getFullBins();

    if (fullBins.length === 0) {
      addLog("Auto-Assign skipped: All current waste containers are well under critical levels.", "warning");
      return;
    }

    const fullLocations = fullBins.map(b => b.location);
    const opt = rManager.optimizeRoute("Connaught Place", fullLocations);

    setActiveRoutePath(opt.path);
    setActiveRouteDistance(opt.distance);
    setActiveRouteLegs(opt.legs);

    setTrucks(prevTrucks => prevTrucks.map(t => {
      if (t.id === truckId) {
        const uTruck = new Truck(t.id, t.currentLocation);
        uTruck.assignRoute(opt.path);
        return uTruck;
      }
      return t;
    }));

    addLog(`✓ AUTO ASSIGN: Dynamic route loop dispatched to fleet collector "${truckId}".`, "success");
  }, [bins, addLog]);

  // Bins CRUD hooks
  const handleAddBin = useCallback((id: string, location: string, fillLevel: number, capacity: number) => {
    const newBin = new GarbageBin(id, location, fillLevel, capacity);
    setBins(prev => [...prev, newBin]);
    addLog(`Municipal hardware network: Registered new container cell ${id} at "${location}" (${capacity}L capacity).`, "success");
  }, [addLog]);

  const handleUpdateBinFill = useCallback((id: string, value: number) => {
    setBins(prevBins => prevBins.map(b => {
      if (b.id === id) {
        return new GarbageBin(b.id, b.location, value, b.capacity);
      }
      return b;
    }));
  }, []);

  const handleDeleteBin = useCallback((id: string) => {
    setBins(prev => prev.filter(b => b.id !== id));
    addLog(`Municipal hardware network: Dismounted and retired trash bin container ${id}.`, "warning");
  }, [addLog]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const handleToggleSimulation = useCallback(() => {
    setIsSimulating(prev => !prev);
    addLog(`IoT sensor simulator: ${!isSimulating ? 'ONLINE - automatic waste accumulation started.' : 'OFFLINE - waste accumulation paused.'}`, "info");
  }, [isSimulating, addLog]);

  return (
    <div className={`min-h-screen grid-bg font-sans transition-all duration-300 ${isDarkMode ? 'bg-[#090d16] text-[#f8fafc]' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 2. NAVIGATION BAR */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b flex items-center justify-between px-6 py-3.5 select-none ${isDarkMode ? 'bg-[#090d16]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        
        {/* Brand identity */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">Smart City</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Waste Management Hub</p>
          </div>
        </div>

        {/* View Switch Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard Control' },
            { id: 'dsa', label: 'DSA Walkthrough' },
            { id: 'bins', label: 'Bins Manager' },
            { id: 'trucks', label: 'Fleet Tracker' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${currentView === tab.id ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white') : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Accessibility & Theme Swapper */}
        <div className="flex items-center gap-3">
          
          {/* Theme switcher */}
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className="p-2 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 text-slate-400 hover:text-emerald-400 transition-colors duration-150 cursor-pointer"
            title="Toggle color theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-widest">Grid Online</span>
          </div>

        </div>
      </header>

      {/* MOBILE NAV TAB ROW */}
      <div className={`md:hidden p-2 grid grid-cols-4 gap-1 select-none border-b ${isDarkMode ? 'bg-[#090d16]/95 border-white/5' : 'bg-white border-slate-200'}`}>
        {[
          { id: 'dashboard', label: 'Monitor' },
          { id: 'dsa', label: 'DSA Walk' },
          { id: 'bins', label: 'Bins' },
          { id: 'trucks', label: 'Fleet' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id as any)}
            className={`py-1.5 rounded-lg text-[11px] font-bold text-center cursor-pointer transition-colors duration-150 ${currentView === tab.id ? (isDarkMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white') : 'text-slate-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. MASTER WORKSPACE WRAPPER */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {currentView === 'dashboard' && (
          <DashboardView 
            bins={bins}
            trucks={trucks}
            logs={logs}
            history={history}
            activeRoutePath={activeRoutePath}
            activeRouteDistance={activeRouteDistance}
            activeRouteLegs={activeRouteLegs}
            isSimulating={isSimulating}
            onOptimizeRoute={handleOptimizeRoute}
            onClearLogs={handleClearLogs}
            onToggleSimulation={handleToggleSimulation}
            onUpdateBinFill={handleUpdateBinFill}
          />
        )}

        {currentView === 'dsa' && (
          <DsaDetailsView 
            bins={bins}
          />
        )}

        {currentView === 'bins' && (
          <BinsManagerView 
            bins={bins}
            onAddBin={handleAddBin}
            onUpdateBinFill={handleUpdateBinFill}
            onDeleteBin={handleDeleteBin}
          />
        )}

        {currentView === 'trucks' && (
          <TruckTrackerView 
            bins={bins}
            trucks={trucks}
            activeRoutePath={activeRoutePath}
            activeRouteDistance={activeRouteDistance}
            onDispatchTruck={handleDispatchTruck}
            onAutoAssign={handleAutoAssign}
          />
        )}

      </main>

      {/* Footer credits line */}
      <footer className="text-center py-8 text-[11px] text-slate-500 font-mono select-none">
        Smart City Waste Management Optimization system • Run with Dijkstra's shortest paths & contiguous RAM memory cells
      </footer>

    </div>
  );
}
