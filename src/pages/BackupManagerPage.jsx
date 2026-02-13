import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Archive, Download, Trash2, Plus, RefreshCw, HardDrive, Clock
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const mb = bytes / (1024 ** 2);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleString();
}

export default function BackupManagerPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await api.createBackup();
      alert(result.message || 'Backup created.');
      fetchBackups();
    } catch (err) {
      alert(err.error || 'Failed to create backup.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete backup "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteBackup(name);
      setBackups(prev => prev.filter(b => b.name !== name));
    } catch (err) {
      alert(err.error || 'Failed to delete.');
    }
  };

  const handleDownload = (name) => {
    window.open(api.downloadBackupUrl(name), '_blank');
  };

  const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Backup Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBackups} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleCreate} disabled={creating} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <Archive className="w-8 h-8 text-mc-accent mx-auto mb-2" />
          <p className="text-2xl font-bold">{backups.length}</p>
          <p className="text-xs text-gray-400">Total Backups</p>
        </div>
        <div className="card text-center">
          <HardDrive className="w-8 h-8 text-mc-yellow mx-auto mb-2" />
          <p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
          <p className="text-xs text-gray-400">Total Size</p>
        </div>
        <div className="card text-center">
          <Clock className="w-8 h-8 text-mc-green mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {backups.length > 0 ? formatDate(backups[0]?.modified) : 'None'}
          </p>
          <p className="text-xs text-gray-400">Latest Backup</p>
        </div>
      </div>

      {/* Backup List */}
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading backups...</div>
      ) : backups.length === 0 ? (
        <div className="card text-center text-gray-500 py-8">
          No backups found. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup) => (
            <div
              key={backup.name}
              className="card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-mono text-sm font-medium">{backup.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(backup.size)} — {formatDate(backup.modified)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(backup.name)}
                  className="btn-secondary text-xs flex items-center gap-1"
                  title="Download"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <button
                  onClick={() => handleDelete(backup.name)}
                  className="btn-danger text-xs flex items-center gap-1"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="card text-xs text-gray-500">
        <p>Backups are automatically created every 6 hours via cron. Oldest backups are rotated out after 14 are stored.</p>
        <p className="mt-1">Backups include: worlds, plugin configs, server.properties, and other configuration files.</p>
      </div>
    </div>
  );
}
