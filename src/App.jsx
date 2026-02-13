import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConsolePage from './pages/ConsolePage';
import FileManagerPage from './pages/FileManagerPage';
import PluginManagerPage from './pages/PluginManagerPage';
import PlayerManagerPage from './pages/PlayerManagerPage';
import WorldManagerPage from './pages/WorldManagerPage';
import BackupManagerPage from './pages/BackupManagerPage';
import ScheduleManagerPage from './pages/ScheduleManagerPage';
import SettingsPage from './pages/SettingsPage';
import WhitelistPage from './pages/WhitelistPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mc-darker">
        <div className="animate-pulse text-mc-accent text-xl">Loading...</div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/console" element={<ConsolePage />} />
                <Route path="/files/*" element={<FileManagerPage />} />
                <Route path="/plugins" element={<PluginManagerPage />} />
                <Route path="/players" element={<PlayerManagerPage />} />
                <Route path="/whitelist" element={<WhitelistPage />} />
                <Route path="/world" element={<WorldManagerPage />} />
                <Route path="/backups" element={<BackupManagerPage />} />
                <Route path="/schedules" element={<ScheduleManagerPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
