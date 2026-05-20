import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  Network, 
  Database, 
  Layers, 
  Compass, 
  Terminal, 
  Code2, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { CITY_LOCATIONS, CITY_GRAPH, RouteManager, GarbageBin } from '../dsaClasses';
import CityMap from './CityMap';

interface DsaDetailsViewProps {
  bins: GarbageBin[];
}

export default function DsaDetailsView({ bins }: DsaDetailsViewProps) {
  
  // Dijkstra walk states
  const [dijkstraStart, setDijkstraStart] = useState<string>('Connaught Place');
  const [dijkstraEnd, setDijkstraEnd] = useState<string>('Anand Vihar');
  const [dijkstraSteps, setDijkstraSteps] = useState<any[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  // Queue simulation states
  const [simQueue, setSimQueue] = useState<any[]>([]);
  
  // Load initial simulated Queue from existing bins
  useEffect(() => {
    const queueData = [...bins]
      .sort((a, b) => b.fillLevel - a.fillLevel)
      .map(b => ({ id: b.id, location: b.location, fillLevel: b.fillLevel }));
    setSimQueue(queueData);
  }, [bins]);

  // RouteManager instantiation for algorithms
  const routeManager = new RouteManager([...bins], CITY_GRAPH);

  // Calculate list of locations
  const locationNames = Object.keys(CITY_LOCATIONS);

  // Run Dijkstra walkthrough
  const startDijkstraDemo = () => {
    const demoResult = routeManager.dijkstra(dijkstraStart, dijkstraEnd);
    setDijkstraSteps(demoResult.steps);
    setCurrentStepIdx(0);
    setIsAutoPlaying(false);
  };

  // Run initial walkthrough calculation
  useEffect(() => {
    startDijkstraDemo();
  }, [dijkstraStart, dijkstraEnd]);

  // Autoplay hook for Dijkstra
  useEffect(() => {
    let interval: any = null;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= dijkstraSteps.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, dijkstraSteps]);

  // Queue simulator functions
  const handleEnqueue = () => {
    const locations = ["Sector 17", "CP Circle", "Main Bypass", "Metro Gate", "East Market"];
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const randomFill = Math.floor(Math.random() * 60) + 40; // 40 to 100%
    const newBin = {
      id: `BIN-SIM-${Math.floor(Math.random() * 900) + 100}`,
      location: randomLoc,
      fillLevel: randomFill
    };

    // Add and sort descending (Priority Queues sort by highest fill percentages first)
    const updated = [...simQueue, newBin].sort((a, b) => b.fillLevel - a.fillLevel);
    setSimQueue(updated);
  };

  const handleDequeue = () => {
    if (simQueue.length === 0) return;
    const updated = [...simQueue];
    updated.shift(); // Remove top priority
    setSimQueue(updated);
  };

  // Current highlights for Map SVG during Dijkstra stepper
  const currStep = dijkstraSteps[currentStepIdx] || null;
  const highlightNode = currStep ? currStep.current : null;
  const relaxTargetNode = currStep ? currStep.relaxTarget : null;

  // Re-build tentative path till current step to display highlights
  const getSubPath = () => {
    if (!currStep) return null;
    // Walk back from end or currently analyzed nodes
    const walkStart = dijkstraStart;
    const walkEnd = currStep.current;
    if (!walkEnd) return null;

    // Use current states dijkstra run to generate intermediate vector paths
    const stepRoute = routeManager.dijkstra(walkStart, walkEnd);
    return stepRoute.path;
  };

  return (
    <div className="space-y-12">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-2 select-none">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-450 glow-text-green">
          Under the Hood: Municipal DSA &amp; OOP architecture
        </h1>
        <p className="max-w-xl mx-auto text-slate-400 text-sm">
          A visual dashboard detailing the core algorithms, prioritization schemas, and memory structures supporting optimized fleet collection.
        </p>
      </div>

      {/* SECTION 1: INTERACTIVE DIJKSTRA PATHFINDER DEMONSTRATION */}
      <section id="dsa-dijkstra" className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Controls Box */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Dijkstra Shortest Path Walkthrough</h2>
            </div>
            <p className="text-xs text-slate-400">
              Select any start and end node, and step through the relaxation phase to observe Dijkstra's classical greedy algorithm.
            </p>

            <div className="grid grid-cols-2 gap-3 pb-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Source node</label>
                <select
                  value={dijkstraStart}
                  onChange={(e) => setDijkstraStart(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 text-xs text-slate-200 p-2 rounded-lg focus:outline-none"
                >
                  {locationNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Destination node</label>
                <select
                  value={dijkstraEnd}
                  onChange={(e) => setDijkstraEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 text-xs text-slate-200 p-2 rounded-lg focus:outline-none"
                >
                  {locationNames.filter(n => n !== dijkstraStart).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step Controls */}
            <div className="bg-[#0b0e17] border border-white/5 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Step {currentStepIdx + 1} of {dijkstraSteps.length || 1}
                </span>
                
                {/* Steppers */}
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentStepIdx === 0}
                    onClick={() => { setCurrentStepIdx(prev => prev - 1); setIsAutoPlaying(false); }}
                    className="p-1 px-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsAutoPlaying(p => !p)}
                    className="p-1 px-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center gap-1"
                  >
                    {isAutoPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                    <span>{isAutoPlaying ? "Pause" : "Auto"}</span>
                  </button>
                  <button
                    disabled={currentStepIdx >= dijkstraSteps.length - 1}
                    onClick={() => { setCurrentStepIdx(prev => prev + 1); setIsAutoPlaying(false); }}
                    className="p-1 px-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Explanatory Step Bubble */}
              {currStep && (
                <div className="p-3 bg-slate-900 rounded-lg text-xs leading-relaxed text-slate-200 border-l-2 border-emerald-500">
                  <span className="font-bold text-[10px] font-mono text-emerald-400 uppercase block mb-1">
                    Relaxation Engine Update
                  </span>
                  <p>{currStep.description}</p>
                </div>
              )}
            </div>

            {/* Why section */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
              <div className="flex gap-2 text-emerald-300 text-xs items-start">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-400">Why we use Dijkstra's Algorithm?</h4>
                  <p className="mt-1 leading-normal text-slate-400 text-[11px]">
                    Garbage trucks must travel across complex city layouts. Instead of driving subjective static cycles, Dijkstra calculates the absolute shortest path dynamically, minimizing fuel expenses and overall carbon emissions.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right 2 columns: Graph overlay */}
          <div className="lg:col-span-2 space-y-4">
            <CityMap 
              bins={bins}
              activeRoutePath={null}
              trucks={[]}
              highlightNode={highlightNode}
              highlightPath={getSubPath()}
              relaxTargetNode={relaxTargetNode}
            />

            {/* Distances state table at this instant */}
            <div className="glass-panel p-4 rounded-xl select-none max-w-full overflow-hidden">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tentative Distance Register at Current Step</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mt-2.5 font-mono text-xs">
                {currStep && Object.entries(currStep.distances).map(([node, dist]: any) => {
                  const isCurrent = highlightNode === node;
                  return (
                    <div 
                      key={node} 
                      className={`p-2 rounded border text-center ${isCurrent ? 'bg-sky-950/30 border-sky-500/30' : 'bg-slate-900/50 border-white/5'}`}
                    >
                      <div className="text-[10px] text-slate-500 truncate font-semibold">{node.split(' ')[0]}</div>
                      <div className={`font-bold mt-1 ${dist === Infinity ? 'text-slate-600' : isCurrent ? 'text-sky-400' : 'text-slate-300'}`}>
                        {dist === Infinity ? '∞' : `${dist.toFixed(1)} km`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: ANIMATED PRIORITY QUEUE (MAX-HEAP REPRESENTATION) */}
      <section id="dsa-priority-queue" className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Priority Queue (Max-Heap simulator)</h2>
            </div>
            <p className="text-xs text-slate-400">
              A standard queue works on FIFO (First In, First Out). However, municipal waste management requires high-capacity fill bins to be extracted first. We use a max Priority Queue to maintain priority pointers:
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleEnqueue}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 border border-transparent transition-all duration-200"
              >
                <span>Enqueue Random Bin</span>
              </button>
              
              <button
                disabled={simQueue.length === 0}
                onClick={handleDequeue}
                className="flex-1 bg-slate-800 hover:bg-slate-700 active:scale-95 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 border border-slate-700 transition-all duration-200 disabled:opacity-40"
              >
                <span>Dequeue Highest Fill</span>
              </button>
            </div>

            {/* Why card */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
              <div className="flex gap-2 text-emerald-300 text-xs items-start">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-400">Why a Priority Queue?</h4>
                  <p className="mt-1 leading-normal text-slate-400 text-[11px]">
                    Ordinary queues collect elements by age. A Priority Queue automatically schedules and places overloaded locations (bins crossing ≥80%) at the absolute front of the line, guaranteeing prompt sanitization services.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b0e17] rounded-2xl p-5 border border-white/5 min-h-[180px]">
              <div className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-semibold font-mono">
                Active Priority Queue State: High-priority front slots left
              </div>

              {simQueue.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 font-mono text-xs text-center">
                  Priority queue empty. Click "Enqueue Random Bin" to insert trash data nodes.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {simQueue.map((item, idx) => {
                    const isTopPriority = idx === 0;
                    return (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`p-3 rounded-xl border flex flex-col justify-between ${isTopPriority ? 'bg-emerald-950/20 border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.15)] ring-1 ring-emerald-500' : 'bg-slate-900/40 border-white/5'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${isTopPriority ? 'bg-emerald-400 text-slate-900 glow-text-green' : 'bg-slate-800 text-slate-400'}`}>
                            {isTopPriority ? 'TOP PRIORITY' : `INDEX [${idx}]`}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">{item.id.substring(0,8)}</span>
                        </div>
                        
                        <div className="font-bold text-slate-100 text-sm mt-1">{item.location}</div>
                        <div className="flex items-center justify-between mt-3 text-xs">
                          <span className="text-slate-400">Fill Level:</span>
                          <span className={`font-mono font-bold ${item.fillLevel >= 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.fillLevel}%
                          </span>
                        </div>

                        {/* Progress slider mini */}
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full ${item.fillLevel >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${item.fillLevel}%` }} 
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: IN-MEMORY STRUCTURAL ARRAYS */}
      <section id="dsa-arrays" className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 scroll-m-4 select-none">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Contiguous Memory Array</h2>
            </div>
            <p className="text-xs text-slate-400">
              In computers, arrays store nodes contiguously at sequential address indices in RAM. This provides fast O(1) random lookup by index index.
            </p>

            {/* Why card */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
              <div className="flex gap-2 text-emerald-300 text-xs items-start">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-400">Why use an Array first?</h4>
                  <p className="mt-1 leading-normal text-slate-400 text-[11px]">
                    Before sorting data onto routing lists or heap queues, we store the full, persistent truth values in a central sequential array index, letting us update fill quantities instantly in-place in memory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#0b0e17] rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="text-xs text-slate-400 font-semibold font-mono uppercase tracking-wider">
                RAM Contiguous Heap Index Allocation Maps:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {bins.map((bin, idx) => (
                  <div key={bin.id} className="p-3 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">MEMORY INDEX [{idx}]</span>
                      <div className="font-bold text-slate-200 text-xs mt-0.5">{bin.id} - {bin.location}</div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Address: 0x7FFEAA{(0x100 * idx).toString(16).toUpperCase()}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold">Stored Value</span>
                      <span className="font-bold text-emerald-400 text-xs">{bin.fillLevel}% full</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: OOP UML CLASS SCHEMATICS */}
      <section id="dsa-oop-classes" className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Code2 className="w-6 h-6 text-emerald-500" />
          <h2 className="text-xl font-bold">UML Object-Oriented Blueprint Layouts</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* GarbageBin Class Card */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg select-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">CLASS BLUEPRINT</span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-750 text-[10px] text-slate-350 font-mono rounded">UML</span>
            </div>
            <h3 className="text-emerald-400 font-mono text-base font-bold mt-3">class GarbageBin</h3>
            <p className="text-[11px] text-slate-400 mt-1">Represents a physical city trash container monitoring load thresholds.</p>
            
            <div className="mt-4 font-mono text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Attributes</div>
              <div>+ id : String</div>
              <div>+ location : String</div>
              <div>+ fillLevel : Number</div>
              <div>+ capacity : Number</div>
            </div>

            <div className="mt-2 font-mono text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Methods</div>
              <div>+ isFull() : Boolean</div>
              <div>+ updateFill(val) : Void</div>
              <div>+ getStatus() : String</div>
            </div>
          </div>

          {/* Truck Class Card */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg select-none font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 font-sans">
              <span className="text-xs font-bold text-slate-400 tracking-wider">CLASS BLUEPRINT</span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-750 text-[10px] text-slate-350 rounded">UML</span>
            </div>
            <h3 className="text-amber-400 text-base font-bold mt-3 font-mono">class Truck</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">Controls the collection vehicles stationed at the depot bases.</p>
            
            <div className="mt-4 text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Attributes</div>
              <div>+ id : String</div>
              <div>+ currentLocation : String</div>
              <div>+ assignedRoute : Array</div>
              <div>+ status : String</div>
            </div>

            <div className="mt-2 text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Methods</div>
              <div>+ assignRoute(route) : Void</div>
              <div>+ startCollection() : Void</div>
              <div>+ getStatus() : String</div>
            </div>
          </div>

          {/* RouteManager Class Card */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-lg select-none font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 font-sans">
              <span className="text-xs font-bold text-slate-400 tracking-wider">CLASS BLUEPRINT</span>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-750 text-[10px] text-slate-355 rounded">UML</span>
            </div>
            <h3 className="text-sky-450 text-base font-bold mt-3 font-mono">class RouteManager</h3>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">The algorithm core optimizing traversals and queue sorting.</p>
            
            <div className="mt-4 text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Attributes</div>
              <div>+ bins : List&lt;GarbageBin&gt;</div>
              <div>+ graph : Map&lt;String, Map&gt;</div>
            </div>

            <div className="mt-2 text-xs text-slate-300 space-y-1 bg-[#0b0f1a] p-3 rounded-lg border border-white/5">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-sans mb-1.5">Methods</div>
              <div>+ getFullBins() : List</div>
              <div>+ buildPriorityQueue() : List</div>
              <div>+ dijkstra(start, end) : Map</div>
              <div>+ optimizeRoute() : Map</div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
