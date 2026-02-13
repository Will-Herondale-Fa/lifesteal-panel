import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Users, UserPlus, UserMinus, Shield, ShieldOff,
  Ban, CheckCircle, RefreshCw, Search
} from 'lucide-react';

export default function PlayerManagerPage() {
  const [tab, setTab] = useState('online');
  const [online, setOnline] = useState({ online: [], count: 0, max: 20 });
  const [whitelist, setWhitelist] = useState([]);
  const [ops, setOps] = useState([]);
  const [banned, setBanned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [banReason, setBanReason] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [onlineData, wlData, opsData, banData] = await Promise.all([
        api.getOnlinePlayers(),
        api.getWhitelist(),
        api.getOps(),
        api.getBanned(),
      ]);
      setOnline(onlineData);
      setWhitelist(wlData.players);
      setOps(opsData.operators);
      setBanned(banData.banned);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleWhitelist = async (action) => {
    if (!username.trim()) return;
    try {
      await api.updateWhitelist(username.trim(), action);
      setUsername('');
      fetchAll();
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handleOp = async (name) => {
    try {
      await api.opPlayer(name);
      fetchAll();
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handleDeop = async (name) => {
    try {
      await api.deopPlayer(name);
      fetchAll();
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handleBan = async () => {
    if (!username.trim()) return;
    try {
      await api.banPlayer(username.trim(), banReason || 'Banned by admin');
      setUsername('');
      setBanReason('');
      fetchAll();
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const handleUnban = async (name) => {
    try {
      await api.unbanPlayer(name);
      fetchAll();
    } catch (err) {
      alert(err.error || 'Failed.');
    }
  };

  const tabs = [
    { id: 'online', label: `Online (${online.count})`, icon: Users },
    { id: 'whitelist', label: `Whitelist (${whitelist.length})`, icon: CheckCircle },
    { id: 'ops', label: `Operators (${ops.length})`, icon: Shield },
    { id: 'banned', label: `Banned (${banned.length})`, icon: Ban },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Player Management</h1>
        </div>
        <button onClick={fetchAll} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-mc-surface rounded-lg p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-mc-accent text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div className="card">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Player Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              placeholder="PlayerName"
              maxLength={16}
            />
          </div>
          {tab === 'banned' && (
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Ban Reason</label>
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="input w-full"
                placeholder="Reason for ban"
              />
            </div>
          )}
          <div className="flex gap-2">
            {tab === 'whitelist' && (
              <>
                <button onClick={() => handleWhitelist('add')} className="btn-success text-sm flex items-center gap-1">
                  <UserPlus className="w-4 h-4" /> Add
                </button>
                <button onClick={() => handleWhitelist('remove')} className="btn-danger text-sm flex items-center gap-1">
                  <UserMinus className="w-4 h-4" /> Remove
                </button>
              </>
            )}
            {tab === 'ops' && (
              <button onClick={() => handleOp(username)} className="btn-success text-sm flex items-center gap-1">
                <Shield className="w-4 h-4" /> OP
              </button>
            )}
            {tab === 'banned' && (
              <button onClick={handleBan} className="btn-danger text-sm flex items-center gap-1">
                <Ban className="w-4 h-4" /> Ban
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {tab === 'online' && (
            <div className="divide-y divide-mc-surface2/50">
              {online.online.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No players online</div>
              ) : (
                online.online.map(name => (
                  <div key={name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${name}/32`} alt={name} className="w-8 h-8 rounded" />
                      <span className="font-medium">{name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOp(name)} className="btn-secondary text-xs py-1 px-2">OP</button>
                      <button onClick={() => { setUsername(name); setTab('banned'); }} className="btn-danger text-xs py-1 px-2">Ban</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'whitelist' && (
            <div className="divide-y divide-mc-surface2/50">
              {whitelist.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">Whitelist is empty</div>
              ) : (
                whitelist.map(player => (
                  <div key={player.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${player.name}/32`} alt={player.name} className="w-8 h-8 rounded" />
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <button
                      onClick={() => { api.updateWhitelist(player.name, 'remove').then(fetchAll); }}
                      className="text-gray-500 hover:text-mc-red text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'ops' && (
            <div className="divide-y divide-mc-surface2/50">
              {ops.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No operators</div>
              ) : (
                ops.map(op => (
                  <div key={op.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${op.name}/32`} alt={op.name} className="w-8 h-8 rounded" />
                      <div>
                        <span className="font-medium">{op.name}</span>
                        <span className="text-xs text-gray-500 ml-2">Level {op.level}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeop(op.name)} className="text-gray-500 hover:text-mc-red text-xs flex items-center gap-1">
                      <ShieldOff className="w-3 h-3" /> De-OP
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'banned' && (
            <div className="divide-y divide-mc-surface2/50">
              {banned.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">No banned players</div>
              ) : (
                banned.map(ban => (
                  <div key={ban.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={`https://mc-heads.net/avatar/${ban.name}/32`} alt={ban.name} className="w-8 h-8 rounded" />
                      <div>
                        <span className="font-medium">{ban.name}</span>
                        <p className="text-xs text-gray-500">{ban.reason} — by {ban.source}</p>
                      </div>
                    </div>
                    <button onClick={() => handleUnban(ban.name)} className="btn-success text-xs py-1 px-2">Unban</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
