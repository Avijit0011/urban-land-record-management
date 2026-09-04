import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { WebGISMapPage } from './pages/WebGISMapPage';
import { HarmonizationPage } from './pages/HarmonizationPage';
import { ConflictsPage } from './pages/ConflictsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ImageryFeatureExtractionPage } from './pages/ImageryFeatureExtractionPage';
import { ChangeDetectionPage } from './pages/ChangeDetectionPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { fetchStatistics, loadDemoDataset, executeHarmonization, triggerSpatialMatch, Statistics } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [stats, setStats] = useState<Statistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const data = await fetchStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    showToast('Loading synthetic urban demo dataset into PostGIS...');
    try {
      await loadDemoDataset();
      await loadStats();
      showToast('Demo dataset loaded! 240 Parcels & 166 Footprints active.');
    } catch (err) {
      console.error('Failed to load demo dataset:', err);
      showToast('Error loading demo dataset.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleHarmonize = async () => {
    showToast('Running harmonization pipeline...');
    try {
      await executeHarmonization();
      await loadStats();
      showToast('Harmonization completed successfully!');
    } catch (err) {
      console.error('Harmonization error:', err);
    }
  };

  const handleSpatialMatch = async () => {
    showToast('Running ML spatial matching model...');
    try {
      await triggerSpatialMatch();
      await loadStats();
      showToast('ML Spatial Matching completed!');
    } catch (err) {
      console.error('Spatial match error:', err);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadDemo={handleLoadDemo}
        isDemoLoading={isDemoLoading}
        openConflictsCount={stats?.kpis?.open_conflicts || 4}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 px-3.5 py-2.5 bg-slate-900 border border-slate-700 text-white text-xs font-mono font-medium rounded-md shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 md:p-5">
        {activeTab === 'dashboard' && (
          <DashboardPage
            stats={stats}
            loading={statsLoading}
            setActiveTab={setActiveTab}
            onHarmonize={handleHarmonize}
            onSpatialMatch={handleSpatialMatch}
          />
        )}

        {activeTab === 'datasets' && <DatasetsPage />}

        {activeTab === 'map' && <WebGISMapPage />}

        {activeTab === 'harmonization' && <HarmonizationPage />}

        {activeTab === 'conflicts' && <ConflictsPage />}

        {activeTab === 'comparison' && <ComparisonPage />}

        {activeTab === 'imagery' && <ImageryFeatureExtractionPage />}

        {activeTab === 'change_detection' && <ChangeDetectionPage />}

        {activeTab === 'analytics' && <AnalyticsPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 text-center text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors duration-200">
        GeoHarmonize AI &bull; Municipal Spatial Record Integration &bull; PostGIS 15 Engine
      </footer>
    </div>
  );
};

export default App;


