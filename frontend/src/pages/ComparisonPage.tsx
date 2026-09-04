import React from 'react';
import { GitCompare, MapPin, Building2 } from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-800">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Synchronized Multi-Layer Dataset Comparison</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cadastral Revenue Map vs. Drone Survey Vector</h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Compare ground-truth cadastral parcel boundaries directly against high-resolution drone imagery and extracted building footprints for spatial alignment.
        </p>
      </div>

      {/* Synchronized Dual Comparison Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dataset A */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5 text-teal-700" /> Dataset A: Cadastral Revenue Map (2020)
            </span>
            <span className="text-[10px] bg-teal-50 text-teal-900 px-2 py-0.5 rounded border border-teal-200 font-mono font-bold">
              240 Parcels
            </span>
          </div>

          <div className="h-64 rounded-lg border border-slate-300 relative overflow-hidden group shadow-inner bg-slate-900">
            <img 
              src="/images/cadastral_ortho.png" 
              alt="Cadastral Orthophoto Aerial View" 
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-teal-900/20 mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-200 shadow-md text-xs">
              <div className="flex items-center justify-between font-mono font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-teal-900">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" /> Parcel Vectors (EPSG:3857)
                </span>
                <span className="text-[10px] text-slate-500">Scale 1:500</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-md text-xs space-y-1.5 border border-slate-200 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Land-Use Classes:</span>
              <span className="text-slate-900 font-semibold">6 Categories</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Survey Accuracy:</span>
              <span className="text-emerald-800 font-bold">&plusmn; 0.05 m</span>
            </div>
          </div>
        </div>

        {/* Dataset B */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5 font-mono">
              <Building2 className="w-3.5 h-3.5 text-orange-700" /> Dataset B: Drone CV Footprints (2024)
            </span>
            <span className="text-[10px] bg-orange-50 text-orange-900 px-2 py-0.5 rounded border border-orange-200 font-mono font-bold">
              166 Footprints
            </span>
          </div>

          <div className="h-64 rounded-lg border border-slate-300 relative overflow-hidden group shadow-inner bg-slate-900">
            <img 
              src="/images/cadastral_ortho.png" 
              alt="Extracted Drone Footprints View" 
              className="w-full h-full object-cover brightness-110 contrast-125 filter hue-rotate-15 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-orange-900/20 mix-blend-overlay pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-2.5 rounded-lg border border-slate-200 shadow-md text-xs">
              <div className="flex items-center justify-between font-mono font-semibold text-slate-900">
                <span className="flex items-center gap-1.5 text-orange-900 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-orange-700" /> Extracted Footprints (5 cm/px)
                </span>
                <span className="text-[10px] text-emerald-800 font-bold">CV Active</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-md text-xs space-y-1.5 border border-slate-200 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>Matched to Parcels:</span>
              <span className="text-emerald-700 font-bold">164 Footprints (98.8%)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Spillovers Detected:</span>
              <span className="text-rose-700 font-bold">2 Structures</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

