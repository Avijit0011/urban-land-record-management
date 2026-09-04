import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, Layers, AlertTriangle, MapPin, Info, Sliders, CheckCircle } from 'lucide-react';
import { GeoJSONFeatureCollection, fetchParcelsGeoJSON, fetchBuildingsGeoJSON, fetchConflicts, Conflict } from '../services/api';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface WebGISMapPageProps {
  onSelectConflict?: (conflictId: string) => void;
}

// Controller component to smoothly animate pan/zoom to searched parcel
const MapViewController: React.FC<{ targetCoords: [number, number] | null }> = ({ targetCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, 18, { duration: 1.2 });
    }
  }, [targetCoords, map]);
  return null;
};

export const WebGISMapPage: React.FC<WebGISMapPageProps> = () => {
  const [parcelsGeoJSON, setParcelsGeoJSON] = useState<GeoJSONFeatureCollection | null>(null);
  const [buildingsGeoJSON, setBuildingsGeoJSON] = useState<GeoJSONFeatureCollection | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);

  // Layer visibility toggles
  const [showParcels, setShowParcels] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [colorMode, setColorMode] = useState<'landuse' | 'confidence' | 'conflict'>('landuse');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [targetFlyCoords, setTargetFlyCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [parcelsData, buildingsData, conflictsData] = await Promise.all([
        fetchParcelsGeoJSON(),
        fetchBuildingsGeoJSON(),
        fetchConflicts('open')
      ]);
      setParcelsGeoJSON(parcelsData);
      setBuildingsGeoJSON(buildingsData);
      setConflicts(conflictsData);
    } catch (err) {
      console.error('Failed to load WebGIS map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert Web Mercator (x, y in meters) to Lat/Lng [lat, lng] for Leaflet
  const mercatorToLatLng = (x: number, y: number): [number, number] => {
    const lng = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
    return [lat, lng];
  };

  // GeoJSON style for parcels
  const getParcelStyle = (feature: any) => {
    const props = feature.properties || {};
    let color = '#0f766e'; // muted teal

    if (colorMode === 'conflict' && props.has_conflict) {
      color = '#c2410c'; // terracotta / burnt orange
    } else if (colorMode === 'confidence') {
      const conf = props.confidence_score || 1.0;
      if (conf >= 0.85) color = '#15803d'; // muted sage green
      else if (conf >= 0.70) color = '#d97706'; // muted amber
      else color = '#c2410c'; // terracotta
    } else {
      // Land use colors (controlled subdued palette)
      const lu = (props.land_use || '').toLowerCase();
      if (lu.includes('res')) color = '#0f766e'; // muted teal
      else if (lu.includes('comm')) color = '#c2410c'; // terracotta
      else if (lu.includes('ind')) color = '#475569'; // slate
      else if (lu.includes('agri')) color = '#65a30d'; // muted olive
      else if (lu.includes('pub') || lu.includes('gov')) color = '#0369a1'; // slate blue
      else color = '#64748b';
    }

    const isSelected = selectedFeature?.properties?.parcel_id === props.parcel_id;

    return {
      fillColor: color,
      weight: isSelected ? 2.5 : 1.5,
      opacity: 0.9,
      color: isSelected ? '#0f172a' : color,
      fillOpacity: isSelected ? 0.65 : 0.4,
    };
  };

  // Convert Web Mercator GeoJSON coordinates to LatLng GeoJSON for Leaflet display
  const projectGeoJSONToLatLng = (geojson: GeoJSONFeatureCollection | null) => {
    if (!geojson) return null;

    const copy = JSON.parse(JSON.stringify(geojson));
    copy.features = copy.features.map((f: any) => {
      if (f.geometry && f.geometry.coordinates) {
        const convertRing = (ring: any[]): any[] => {
          return ring.map((pt) => {
            if (typeof pt[0] === 'number' && typeof pt[1] === 'number') {
              if (Math.abs(pt[0]) > 180 || Math.abs(pt[1]) > 90) {
                const [lat, lng] = mercatorToLatLng(pt[0], pt[1]);
                return [lng, lat];
              }
            }
            if (Array.isArray(pt)) return convertRing(pt);
            return pt;
          });
        };
        f.geometry.coordinates = convertRing(f.geometry.coordinates);
      }
      return f;
    });
    return copy;
  };

  const projectedParcels = projectGeoJSONToLatLng(parcelsGeoJSON);
  const projectedBuildings = projectGeoJSONToLatLng(buildingsGeoJSON);

  // Search feature click handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !projectedParcels) return;

    const term = searchQuery.toLowerCase().trim();
    const found = projectedParcels.features.find((f: any) => {
      const p = f.properties || {};
      return (
        (p.parcel_id && p.parcel_id.toLowerCase().includes(term)) ||
        (p.survey_number && p.survey_number.toLowerCase().includes(term)) ||
        (p.owner_reference && p.owner_reference.toLowerCase().includes(term))
      );
    });

    if (found && found.geometry && found.geometry.coordinates) {
      setSelectedFeature(found);
      const ring = found.geometry.coordinates[0];
      if (ring && ring.length > 0) {
        const lng = ring[0][0];
        const lat = ring[0][1];
        setTargetFlyCoords([lat, lng]);
      }
    }
  };

  const onEachParcel = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        setSelectedFeature(feature);
      },
    });
  };

  // Center coordinate around synthetic urban area
  const defaultCenter: [number, number] = mercatorToLatLng(8626300.0, 2156250.0);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-5.5rem)] gap-3.5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur-sm p-1.5 shadow-sm">
      {/* Sidebar Controls & Inspector */}
      <div className="w-full lg:w-80 flex flex-col gap-3.5 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 overflow-y-auto">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search Parcel ID, Survey No, Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-600 dark:focus:border-teal-500 focus:ring-1 focus:ring-teal-600/30 transition-all font-sans shadow-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
        </form>

        {/* Layer Visibility Toggles */}
        <div className="space-y-2.5 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" /> Layer Controls
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">EPSG:3857</span>
          </div>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-700 dark:bg-teal-500 shadow-xs" />
              <span>Cadastral Parcels ({parcelsGeoJSON?.features.length || 0})</span>
            </span>
            <input
              type="checkbox"
              checked={showParcels}
              onChange={(e) => setShowParcels(e.target.checked)}
              className="accent-teal-700 dark:accent-teal-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-700 dark:bg-orange-500 shadow-xs" />
              <span>Building Footprints ({buildingsGeoJSON?.features.length || 0})</span>
            </span>
            <input
              type="checkbox"
              checked={showBuildings}
              onChange={(e) => setShowBuildings(e.target.checked)}
              className="accent-orange-700 dark:accent-orange-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600 dark:bg-rose-500 shadow-xs" />
              <span>Flagged Conflicts ({conflicts.length})</span>
            </span>
            <input
              type="checkbox"
              checked={showConflicts}
              onChange={(e) => setShowConflicts(e.target.checked)}
              className="accent-rose-600 dark:accent-rose-500 rounded"
            />
          </label>
        </div>

        {/* Color Mode Switcher */}
        <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" /> Layer Styling
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
            <button
              onClick={() => setColorMode('landuse')}
              className={`py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                colorMode === 'landuse' ? 'bg-teal-700 dark:bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Land Use
            </button>
            <button
              onClick={() => setColorMode('confidence')}
              className={`py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                colorMode === 'confidence' ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Confidence
            </button>
            <button
              onClick={() => setColorMode('conflict')}
              className={`py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                colorMode === 'conflict' ? 'bg-rose-700 dark:bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Conflicts
            </button>
          </div>
        </div>

        {/* Selected Feature Detail Panel */}
        {selectedFeature ? (
          <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-mono">
                <MapPin className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" /> Parcel #{selectedFeature.properties.parcel_id}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                {Math.round((selectedFeature.properties.confidence_score || 0.95) * 100)}% Conf.
              </span>
            </div>

            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Survey No:</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{selectedFeature.properties.survey_number}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Owner Reference:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedFeature.properties.owner_reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Land Use Class:</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">{selectedFeature.properties.land_use}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Calculated Area:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{selectedFeature.properties.area} m²</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Dataset Source:</span>
                <span className="font-medium text-slate-500 dark:text-slate-400">{selectedFeature.properties.source_dataset}</span>
              </div>

              {selectedFeature.properties.has_conflict && (
                <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg text-rose-900 dark:text-rose-200 text-[11px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Flagged for Human Conflict Audit</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2 shadow-xs">
            <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span>Select any parcel polygon or search by ID to inspect properties.</span>
          </div>
        )}
      </div>

      {/* Main Leaflet Map Canvas */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-slate-200 shadow-xs">
        <MapContainer
          center={defaultCenter}
          zoom={16}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> Light Positron'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MapViewController targetCoords={targetFlyCoords} />

          {/* Cadastral Parcels Layer */}
          {showParcels && projectedParcels && (
            <GeoJSON
              key={`parcels-${colorMode}-${selectedFeature?.properties?.parcel_id || 'none'}`}
              data={projectedParcels as any}
              style={getParcelStyle}
              onEachFeature={onEachParcel}
            />
          )}

          {/* Building Footprints Layer */}
          {showBuildings && projectedBuildings && (
            <GeoJSON
              key="buildings"
              data={projectedBuildings as any}
              style={{
                fillColor: '#d97706',
                weight: 1.2,
                color: '#b45309',
                fillOpacity: 0.45,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};


