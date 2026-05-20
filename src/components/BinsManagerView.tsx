import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Trash2, 
  MapPin, 
  Plus, 
  Sliders, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { GarbageBin, CITY_LOCATIONS } from '../dsaClasses';

interface BinsManagerViewProps {
  bins: GarbageBin[];
  onAddBin: (id: string, location: string, fillLevel: number, capacity: number) => void;
  onUpdateBinFill: (id: string, value: number) => void;
  onDeleteBin: (id: string) => void;
}

export default function BinsManagerView({
  bins,
  onAddBin,
  onUpdateBinFill,
  onDeleteBin
}: BinsManagerViewProps) {
  
  // State for adding a new bin
  const [newId, setNewId] = useState(`BIN-0${bins.length + 1}`);
  const [newLocation, setNewLocation] = useState(Object.keys(CITY_LOCATIONS)[0]);
  const [newCapacity, setNewCapacity] = useState(120);
  const [newFill, setNewFill] = useState(25);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const availableLocations = Object.keys(CITY_LOCATIONS);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-validations
    if (!newId.trim()) {
      setErrorMessage('Bin Container ID can not be empty.');
      return;
    }

    if (bins.some(b => b.id.toLowerCase() === newId.trim().toLowerCase())) {
      setErrorMessage(`A container with index ID "${newId}" is already registered.`);
      return;
    }

    onAddBin(newId.trim(), newLocation, newFill, newCapacity);

    // Auto increment default IDs
    const nextNum = bins.length + 2;
    setNewId(`BIN-${nextNum < 10 ? '0' : ''}${nextNum}`);
    setNewFill(25);
  };

  // Filter list
  const filtered = bins.filter(bin => 
    bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats summaries
  const totalBincount = bins.length;
  const fullCount = bins.filter(b => b.isFull()).length;
  const partialCount = bins.filter(b => b.fillLevel >= 40 && b.fillLevel < 80).length;
  const emptyCount = bins.filter(b => b.fillLevel < 40).length;

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Municipal Containers Infrastructure</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage existing trash cells and register high-capacity hardware targets</p>
        </div>
        
        {/* Status Counts indicators */}
        <div className="flex items-center gap-3 bg-[#0d121f] border border-white/5 px-4 py-2 rounded-xl text-xs font-mono font-bold">
          <div className="text-slate-400">STATUS GLANCE:</div>
          <div className="text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{fullCount} Full</span>
          </div>
          <div className="text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{partialCount} Mid</span>
          </div>
          <div className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{emptyCount} Safe</span>
          </div>
        </div>
      </div>

      {/* BODY CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: REGISTRATION FORM CARD */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold flex items-center gap-1.5 border-b border-white/5 pb-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            <span>Add New Bin Container</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-350 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">
                Unique Hardware ID
              </label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="e.g. BIN-88"
                className="w-full bg-[#0a0d16] border border-white/5 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-emerald-500/40 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">
                City Node Location
              </label>
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full bg-[#0a0d16] border border-white/5 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-emerald-500/40 font-semibold"
              >
                {availableLocations.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono block mb-1">
                Volume Capacity Size (Liters)
              </label>
              <select
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                className="w-full bg-[#0a0d16] border border-white/5 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-emerald-500/40 font-mono font-bold"
              >
                <option value={100}>100 L (Compact Box)</option>
                <option value={120}>120 L (Standard Wheelie)</option>
                <option value={150}>150 L (Municipal Large)</option>
                <option value={200}>200 L (Industrial Drum)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Initial Fill Threshold
                </label>
                <span className="text-xs font-mono font-bold text-emerald-400 glow-text-green">{newFill}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={newFill}
                onChange={(e) => setNewFill(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 py-2.5 rounded-lg text-xs font-semibold text-white shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register Hardware ID</span>
            </button>

          </form>
        </div>

        {/* RIGHT 2 COLUMNS: INTERACTIVE CONTAINER CARD PANEL */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* SEARCH & METRIC BAR */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search registered bins by ID or Street address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-[#090d16] border border-white/5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 w-full"
              />
            </div>
            
            <p className="text-xs text-slate-400 font-mono font-bold">
              SYSTEM CONTAINS: <span className="text-slate-200 font-bold">{totalBincount} UNITS</span>
            </p>
          </div>

          {/* Bins Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
            {filtered.length === 0 ? (
              <div className="col-span-1 md:col-span-2 glass-panel rounded-2xl p-10 text-center text-slate-500 text-xs">
                No matching active bin container networks found.
              </div>
            ) : (
              filtered.map((bin) => {
                const isOver = bin.isFull();
                return (
                  <div 
                    key={bin.id} 
                    className={`glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col gap-4 border transition-all duration-300 ${isOver ? 'border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.05)] alert-red-pulse' : 'hover:border-slate-600/30'}`}
                  >
                    
                    {/* Upper title */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-slate-500 font-bold block">SERIAL ID: {bin.id}</span>
                        <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                          <MapPin className={`w-3.5 h-3.5 ${isOver ? 'text-red-400' : 'text-slate-400'}`} />
                          <span>{bin.location}</span>
                        </div>
                      </div>

                      {/* Delete node button */}
                      <button
                        onClick={() => onDeleteBin(bin.id)}
                        className="p-1.5 rounded-lg bg-slate-900 duration-200 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                        title="Dismount bin hardware"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress slider info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bin.getStatus() === 'full' ? 'bg-red-500/10 text-red-500 border border-red-500/10' : bin.getStatus() === 'partial' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                          {bin.getStatus()}
                        </span>
                        
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-350">{bin.fillLevel}%</span>
                          <span className="text-[10px] text-slate-500 block">Of {bin.capacity} Liters capacity</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getProgressColor(bin.fillLevel)}`} 
                          style={{ width: `${bin.fillLevel}%` }} 
                        />
                      </div>
                    </div>

                    {/* Quick threshold updater slider */}
                    <div className="mt-2 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={bin.fillLevel}
                          onChange={(e) => onUpdateBinFill(bin.id, parseInt(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-1 rounded-lg"
                        />
                      </div>

                      <button
                        onClick={() => onUpdateBinFill(bin.id, 0)}
                        className="bg-slate-900 border border-white/5 text-[10px] font-bold text-slate-400 hover:text-red-400 transition-colors duration-150 px-2 rounded py-1"
                      >
                        Empty
                      </button>
                    </div>

                    {isOver && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 blur-2xl rounded-full" />
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </motion.div>
  );
}
