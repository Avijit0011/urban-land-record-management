import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  FileText, 
  ShieldCheck, 
  Cpu,
  Info
} from 'lucide-react';
import { Conflict, fetchConflicts, resolveConflict } from '../services/api';
import { SkeletonBox, SkeletonCard } from '../components/Skeleton';

export const ConflictsPage: React.FC = () => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [resolutionNote, setResolutionNote] = useState('');
  const [correctedValue, setCorrectedValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const data = await fetchConflicts();
      setConflicts(data);
      if (data.length > 0 && !selectedConflict) {
        setSelectedConflict(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: 'approve' | 'reject' | 'edit') => {
    if (!selectedConflict) return;
    try {
      await resolveConflict(selectedConflict.id, action, resolutionNote, correctedValue);
      setActionSuccess(`Conflict successfully updated (${action}). Logged to PostGIS audit table.`);
      setTimeout(() => setActionSuccess(null), 3500);
      loadConflicts();
    } catch (err) {
      console.error(`Failed to ${action} conflict:`, err);
    }
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
          <SkeletonBox className="h-4 w-56" />
          <SkeletonBox className="h-6 w-80" />
          <SkeletonBox className="h-3 w-2/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <SkeletonBox className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBox className="h-32 w-full" />
              <SkeletonBox className="h-32 w-full" />
            </div>
            <SkeletonBox className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Human-in-the-Loop Conflict Resolution Desk</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Spatial & Attribute Verification Audit</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Audit flagged geometry overlaps and area discrepancies with AI explainability metrics and immutable PostGIS logging.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 px-2 font-medium">Filter Severity:</span>
          {['all', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition-all ${
                filterSeverity === sev
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Review Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Conflict List Sidebar (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider px-1 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span>Flagged Items ({filteredConflicts.length})</span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">PostGIS Queue</span>
          </div>

          {filteredConflicts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">No active conflicts matching filter.</div>
          ) : (
            filteredConflicts.map((c) => {
              const isSelected = selectedConflict?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedConflict(c)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-600 dark:border-teal-500 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      Parcel #{c.parcel_id || 'N/A'}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md ${
                        c.severity === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60'
                          : c.severity === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                          : 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800/60'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">{c.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/70 font-mono">
                    <span className="capitalize">{c.conflict_type.replace('_', ' ')}</span>
                    <span
                      className={`font-semibold capitalize ${
                        c.status === 'approved'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : c.status === 'rejected'
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Conflict Verification Pane (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-5 shadow-sm">
          {selectedConflict ? (
            <>
              {/* Conflict Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                      Parcel #{selectedConflict.parcel_id || 'N/A'}
                    </span>
                    {selectedConflict.building_id && (
                      <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800/60">
                        Building #{selectedConflict.building_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 capitalize font-medium">
                    Discrepancy Category: {selectedConflict.conflict_type.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Match Confidence:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {Math.round((selectedConflict.confidence_score || 0.85) * 100)}%
                  </span>
                </div>
              </div>

              {/* Side-by-Side Source Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                    Source A: {selectedConflict.source_a || 'Cadastral Title Register'}
                  </span>
                  <div className="text-xs space-y-1.5">
                    <div className="text-slate-600 dark:text-slate-400 font-medium">Expected Recorded Attribute:</div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-xs border border-slate-200 dark:border-slate-700 font-medium shadow-xs">
                      {selectedConflict.expected_value || 'Documented Land Area'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                    Source B: {selectedConflict.source_b || 'Drone/GIS Vector Survey'}
                  </span>
                  <div className="text-xs space-y-1.5">
                    <div className="text-slate-600 dark:text-slate-400 font-medium">Observed Spatial Geometry:</div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-amber-800 dark:text-amber-300 font-mono text-xs border border-amber-200 dark:border-amber-800/60 font-semibold bg-amber-50/50 dark:bg-amber-950/30 shadow-xs">
                      {selectedConflict.observed_value || 'GIS Geometry Metric'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Explanation Box */}
              <div className="p-4 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                  <Cpu className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <span>Automated Analysis & Recommendation</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {selectedConflict.recommendation ||
                    'Recalculate parcel boundary from physical survey or update official land title record.'}
                </p>
                {selectedConflict.explainability && (
                  <div className="mt-3 pt-3 border-t border-teal-200/80 dark:border-teal-800/60 text-[11px] grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300 font-mono">
                    {Object.entries(selectedConflict.explainability).map(([k, v]) => (
                      <div key={k} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-teal-800/60 shadow-xs">
                        <span className="text-slate-500 dark:text-slate-400 block uppercase text-[9px] font-semibold">{k.replace('_', ' ')}</span>
                        <span className="text-teal-800 dark:text-teal-300 font-bold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Human Action Controls */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Authorized Officer Decision</h4>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Optional resolution notes or surveyor comments..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:ring-1 focus:ring-teal-700 font-sans shadow-xs"
                  />

                  {selectedConflict.conflict_type === 'area_mismatch' && (
                    <input
                      type="text"
                      placeholder="Corrected Area (m²)..."
                      value={correctedValue}
                      onChange={(e) => setCorrectedValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 focus:ring-1 focus:ring-teal-700 font-mono shadow-xs"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleResolve('approve')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs border border-emerald-600 shadow-xs transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Harmonization</span>
                  </button>

                  <button
                    onClick={() => handleResolve('reject')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60 font-medium text-xs transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Reject / Dismiss</span>
                  </button>

                  <button
                    onClick={() => handleResolve('edit')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Apply Custom Edit</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
              <Info className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              <span>Select a conflict item from the sidebar to inspect details and audit.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

