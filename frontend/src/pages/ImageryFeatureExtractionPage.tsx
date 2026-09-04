import React, { useState } from 'react';
import { Cpu, Sliders, CheckCircle2, Play, Building2 } from 'lucide-react';
import { triggerImageryExtraction } from '../services/api';

export const ImageryFeatureExtractionPage: React.FC = () => {
  const [threshold, setThreshold] = useState(120);
  const [extracting, setExtracting] = useState(false);
  const [res, setRes] = useState<any | null>(null);

  const handleRunExtraction = async () => {
    setExtracting(true);
    try {
      const data = await triggerImageryExtraction(threshold);
      setRes(data);
    } catch (err) {
      console.error('Failed to extract building features:', err);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-700">
          <Cpu className="w-3.5 h-3.5" />
          <span>Computer Vision & Raster Segmentation Engine</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">GeoTIFF Drone Imagery Building Footprint Extraction</h2>
        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Segment building boundaries directly from high-resolution orthorectified GeoTIFF imagery using OpenCV contour extraction, polygon simplification, and PostGIS vectorization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Controls (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
            <Sliders className="w-3.5 h-3.5 text-teal-800" />
            <span>Segmentation Parameters</span>
          </h3>

          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-md border border-slate-200">
            <div className="flex justify-between text-xs text-slate-700 font-medium">
              <span>Binarization Threshold:</span>
              <span className="font-mono font-bold text-teal-800">{threshold}</span>
            </div>
            <input
              type="range"
              min="50"
              max="220"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-teal-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Sensitive (50)</span>
              <span>Strict (220)</span>
            </div>
          </div>

          <button
            onClick={handleRunExtraction}
            disabled={extracting}
            className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs border border-emerald-600 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
            <span>{extracting ? 'Segmenting Raster & Vectorizing...' : 'Run CV Extraction'}</span>
          </button>
        </div>

        {/* Results Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 space-y-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>PostGIS Vector Feature Output Preview</span>
          </h3>

          {res ? (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold font-mono text-emerald-800">Extracted {res.extracted_count} Building Footprints</div>
                  <div className="text-[11px] text-slate-600">Imported {res.imported_new_buildings} new vector polygons into PostGIS.</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto font-mono">
                {res.features.slice(0, 12).map((f: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-amber-800 block">{f.properties.building_id}</span>
                    <div className="text-[11px] text-slate-600">Area: {f.properties.area} m²</div>
                    <div className="text-[11px] text-emerald-700 font-bold">
                      Confidence: {Math.round(f.properties.confidence_score * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 bg-slate-50 rounded-md border border-slate-200 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5">
              <Building2 className="w-6 h-6 text-slate-400" />
              <span>Adjust threshold slider and click 'Run CV Extraction' to segment GeoTIFF footprints.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

