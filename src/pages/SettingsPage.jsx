import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Settings, Key, Shield, Save, Eye, EyeOff, QrCode
} from 'lucide-react';

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

  useEffect(() => {
    fetchProperties();
  }, []);

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
          <h2 className="card-header mb-0"><Settings className="w-5 h-5 text-mc-accent" /> server.properties</h2>
          <button
            onClick={handleSaveProperties}
            disabled={propsSaving}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {propsSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {propsLoading ? (
          <div className="animate-pulse text-gray-400">Loading properties...</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {properties.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <label className="w-1/2 text-gray-400 font-mono text-xs truncate" title={key}>
                  {key}
                </label>
                {value === 'true' || value === 'false' ? (
                  <select
                    value={value}
                    onChange={(e) => handlePropChange(key, e.target.value)}
                    className="input flex-1 text-xs"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handlePropChange(key, e.target.value)}
                    className="input flex-1 text-xs font-mono"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          A backup of the previous file is created before saving. Restart the server for changes to take effect.
        </p>
      </div>
    </div>
  );
}
