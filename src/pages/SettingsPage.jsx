import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Settings, Key, Shield, Save, Eye, EyeOff, QrCode, Info, Lock
} from 'lucide-react';

// Friendly names and descriptions for server.properties keys
const PROPERTY_META = {
  'motd': { label: 'Server Description', desc: 'The message shown in the server list', category: 'General' },
  'max-players': { label: 'Max Players', desc: 'Maximum number of players allowed', category: 'General' },
  'difficulty': { label: 'Difficulty', desc: 'peaceful, easy, normal, or hard', category: 'Gameplay' },
  'gamemode': { label: 'Default Game Mode', desc: 'survival, creative, adventure, or spectator', category: 'Gameplay' },
  'pvp': { label: 'Allow PvP', desc: 'Players can fight each other', category: 'Gameplay' },
  'hardcore': { label: 'Hardcore Mode', desc: 'Players are banned on death', category: 'Gameplay' },
  'force-gamemode': { label: 'Force Game Mode', desc: 'Players always join in the default game mode', category: 'Gameplay' },
  'allow-flight': { label: 'Allow Flying', desc: 'Let players fly in survival (anti-cheat may kick)', category: 'Gameplay' },
  'spawn-protection': { label: 'Spawn Protection', desc: 'Radius (in blocks) around spawn where only OPs can build', category: 'Gameplay' },
  'spawn-monsters': { label: 'Spawn Monsters', desc: 'Hostile mobs will spawn', category: 'Gameplay' },
  'spawn-animals': { label: 'Spawn Animals', desc: 'Animals will spawn', category: 'Gameplay' },
  'spawn-npcs': { label: 'Spawn Villagers', desc: 'Villagers and other NPCs will spawn', category: 'Gameplay' },
  'allow-nether': { label: 'Enable Nether', desc: 'Players can travel to the Nether', category: 'World' },
  'generate-structures': { label: 'Generate Structures', desc: 'Villages, temples, etc. will generate', category: 'World' },
  'level-name': { label: 'World Folder Name', desc: 'Name of the world folder on disk', category: 'World' },
  'level-seed': { label: 'World Seed', desc: 'Seed used for world generation', category: 'World' },
  'level-type': { label: 'World Type', desc: 'normal, flat, large_biomes, amplified', category: 'World' },
  'max-world-size': { label: 'Max World Size', desc: 'Maximum radius of the world in blocks', category: 'World' },
  'view-distance': { label: 'View Distance', desc: 'How far players can see (in chunks, 2-32)', category: 'Performance' },
  'simulation-distance': { label: 'Simulation Distance', desc: 'How far from players entities are active (in chunks)', category: 'Performance' },
  'max-tick-time': { label: 'Max Tick Time (ms)', desc: 'Server watchdog crash timer (-1 to disable)', category: 'Performance' },
  'network-compression-threshold': { label: 'Network Compression', desc: 'Compress packets larger than this (bytes)', category: 'Performance' },
  'player-idle-timeout': { label: 'AFK Kick Timeout', desc: 'Kick idle players after this many minutes (0 = never)', category: 'Performance' },
  'online-mode': { label: 'Mojang Authentication', desc: 'Verify players with Mojang (disable for cracked)', category: 'Security' },
  'white-list': { label: 'Enable Whitelist', desc: 'Only approved players can join', category: 'Security' },
  'enforce-whitelist': { label: 'Enforce Whitelist', desc: 'Kick non-whitelisted players when enabled', category: 'Security' },
  'enforce-secure-profile': { label: 'Enforce Signed Chat', desc: 'Require Mojang-signed chat messages', category: 'Security' },
  'server-port': { label: 'Server Port', desc: 'Port the server listens on', category: 'Network' },
  'server-ip': { label: 'Server Bind IP', desc: 'IP to bind to (leave empty for all)', category: 'Network' },
  'enable-status': { label: 'Show in Server List', desc: 'Respond to server list ping requests', category: 'Network' },
  'enable-query': { label: 'Enable Query', desc: 'Allow GameSpy4 query protocol', category: 'Network' },
  'query.port': { label: 'Query Port', desc: 'Port for query protocol', category: 'Network' },
  'enable-rcon': { label: 'Enable RCON', desc: 'Remote console access (advanced)', category: 'Network' },
  'rcon.port': { label: 'RCON Port', desc: 'Port for RCON connections', category: 'Network' },
  'rcon.password': { label: 'RCON Password', desc: 'Password for RCON', category: 'Network' },
  'rate-limit': { label: 'Rate Limit', desc: 'Max packets per second per player (0 = off)', category: 'Network' },
  'broadcast-console-to-ops': { label: 'Console to OPs', desc: 'Show console output to operator players', category: 'Other' },
  'broadcast-rcon-to-ops': { label: 'RCON to OPs', desc: 'Show RCON output to operator players', category: 'Other' },
  'enable-command-block': { label: 'Command Blocks', desc: 'Allow command blocks to execute commands', category: 'Other' },
  'require-resource-pack': { label: 'Require Resource Pack', desc: 'Kick players who decline the resource pack', category: 'Other' },
  'resource-pack': { label: 'Resource Pack URL', desc: 'URL to a custom resource pack', category: 'Other' },
  'resource-pack-prompt': { label: 'Resource Pack Message', desc: 'Message shown to players for the resource pack', category: 'Other' },
  'resource-pack-sha1': { label: 'Resource Pack Hash', desc: 'SHA-1 hash for resource pack verification', category: 'Other' },
  'text-filtering-config': { label: 'Chat Filtering', desc: 'Chat text filtering config', category: 'Other' },
  'previews-chat': { label: 'Preview Chat', desc: 'Enable chat message previews', category: 'Other' },
  'hide-online-players': { label: 'Hide Player List', desc: 'Hide player list from server status', category: 'Other' },
  'log-ips': { label: 'Log Player IPs', desc: 'Log player IP addresses', category: 'Other' },
};

const CATEGORY_ORDER = ['General', 'Gameplay', 'World', 'Performance', 'Security', 'Network', 'Other'];

function getPropertyInfo(key) {
  return PROPERTY_META[key] || { label: key, desc: '', category: 'Other' };
}

export default function SettingsPage() {
  const { user } = useAuth();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // 2FA
  const [twoFA, setTwoFA] = useState({ enabled: user?.twoFactorEnabled || false });
  const [qrCode, setQrCode] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState(null);

  // Server properties
  const [properties, setProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const [propsSaving, setPropsSaving] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchServerStatus();
  }, []);

  const fetchServerStatus = async () => {
    try {
      const data = await api.getServerStatus();
      setServerOnline(data.online);
    } catch {
      setServerOnline(false);
    }
  };

  const fetchProperties = async () => {
    setPropsLoading(true);
    try {
      const data = await api.getServerProperties();
      // Convert object to sorted array of [key, value] for editing
      const entries = Object.entries(data.properties || {}).sort(([a], [b]) => a.localeCompare(b));
      setProperties(entries);
    } catch (err) {
      console.error(err);
    } finally {
      setPropsLoading(false);
    }
  };

  // --- Password ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.error || 'Failed to change password.' });
    }
  };

  // --- 2FA ---
  const handleSetup2FA = async () => {
    setTwoFAMsg(null);
    try {
      const data = await api.setup2FA();
      setQrCode(data.qrCode);
    } catch (err) {
      setTwoFAMsg({ type: 'error', text: err.error || 'Failed.' });
    }
  };

  const handleVerify2FA = async () => {
    setTwoFAMsg(null);
    try {
      await api.verify2FA(totpCode);
      setTwoFA({ enabled: true });
      setQrCode(null);
      setTotpCode('');
      setTwoFAMsg({ type: 'success', text: '2FA enabled successfully.' });
    } catch (err) {
      setTwoFAMsg({ type: 'error', text: err.error || 'Invalid code.' });
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Disable two-factor authentication?')) return;
    try {
      await api.disable2FA(totpCode);
      setTwoFA({ enabled: false });
      setTotpCode('');
      setTwoFAMsg({ type: 'success', text: '2FA disabled.' });
    } catch (err) {
      setTwoFAMsg({ type: 'error', text: err.error || 'Failed. Enter your current TOTP code.' });
    }
  };

  // --- Properties ---
  const handlePropChange = (key, value) => {
    setProperties(prev => prev.map(([k, v]) => k === key ? [k, value] : [k, v]));
  };

  const handleSaveProperties = async () => {
    setPropsSaving(true);
    try {
      const obj = Object.fromEntries(properties);
      await api.updateServerProperties(obj);
      alert('Properties saved. Restart the server to apply changes.');
    } catch (err) {
      alert(err.error || 'Failed to save.');
    } finally {
      setPropsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-mc-accent" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Connection Info */}
      <div className="card">
        <h2 className="card-header">Connection Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Logged in as</p>
            <p className="font-medium">{user?.username || 'admin'}</p>
          </div>
          <div>
            <p className="text-gray-400">Role</p>
            <p className="font-medium capitalize">{user?.role || 'admin'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="card-header"><Key className="w-5 h-5 text-mc-accent" /> Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-md">
          {passwordMsg && (
            <div className={`text-sm px-3 py-2 rounded ${
              passwordMsg.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
            }`}>{passwordMsg.text}</div>
          )}
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input w-full"
              placeholder="Current password"
              required
            />
          </div>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input w-full"
            placeholder="New password (min 8 chars)"
            required
            minLength={8}
          />
          <input
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
            placeholder="Confirm new password"
            required
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary text-sm flex items-center gap-2">
              <Key className="w-4 h-4" /> Change Password
            </button>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Hide' : 'Show'}
            </button>
          </div>
        </form>
      </div>

      {/* 2FA */}
      <div className="card">
        <h2 className="card-header"><Shield className="w-5 h-5 text-mc-accent" /> Two-Factor Authentication</h2>
        <div className="space-y-3 max-w-md">
          {twoFAMsg && (
            <div className={`text-sm px-3 py-2 rounded ${
              twoFAMsg.type === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
            }`}>{twoFAMsg.text}</div>
          )}

          <p className="text-sm text-gray-400">
            Status: <span className={twoFA.enabled ? 'text-mc-green' : 'text-mc-yellow'}>
              {twoFA.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>

          {!twoFA.enabled && !qrCode && (
            <button onClick={handleSetup2FA} className="btn-primary text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4" /> Setup 2FA
            </button>
          )}

          {qrCode && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Scan this QR code with your authenticator app:</p>
              <img src={qrCode} alt="2FA QR Code" className="bg-white rounded-lg p-2 w-48 h-48" />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="input w-40 font-mono"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <button onClick={handleVerify2FA} className="btn-success text-sm">Verify</button>
                <button onClick={() => { setQrCode(null); setTotpCode(''); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}

          {twoFA.enabled && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="input w-40 font-mono"
                placeholder="TOTP code to disable"
                maxLength={6}
              />
              <button onClick={handleDisable2FA} className="btn-danger text-sm">Disable 2FA</button>
            </div>
          )}
        </div>
      </div>

      {/* Server Properties */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-header mb-0"><Settings className="w-5 h-5 text-mc-accent" /> Server Settings</h2>
          {!serverOnline && (
            <button
              onClick={handleSaveProperties}
              disabled={propsSaving}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {propsSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>

        {serverOnline && (
          <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-4">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-yellow-300 text-sm font-medium">Server is running</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Settings can only be edited when the server is stopped. Changes require a restart to take effect.
              </p>
            </div>
          </div>
        )}

        {propsLoading ? (
          <div className="animate-pulse text-gray-400">Loading properties...</div>
        ) : (
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {CATEGORY_ORDER.map(category => {
              const categoryProps = properties.filter(([key]) => getPropertyInfo(key).category === category);
              if (categoryProps.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-mc-accent uppercase tracking-wide mb-3 border-b border-mc-surface2 pb-2">{category}</h3>
                  <div className="space-y-3">
                    {categoryProps.map(([key, value]) => {
                      const info = getPropertyInfo(key);
                      return (
                        <div key={key} className="flex items-start gap-4">
                          <div className="w-1/2 pt-2">
                            <label className="text-sm font-medium text-white">{info.label}</label>
                            {info.desc && (
                              <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                            )}
                          </div>
                          <div className="flex-1">
                            {value === 'true' || value === 'false' ? (
                              <select
                                value={value}
                                onChange={(e) => handlePropChange(key, e.target.value)}
                                className="input w-full text-sm"
                                disabled={serverOnline}
                              >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            ) : key === 'difficulty' ? (
                              <select
                                value={value}
                                onChange={(e) => handlePropChange(key, e.target.value)}
                                className="input w-full text-sm"
                                disabled={serverOnline}
                              >
                                <option value="peaceful">Peaceful</option>
                                <option value="easy">Easy</option>
                                <option value="normal">Normal</option>
                                <option value="hard">Hard</option>
                              </select>
                            ) : key === 'gamemode' ? (
                              <select
                                value={value}
                                onChange={(e) => handlePropChange(key, e.target.value)}
                                className="input w-full text-sm"
                                disabled={serverOnline}
                              >
                                <option value="survival">Survival</option>
                                <option value="creative">Creative</option>
                                <option value="adventure">Adventure</option>
                                <option value="spectator">Spectator</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handlePropChange(key, e.target.value)}
                                className="input w-full text-sm"
                                disabled={serverOnline}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          {serverOnline
            ? 'Stop the server to edit settings. Changes require a restart to take effect.'
            : 'Changes are saved to server.properties. Start the server to apply them.'}
        </p>
      </div>
    </div>
  );
}
