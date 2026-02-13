import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  ShieldCheck, UserPlus, UserMinus, RefreshCw, Search, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function WhitelistPage() {
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [enforceWhitelist, setEnforceWhitelist] = useState(false);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wlData, propsData] = await Promise.all([
        api.getWhitelist(),
        api.getServerProperties(),
      ]);
      setWhitelist(wlData.players || []);
      const props = propsData.properties || {};
      setWhitelistEnabled(props['white-list'] === 'true' || props['white-list'] === true);
      setEnforceWhitelist(props['enforce-whitelist'] === 'true' || props['enforce-whitelist'] === true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!username.trim()) return;
    try {
      await api.updateWhitelist(username.trim(), 'add');
      setUsername('');
      fetchData();
    } catch (err) {
      alert(err.error || 'Failed to add player.');
    }
  };

  const handleRemove = async (name) => {
    if (!confirm(`Remove ${name} from the whitelist?`)) return;
    try {
      await api.updateWhitelist(name, 'remove');
      fetchData();
    } catch (err) {
      alert(err.error || 'Failed to remove player.');
    }
  };

  const toggleWhitelist = async () => {
    setToggling(true);
    try {
      const newVal = !whitelistEnabled;
      await api.updateServerProperties({
        'white-list': String(newVal),
        'enforce-whitelist': String(newVal),
      });
      // Also run the command to apply immediately without restart
      await api.sendCommand(newVal ? 'whitelist on' : 'whitelist off');
      setWhitelistEnabled(newVal);
      setEnforceWhitelist(newVal);
    } catch (err) {
      alert(err.error || 'Failed to toggle whitelist.');
    } finally {
      setToggling(false);
    }
  };

  const filtered = whitelist.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Whitelist</h1>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Whitelist Toggle */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="font-medium text-white">Whitelist Mode</p>
          <p className="text-sm text-gray-400">
            {whitelistEnabled
              ? 'Only whitelisted players can join the server'
              : 'Anyone can join the server'}
          </p>
        </div>
        <button
          onClick={toggleWhitelist}
          disabled={toggling}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            whitelistEnabled
              ? 'bg-mc-green/20 text-mc-green hover:bg-mc-green/30'
              : 'bg-mc-surface2 text-gray-400 hover:text-white'
          }`}
        >
          {whitelistEnabled ? (
            <><ToggleRight className="w-5 h-5" /> Enabled</>
          ) : (
            <><ToggleLeft className="w-5 h-5" /> Disabled</>
          )}
        </button>
      </div>

      {/* Add Player */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Add Player to Whitelist</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="input flex-1"
            placeholder="Enter Minecraft username..."
            maxLength={16}
          />
          <button onClick={handleAdd} className="btn-success flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Search & List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-mc-surface2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-white">
              Whitelisted Players ({whitelist.length})
            </h2>
            {whitelist.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-10 text-sm w-48"
                  placeholder="Search..."
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center animate-pulse text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {whitelist.length === 0 ? 'No players on the whitelist yet' : 'No matching players'}
          </div>
        ) : (
          <div className="divide-y divide-mc-surface2/50">
            {filtered.map(player => (
              <div key={player.name} className="flex items-center justify-between px-4 py-3 hover:bg-mc-surface2/30 transition-colors">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://mc-heads.net/avatar/${player.name}/32`}
                    alt={player.name}
                    className="w-8 h-8 rounded"
                  />
                  <span className="font-medium">{player.name}</span>
                </div>
                <button
                  onClick={() => handleRemove(player.name)}
                  className="flex items-center gap-1 text-gray-500 hover:text-mc-red text-sm transition-colors"
                >
                  <UserMinus className="w-4 h-4" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
