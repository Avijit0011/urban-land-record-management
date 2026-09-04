import React, { useState } from 'react';
import { Layers, ArrowRight, CheckCircle2, RefreshCw, ShieldCheck, Database } from 'lucide-react';
import { executeHarmonization } from '../services/api';

export const HarmonizationPage: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRunHarmonization = async () => {
    setRunning(true);
    try {
      const res = await executeHarmonization();
      setResult(res);
    } catch (err) {
      console.error('Harmonization failed:', err);
    } finally {
      setRunning(false);
    }
  };

  const fieldMappings = [
    { source: 'survey_no / plot_no', target: 'parcel_id', status: 'Mapped', type: 'String' },
    { source: 'landholder / owner_name', target: 'owner_reference', status: 'Mapped', type: 'Title Case' },
    { source: 'plot_area / area_sqft', target: 'area', status: 'Converted (sq.m)', type: 'Float' },
    { source: 'zoning / landuse', target: 'land_use', status: 'Standardized', type: 'Enum' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
          <Layers className="w-3.5 h-3.5" />
          <span>PostGIS Schema & Topology Harmonization Engine</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Multi-Source Schema & CRS Normalization</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Harmonize heterogeneous municipal GIS layers, cadastral revenue records, and drone footprints into a unified schema with automated unit conversion and topological repair.
        </p>
      </div>

      {/* Field Mapping Matrix & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <Database className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Attribute Field Alias Mapping Matrix</span>
          </h3>

          <div className="space-y-2">
            {fieldMappings.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-mono font-semibold">Source Alias</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{m.source}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400 block text-[9px] uppercase font-mono font-semibold">Target Field</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{m.target}</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 rounded-md border border-teal-200 dark:border-teal-800/60">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CRS & Harmonization Controls */}
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Coordinate Reference System (CRS) Specs</span>
          </h3>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Metric Projection:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">EPSG:3857 (Pseudo-Mercator)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">WebGIS Display:</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">EPSG:4326 (WGS84 Lat/Lng)</span>
            </div>
          </div>

          <button
            onClick={handleRunHarmonization}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-lg bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 text-white font-semibold text-xs border border-teal-700 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Processing Spatial Pipeline...' : 'Execute Harmonization Pipeline'}</span>
          </button>

          {result && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1 font-mono shadow-xs">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Pipeline Execution Complete</span>
              </div>
              <div>Parcels Processed: {result.parcels_processed}</div>
              <div>Buildings Processed: {result.buildings_processed}</div>
              <div>Conflicts Identified: {result.new_conflicts_generated}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

