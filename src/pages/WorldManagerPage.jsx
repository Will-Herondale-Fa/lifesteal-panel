import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Globe, Map, Layers, RefreshCw, AlertTriangle, Package
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
}

export default function WorldManagerPage() {
  const [worldInfo, setWorldInfo] = useState(null);
  const [border, setBorder] = useState(null);
  const [datapacks, setDatapacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borderSize, setBorderSize] = useState('');
  const [pregenWorld, setPregenWorld] = useState('world');
  const [pregenRadius, setPregenRadius] = useState(5000);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [info, borderData, dpData] = await Promise.all([
        api.getWorldInfo(),
        api.getWorldBorder(),
        api.getDatapacks().catch(() => ({ datapacks: [] })),
      ]);
      setWorldInfo(info);
      setBorder(borderData);
      setBorderSize(borderData.maxWorldSize?.toString() || '');
      setDatapacks(dpData.datapacks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleBorderUpdate = async () => {
    const size = parseInt(borderSize, 10);
    if (!size || size < 1) return;
    try {
      await api.updateWorldBorder(size);
      alert('World border updated. Restart to apply.');
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handlePregen = async () => {
    try {
      const result = await api.startPregen(pregenWorld, pregenRadius);
      alert(`Pre-generation queued.\nCommands:\n${result.commands.join('\n')}`);
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handleReset = async (world) => {
    if (!confirm(`RESET "${world}"?\n\nThis will DELETE the world data. A backup will be created.\nThe server must be stopped.`)) return;
    try {
      const result = await api.resetWorld(world);
      alert(result.message);
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400">Loading world data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">World Management</h1>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* World Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {worldInfo?.worlds?.map(world => (
          <div key={world.name} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-mc-accent" />
                <h3 className="font-semibold">{world.name}</h3>
              </div>
              <span className={world.exists ? 'badge-green' : 'badge-red'}>
                {world.exists ? 'Exists' : 'Missing'}
              </span>
            </div>
            {world.exists && (
              <>
                <p className="text-sm text-gray-400">Size: {formatBytes(world.size)}</p>
                <button
                  onClick={() => handleReset(world.name)}
                  className="btn-danger text-xs mt-3 flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" /> Reset World
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Seed */}
      {worldInfo?.seed && (
        <div className="card">
          <h2 className="card-header">Seed</h2>
          <code className="text-mc-green font-mono">{worldInfo.seed || '(not set — random)'}</code>
        </div>
      )}

      {/* World Border */}
      <div className="card">
        <h2 className="card-header"><Layers className="w-5 h-5 text-mc-accent" /> World Border</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max World Size (blocks from center)</label>
            <input
              type="number"
              value={borderSize}
              onChange={(e) => setBorderSize(e.target.value)}
              className="input w-48"
              min={1}
              max={29999984}
            />
          </div>
          <button onClick={handleBorderUpdate} className="btn-primary text-sm">Update</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Changes server.properties max-world-size. For dynamic in-game borders, use /worldborder command.
        </p>
      </div>

      {/* Pre-generation */}
      <div className="card">
        <h2 className="card-header"><Map className="w-5 h-5 text-mc-accent" /> Chunk Pre-generation</h2>
        <p className="text-sm text-gray-400 mb-3">Requires Chunky plugin installed.</p>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">World</label>
            <select value={pregenWorld} onChange={(e) => setPregenWorld(e.target.value)} className="input">
              <option value="world">Overworld</option>
              <option value="world_nether">Nether</option>
              <option value="world_the_end">End</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Radius</label>
            <input
              type="number"
              value={pregenRadius}
              onChange={(e) => setPregenRadius(Number(e.target.value))}
              className="input w-32"
              min={100}
              max={30000}
            />
          </div>
          <button onClick={handlePregen} className="btn-primary text-sm">Start Pre-gen</button>
        </div>
      </div>

      {/* Datapacks */}
      <div className="card">
        <h2 className="card-header"><Package className="w-5 h-5 text-mc-accent" /> Datapacks ({datapacks.length})</h2>
        {datapacks.length === 0 ? (
          <p className="text-sm text-gray-500">No datapacks installed.</p>
        ) : (
          <div className="space-y-2">
            {datapacks.map(dp => (
              <div key={dp.name} className="flex items-center justify-between bg-mc-surface2/50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{dp.name}</p>
                  <p className="text-xs text-gray-500">
                    {dp.type} — {formatBytes(dp.size)}
                    {dp.meta?.pack?.description && ` — ${dp.meta.pack.description}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
