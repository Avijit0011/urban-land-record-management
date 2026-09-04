import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, FolderKanban, BarChart3, ShieldCheck, Activity, MapPin, ArrowRight, RefreshCw, Eye } from 'lucide-react';
import { Dataset, DatasetAnalysis, fetchDatasets, uploadDatasetFile, fetchDatasetAnalysis } from '../services/api';
import { SkeletonTable, SkeletonBox } from '../components/Skeleton';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedType, setSelectedType] = useState('Cadastral');
  const [sourceName, setSourceName] = useState('Municipal GIS Office');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [analysis, setAnalysis] = useState<DatasetAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const data = await fetchDatasets();
      setDatasets(data);
      if (data.length > 0) {
        handleSelectDataset(data[0]);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataset = async (dataset: Dataset) => {
    setSelectedDataset(dataset);
    setAnalyzing(true);
    try {
      const data = await fetchDatasetAnalysis(dataset.id);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load dataset analysis:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', selectedType);
    formData.append('source', sourceName);

    setUploading(true);
    try {
      const res = await uploadDatasetFile(formData);
      setUploadSuccess(`Dataset '${res.name}' uploaded and validated successfully!`);
      setTimeout(() => setUploadSuccess(null), 4000);
      const updatedDatasets = await fetchDatasets();
      setDatasets(updatedDatasets);
      const newDs = updatedDatasets.find(d => d.id === res.id) || res;
      handleSelectDataset(newDs);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload & File Ingestion Panel */}
      <div className="bg-white dark:bg-slate-900/90 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 dark:text-teal-400 mb-1">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>PostGIS Ingestion & Metadata Extractor</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Geospatial Data File Ingestion & Automated Analysis</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
            Ingest multi-source vector and raster geospatial files (GeoJSON, Shapefile ZIP, GeoTIFF, CSV) to analyze CRS projections, geometry validity rates, and land area metrics.
          </p>
        </div>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Layer Classification</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 font-sans shadow-xs"
              >
                <option value="Cadastral">Cadastral Parcels</option>
                <option value="Building">Building Footprints</option>
                <option value="Imagery">Drone / Satellite Imagery</option>
                <option value="Road">Road Network</option>
                <option value="Utility">Utility Infrastructure</option>
                <option value="Revenue">Revenue Records</option>
                <option value="Survey">GNSS Survey Points</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Data Source Tag</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. Municipal Survey Dept 2024"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-700 dark:focus:border-teal-500 font-sans shadow-xs"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Add New Geospatial Layer File</label>
            <label className="flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-600 dark:hover:border-teal-500 rounded-xl p-5 cursor-pointer bg-slate-50/70 dark:bg-slate-950/50 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all duration-200 group">
              <UploadCloud className="w-7 h-7 text-teal-700 dark:text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {uploading ? 'Extracting Spatial Metadata & Validating Topology...' : 'Click or Drag & Drop GeoJSON, Shapefile ZIP, or GeoTIFF'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">Automatic EPSG:3857 & EPSG:4326 Reprojection</span>
              <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Dataset Analysis & Health Studio */}
      {selectedDataset && (
        <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
                Dataset Spatial Analysis: {selectedDataset.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-bold">
                {selectedDataset.crs}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold uppercase">
                {selectedDataset.status}
              </span>
            </div>
          </div>

          {analyzing ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-700 dark:text-teal-400" />
              <span>Analyzing dataset geometries and attribute statistics...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Analytics Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Feature Count</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">{analysis.feature_count.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">{analysis.geometry_type}</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Topology Validity Rate</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">{analysis.metrics.validity_percentage}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">{analysis.metrics.repaired_geometries} repaired via Shapely</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Mean Parcel Area</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">{analysis.metrics.mean_area_sqm.toLocaleString()} m²</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">Range: {analysis.metrics.min_area_sqm} - {analysis.metrics.max_area_sqm} m²</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Coverage Area</span>
                  <span className="text-lg font-bold text-teal-700 dark:text-teal-400 font-mono">{(analysis.metrics.total_area_sqm / 10000).toFixed(2)} Ha</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">{analysis.metrics.total_area_sqm.toLocaleString()} m² total</span>
                </div>
              </div>

              {/* Land Use Classification Distribution */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono block">
                  Land-Use Attribute Distribution Analysis
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 font-mono text-xs">
                  {analysis.land_use_breakdown.map((item, idx) => (
                    <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-sans truncate">{item.type}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Datasets Table */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-3 shadow-sm backdrop-blur-sm">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2.5">
            <FolderKanban className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            <span>Registered PostGIS Spatial Datasets ({datasets.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Dataset Name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Detected CRS</th>
                  <th className="py-2.5 px-3">Feature Count</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {datasets.map((d) => {
                  const isSelected = selectedDataset?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDataset(d)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-teal-50/60 dark:bg-teal-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                        <span>{d.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{d.dataset_type}</td>
                      <td className="py-3 px-3 text-teal-700 dark:text-teal-400 font-mono font-bold">{d.crs}</td>
                      <td className="py-3 px-3 font-mono text-slate-800 dark:text-slate-200">{d.feature_count}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(d.uploaded_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDataset(d);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 rounded-md border border-teal-200 dark:border-teal-800/60 transition-all flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Analyze</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


