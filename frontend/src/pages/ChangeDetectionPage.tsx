import React, { useState, useEffect } from 'react';
import { History, PlusCircle, Trash2, Edit3, ShieldAlert, Layers } from 'lucide-react';
import { runChangeDetection } from '../services/api';

export const ChangeDetectionPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangeDetection();
  }, []);

  const loadChangeDetection = async () => {
    setLoading(true);
    try {
      const res = await runChangeDetection();
      setData(res);
    } catch (err) {
      console.error('Failed to run change detection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800">
          <History className="w-3.5 h-3.5" />
          <span>Temporal Change Detection & Land Use Audit</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Multi-Temporal Snapshot Comparison (2020 vs 2024)</h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Automated baseline comparison between historical land revenue surveys and high-resolution drone orthophotos to identify new structures, demolitions, and boundary shifts.
        </p>
      </div>

      {/* Summary KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-700 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600 block mb-1">New Structures</span>
            <div className="text-xl font-bold text-emerald-800 font-mono flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-700" /> {data.summary.new_buildings}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-orange-700 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600 block mb-1">Demolished / Removed</span>
            <div className="text-xl font-bold text-orange-900 font-mono flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-orange-700" /> {data.summary.removed_buildings}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-amber-600 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600 block mb-1">Shape Modifications</span>
            <div className="text-xl font-bold text-amber-800 font-mono flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-700" /> {data.summary.modified_buildings}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-teal-700 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600 block mb-1">Boundary Drifts</span>
            <div className="text-xl font-bold text-teal-800 font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-700" /> {data.summary.boundary_changes}
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-slate-700 rounded-xl shadow-sm">
            <span className="text-xs font-semibold text-slate-600 block mb-1">Attribute Shift</span>
            <div className="text-xl font-bold text-slate-800 font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-700" /> {data.summary.attribute_changes}
            </div>
          </div>
        </div>
      )}

      {/* Changes Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2.5">
          Detected Temporal Variations
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
              <tr>
                <th className="py-2.5 px-3">Change Classification</th>
                <th className="py-2.5 px-3">Feature ID</th>
                <th className="py-2.5 px-3">Baseline State (2020)</th>
                <th className="py-2.5 px-3">Current State (2024)</th>
                <th className="py-2.5 px-3">Area Delta</th>
                <th className="py-2.5 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data?.changes?.map((c: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                        c.change_type === 'NEW_BUILDING'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : c.change_type === 'REMOVED_BUILDING'
                          ? 'bg-orange-50 text-orange-900 border border-orange-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {c.change_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 font-bold">{c.feature_id}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.previous_state}</td>
                  <td className="py-2.5 px-3 text-slate-900 font-medium">{c.current_state}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-800 font-bold">{c.area_delta_sqm > 0 ? `+${c.area_delta_sqm}` : c.area_delta_sqm} m²</td>
                  <td className="py-2.5 px-3 font-mono text-teal-800 font-bold">{Math.round(c.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

