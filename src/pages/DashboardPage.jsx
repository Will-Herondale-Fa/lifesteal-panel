import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Activity, Users, HardDrive, Cpu, Clock,
  Server, RefreshCw, Play, Square, RotateCw, Copy, Check
} from 'lucide-react';
import clsx from 'clsx';

function StatCard({ icon: Icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', color)}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2 rounded-lg bg-mc-surface2">
          <Icon className={clsx('w-5 h-5', color)} />
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds) return 'N/A';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function tpsColor(tps) {
  if (!tps) return 'text-gray-400';
  if (tps >= 19) return 'text-mc-green';
  if (tps >= 15) return 'text-mc-yellow';
  return 'text-mc-red';
}

export default function DashboardPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [copied, setCopied] = useState(false);

  const SERVER_IP = 'lifesteal-smp.centralindia.cloudapp.azure.com';

  const copyIP = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getServerStatus();
      setStatus(data);
    } catch (err) {
      console.error('Status fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'start') await api.startServer();
      else if (action === 'stop') await api.stopServer();
      else if (action === 'restart') await api.restartServer();
      setTimeout(fetchStatus, 3000);
    } catch (err) {
      alert(err.error || `Failed to ${action} server.`);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="animate-pulse text-gray-400">Loading dashboard...</div>;
  }

  const tps1m = status?.tps?.tps1m;
  const totalWorldSize = status?.worlds?.reduce((sum, w) => sum + (w.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {status?.serverVersion} — {status?.online ? 'Online' : 'Offline'}
          </p>
        </div>
        <button onClick={fetchStatus} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Server IP / Join Info */}
      <div className="card bg-gradient-to-r from-mc-accent/10 to-mc-surface border-mc-accent/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Server Address</p>
            <p className="text-lg font-mono font-bold text-white">{SERVER_IP}</p>
            <p className="text-xs text-gray-500 mt-1">Minecraft Java Edition — Port 25565 (default)</p>
          </div>
          <button
            onClick={copyIP}
            className="btn-secondary flex items-center gap-2 shrink-0"
          >
            {copied ? <><Check className="w-4 h-4 text-mc-green" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy IP</>}
          </button>
        </div>
      </div>

      {/* Server Status Banner */}
      <div className={clsx(
        'card flex items-center justify-between',
        status?.online ? 'border-emerald-700/30' : 'border-red-700/30'
      )}>
        <div className="flex items-center gap-4">
          <div className={clsx(
            'w-3 h-3 rounded-full animate-pulse',
            status?.online ? 'bg-mc-green' : 'bg-mc-red'
          )} />
          <div>
            <p className="text-lg font-semibold">
              Server is {status?.online ? 'Online' : 'Offline'}
            </p>
            {status?.online && (
              <p className="text-sm text-gray-400">
                Uptime: {formatUptime(status?.uptime)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!status?.online ? (
            <button
              onClick={() => handleAction('start')}
              disabled={!!actionLoading}
              className="btn-success flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {actionLoading === 'start' ? 'Starting...' : 'Start'}
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('restart')}
                disabled={!!actionLoading}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                {actionLoading === 'restart' ? 'Restarting...' : 'Restart'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to stop the server?')) {
                    handleAction('stop');
                  }
                }}
                disabled={!!actionLoading}
                className="btn-danger flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="TPS"
          value={tps1m?.toFixed(1) || 'N/A'}
          sub={tps1m ? `${status.tps.tps5m?.toFixed(1)} / ${status.tps.tps15m?.toFixed(1)} (5m/15m)` : null}
          color={tpsColor(tps1m)}
        />
        <StatCard
          icon={Users}
          label="Players"
          value={`${status?.players?.count || 0} / ${status?.players?.max || 20}`}
          sub={status?.players?.online?.length > 0 ? status.players.online.join(', ') : 'No players online'}
        />
        <StatCard
          icon={HardDrive}
          label="World Size"
          value={formatBytes(totalWorldSize)}
          sub={status?.worlds?.map(w => `${w.name}: ${formatBytes(w.size)}`).join(' | ')}
        />
        <StatCard
          icon={Cpu}
          label="Memory"
          value={formatBytes(status?.memory)}
          sub="Server process"
        />
      </div>

      {/* Online Players */}
      {status?.players?.online?.length > 0 && (
        <div className="card">
          <h2 className="card-header">
            <Users className="w-5 h-5 text-mc-accent" />
            Online Players ({status.players.count})
          </h2>
          <div className="flex flex-wrap gap-2">
            {status.players.online.map(name => (
              <div key={name} className="flex items-center gap-2 bg-mc-surface2 rounded-lg px-3 py-2">
                <img
                  src={`https://mc-heads.net/avatar/${name}/24`}
                  alt={name}
                  className="w-6 h-6 rounded"
                />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="card-header">
            <Server className="w-5 h-5 text-mc-accent" />
            Server Info
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Version</dt>
              <dd>{status?.serverVersion || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">JAR</dt>
              <dd>{status?.jarName || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Status</dt>
              <dd>{status?.online ? <span className="badge-green">Online</span> : <span className="badge-red">Offline</span>}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="card-header">
            <Clock className="w-5 h-5 text-mc-accent" />
            World Details
          </h2>
          <dl className="space-y-2 text-sm">
            {status?.worlds?.map(w => (
              <div key={w.name} className="flex justify-between">
                <dt className="text-gray-400">{w.name}</dt>
                <dd>{formatBytes(w.size)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
