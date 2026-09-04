import React from 'react';
import { 
  Building2, 
  MapPin, 
  Layers, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Database
} from 'lucide-react';
import { Statistics } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

import { SkeletonCard, SkeletonBox } from '../components/Skeleton';

interface DashboardPageProps {
  stats: Statistics | null;
  loading?: boolean;
  setActiveTab: (tab: string) => void;
  onHarmonize: () => void;
  onSpatialMatch: () => void;
}

const BAR_COLORS = ['#0f766e', '#c2410c', '#334155', '#d97706', '#475569'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading = false,
  setActiveTab,
  onHarmonize,
  onSpatialMatch
}) => {
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <SkeletonBox className="h-4 w-48" />
          <SkeletonBox className="h-6 w-80" />
          <SkeletonBox className="h-4 w-full max-w-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-56 w-full" />
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-56 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    total_parcels: 240,
    total_buildings: 166,
    total_datasets: 3,
    total_conflicts: 4,
    open_conflicts: 4,
    high_severity_conflicts: 2,
    high_confidence_parcels: 228,
    review_required_parcels: 12
  };

  const conflictsData = stats?.conflicts_by_type || [
    { type: 'Area Mismatch', count: 1 },
    { type: 'Building Spillover', count: 1 },
    { type: 'Spatial Overlap', count: 1 },
    { type: 'Missing Owner', count: 1 }
  ];

  const confidenceData = stats?.confidence_distribution || [
    { range: '90-100%', count: 210 },
    { range: '80-89%', count: 18 },
    { range: '70-79%', count: 8 },
    { range: '< 70%', count: 4 }
  ];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>PostGIS Spatial Engine v15.0 Operational</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Urban Land Record Integration Overview</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Multi-source spatial data harmonization, topology validation, CRS transformation, and automated ML conflict detection for municipal land administration.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Launch WebGIS Inspector</span>
            </button>
            <button
              onClick={onHarmonize}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Run Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-teal-700 dark:border-l-teal-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Cadastral Parcels</span>
            <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{kpis.total_parcels.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Verified Polygons</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-orange-700 dark:border-l-orange-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Footprints</span>
            <Building2 className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{kpis.total_buildings.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Drone Segmentation</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-slate-700 dark:border-l-slate-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Active Layers</span>
            <Layers className="w-3.5 h-3.5 text-slate-700 dark:text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{kpis.total_datasets}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multi-Source Layers</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-rose-700 dark:border-l-rose-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Open Conflicts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-900 dark:text-rose-300 font-mono">{kpis.open_conflicts}</div>
          <div className="text-[11px] text-rose-800 dark:text-rose-400 font-semibold mt-1">
            {kpis.high_severity_conflicts} High Severity
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-emerald-700 dark:border-l-emerald-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">High Confidence</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 font-mono">{kpis.high_confidence_parcels}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Auto-Matched (&gt;0.85)</div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 border-l-4 border-l-amber-600 dark:border-l-amber-500 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-medium">Audit Queue</span>
            <Clock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-800 dark:text-amber-300 font-mono">{kpis.review_required_parcels}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Review Required</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conflicts Chart */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Conflict Distribution by Category</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Spatial overlaps, boundary shifts, area discrepancies</p>
            </div>
            <button 
              onClick={() => setActiveTab('conflicts')}
              className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              <span>Review Desk</span>
              <ArrowRight className="w-3 h-3 text-teal-700 dark:text-teal-400" />
            </button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conflictsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {conflictsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Distribution Chart */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Confidence Metric Distribution</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Multi-source score breakdown across registered parcels</p>
            </div>
            <button 
              onClick={() => setActiveTab('analytics')}
              className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 flex items-center gap-1 font-semibold"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3 text-teal-700 dark:text-teal-400" />
            </button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '11px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
                />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div 
          onClick={onSpatialMatch}
          className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4.5 rounded-xl cursor-pointer hover:border-teal-600 dark:hover:border-teal-500 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 flex items-center justify-center text-teal-700 dark:text-teal-400">
              <Cpu className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">ML Spatial Matching Engine</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">Execute Random Forest candidate matching with IoU and centroid distance metrics.</p>
        </div>

        <div 
          onClick={() => setActiveTab('imagery')}
          className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4.5 rounded-xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Drone Imagery CV Extractor</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">Segment building footprints from raster GeoTIFF imagery using OpenCV.</p>
        </div>

        <div 
          onClick={() => setActiveTab('conflicts')}
          className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-4.5 rounded-xl cursor-pointer hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">Human-in-the-Loop Verification</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">Audit flagged spatial discrepancies with explainability factors and immutable logging.</p>
        </div>
      </div>
    </div>
  );
};


