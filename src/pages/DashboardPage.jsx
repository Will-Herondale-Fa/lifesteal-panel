import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Activity, Users, HardDrive, Cpu, Clock,
  Server, RefreshCw, Play, Square, RotateCw, Copy, Check,
  Monitor, Loader2
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
  const [vmStatus, setVmStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const SERVER_IP = 'lifesteal-smp.centralindia.cloudapp.azure.com';

  const copyIP = () => {
    navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchVmStatus = useCallback(async () => {
    try {
      const data = await api.getVmStatus();
      setVmStatus(data);
      return data;
    } catch {
      setVmStatus({ powerState: 'unknown', displayStatus: 'Unknown' });
      return null;
    }
  }, []);

  const fetchServerStatus = useCallback(async () => {
    try {
      const data = await api.getServerStatus();
      setStatus(data);
      return true;
    } catch {
      setStatus(null);
      return false;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const vm = await fetchVmStatus();
    if (vm?.powerState === 'running') {
      await fetchServerStatus();
    } else {
      setStatus(null);
    }
    setLoading(false);
  }, [fetchVmStatus, fetchServerStatus]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleStart = async () => {
    const power = vmStatus?.powerState;
    const vmIsOff = power === 'deallocated' || power === 'stopped';

    setActionLoading('starting');
    try {
      if (vmIsOff) {
        setActionMessage('Starting VM...');
        await api.startVm();

        setActionMessage('Waiting for VM to boot...');
        let vmReady = false;
        for (let i = 0; i < 60 && !vmReady; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const vm = await api.getVmStatus();
          setVmStatus(vm);
          if (vm?.powerState === 'running') vmReady = true;
        }
        if (!vmReady) throw new Error('VM startup timed out');

        setActionMessage('Waiting for panel backend...');
        let apiReady = false;
        for (let i = 0; i < 24 && !apiReady; i++) {
          await new Promise(r => setTimeout(r, 5000));
          try {
            await api.getServerStatus();
            apiReady = true;
          } catch {}
        }
        if (!apiReady) throw new Error('Backend did not come online in time');
      }

      setActionMessage('Starting Minecraft server...');
      await api.startServer();

      await new Promise(r => setTimeout(r, 3000));
      await fetchAll();
    } catch (err) {
      alert('Failed to start: ' + (err.message || err.error || 'Unknown error'));
      await fetchAll();
    } finally {
      setActionLoading('');
      setActionMessage('');
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop the server?\n\nThis will also shut down the VM to save costs. Click Start to bring everything back online.')) return;
    setActionLoading('stopping');
    try {
      await api.stopServer();
      await new Promise(r => setTimeout(r, 5000));
      await fetchAll();
    } catch (err) {
      alert(err.error || 'Failed to stop server.');
    } finally {
      setActionLoading('');
    }
  };

  const handleRestart = async () => {
    setActionLoading('restarting');
    try {
      await api.restartServer();
      await new Promise(r => setTimeout(r, 3000));
      await fetchAll();
    } catch (err) {
      alert(err.error || 'Failed to restart server.');
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <div className="animate-pulse text-gray-400">Loading dashboard...</div>;
  }

  const vmPower = vmStatus?.powerState || 'unknown';
  const vmRunning = vmPower === 'running';
  const vmDeallocated = vmPower === 'deallocated' || vmPower === 'stopped';
  const vmStarting = vmPower === 'starting';
  const serverOnline = status?.online === true;
  const tps1m = status?.tps?.tps1m;
  const totalWorldSize = status?.worlds?.reduce((sum, w) => sum + (w.size || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {vmRunning && status?.serverVersion
              ? `${status.serverVersion} — ${serverOnline ? 'Online' : 'Offline'}`
              : `VM ${vmStatus?.displayStatus || 'Unknown'}`}
          </p>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
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

      {/* Dual Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VM Status */}
        <div className={clsx(
          'card flex items-center justify-between',
          vmRunning ? 'border-emerald-700/30' : vmStarting ? 'border-yellow-700/30' : 'border-red-700/30'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-3 h-3 rounded-full',
              vmRunning ? 'bg-mc-green animate-pulse' : vmStarting ? 'bg-mc-yellow animate-pulse' : 'bg-mc-red'
            )} />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Virtual Machine</p>
              <p className="text-lg font-semibold">{vmStatus?.displayStatus || 'Unknown'}</p>
            </div>
          </div>
          <Monitor className={clsx('w-5 h-5', vmRunning ? 'text-mc-green' : vmStarting ? 'text-mc-yellow' : 'text-gray-500')} />
        </div>

        {/* Server Status */}
        <div className={clsx(
          'card flex items-center justify-between',
          !vmRunning ? 'border-gray-700/30 opacity-60' :
          serverOnline ? 'border-emerald-700/30' : 'border-red-700/30'
        )}>
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-3 h-3 rounded-full',
              !vmRunning ? 'bg-gray-600' :
              serverOnline ? 'bg-mc-green animate-pulse' : 'bg-mc-red'
            )} />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Minecraft Server</p>
              <p className="text-lg font-semibold">
                {!vmRunning ? 'Unreachable' : serverOnline ? 'Online' : 'Offline'}
              </p>
              {vmRunning && serverOnline && (
                <p className="text-xs text-gray-500">Uptime: {formatUptime(status?.uptime)}</p>
              )}
            </div>
          </div>
          <Server className={clsx('w-5 h-5', !vmRunning ? 'text-gray-600' : serverOnline ? 'text-mc-green' : 'text-gray-500')} />
        </div>
      </div>

      {/* Action Bar */}
      <div className="card flex items-center justify-between">
        <div>
          {actionMessage && (
            <div className="flex items-center gap-2 text-mc-yellow">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{actionMessage}</span>
            </div>
          )}
          {!actionMessage && !actionLoading && vmDeallocated && (
            <p className="text-sm text-gray-400">VM is stopped. Click Start to power on and launch the server.</p>
          )}
          {!actionMessage && !actionLoading && vmRunning && !serverOnline && (
            <p className="text-sm text-gray-400">VM is running but Minecraft is stopped.</p>
          )}
          {!actionMessage && !actionLoading && vmRunning && serverOnline && (
            <p className="text-sm text-gray-400">Everything is running normally.</p>
          )}
          {!actionMessage && !actionLoading && vmStarting && (
            <p className="text-sm text-mc-yellow">VM is starting up...</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!actionLoading && (vmDeallocated || (vmRunning && !serverOnline)) && (
            <button onClick={handleStart} className="btn-success flex items-center gap-2">
              <Play className="w-4 h-4" />
              {vmDeallocated ? 'Start' : 'Start Server'}
            </button>
          )}
          {!actionLoading && vmRunning && serverOnline && (
            <>
              <button onClick={handleRestart} className="btn-secondary flex items-center gap-2">
                <RotateCw className="w-4 h-4" /> Restart
              </button>
              <button onClick={handleStop} className="btn-danger flex items-center gap-2">
                <Square className="w-4 h-4" /> Stop
              </button>
            </>
          )}
          {actionLoading && !actionMessage && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm capitalize">{actionLoading}...</span>
            </div>
          )}
        </div>
      </div>

      {vmRunning && serverOnline && (<>
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
              <dd><span className="badge-green">Online</span></dd>
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
      </>)}
    </div>
  );
}
