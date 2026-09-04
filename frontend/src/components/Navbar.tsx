import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Map as MapIcon, 
  Layers, 
  AlertTriangle, 
  GitCompare, 
  Cpu, 
  History, 
  BarChart3, 
  RefreshCw,
  Globe2,
  Sun,
  Moon,
  Trash2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoadDemo: () => void;
  isDemoLoading: boolean;
  onRemoveDemo: () => void;
  isDemoRemoving: boolean;
  openConflictsCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadDemo,
  isDemoLoading,
  onRemoveDemo,
  isDemoRemoving,
  openConflictsCount,
  darkMode,
  onToggleDarkMode
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: FolderKanban },
    { id: 'map', label: 'WebGIS Map', icon: MapIcon },
    { id: 'harmonization', label: 'Harmonization', icon: Layers },
    { 
      id: 'conflicts', 
      label: 'Conflicts', 
      icon: AlertTriangle,
      badge: openConflictsCount > 0 ? openConflictsCount : undefined 
    },
    { id: 'comparison', label: 'Compare Views', icon: GitCompare },
    { id: 'imagery', label: 'AI Extraction', icon: Cpu },
    { id: 'change_detection', label: 'Change Detection', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 rounded-md bg-teal-800 dark:bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                GeoHarmonize AI
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded">
                PostGIS 15 Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Municipal Land Record Administration</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                    isActive 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-800' 
                      : 'bg-orange-200/80 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions & Dark Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle Dark Mode"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          <button
            onClick={onLoadDemo}
            disabled={isDemoLoading || isDemoRemoving}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-teal-800 dark:bg-teal-700 hover:bg-teal-900 dark:hover:bg-teal-600 text-white shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-200 ${isDemoLoading ? 'animate-spin' : ''}`} />
            <span>{isDemoLoading ? 'Seeding Dataset...' : 'Seed Demo Data'}</span>
          </button>

          <button
            onClick={onRemoveDemo}
            disabled={isDemoLoading || isDemoRemoving}
            title="Clear synthetic demo dataset from database"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isDemoRemoving ? 'animate-spin' : ''}`} />
            <span>{isDemoRemoving ? 'Clearing...' : 'Clear Demo Data'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};




