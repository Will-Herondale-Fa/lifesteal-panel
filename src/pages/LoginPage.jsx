import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVm } from '../context/VmContext';
import { Heart, Lock, User, Key, Power, Loader2, Monitor } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const {
    vmState, vmRunning, vmDeallocated, vmStarting,
    starting, startMessage, startVm, loading: vmLoading,
  } = useVm();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password, totpToken || undefined);
      if (result.requires2FA) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }
      navigate('/');
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setError('Cannot reach server. The VM may be offline.');
      } else {
        setError(err.error || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartVm = async () => {
    const success = await startVm();
    if (success) {
      // Backend is ready, user can now log in
    }
  };

  const vmDisplay = vmState?.displayStatus || 'Unknown';

  return (
    <div className="min-h-screen flex items-center justify-center bg-mc-darker p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mc-accent/20 mb-4">
            <Heart className="w-8 h-8 text-mc-accent" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-white">LifeSteal SMP</h1>
          <p className="text-gray-400 mt-1">Server Control Panel</p>
        </div>

        {/* VM Status Banner (when VM is not running) */}
        {!vmLoading && !vmRunning && (
          <div className="card mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${vmDeallocated ? 'bg-red-900/30' : vmStarting ? 'bg-yellow-900/30' : 'bg-gray-800'}`}>
                {vmStarting || starting ? (
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                ) : (
                  <Monitor className="w-5 h-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">VM Status</p>
                <p className={`text-xs ${vmDeallocated ? 'text-red-400' : vmStarting ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {vmDisplay}
                </p>
              </div>
            </div>

            {vmDeallocated && !starting && (
              <>
                <p className="text-sm text-gray-400 mb-3">
                  The server VM is currently off. Start it to access the control panel.
                </p>
                <button
                  onClick={handleStartVm}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  Start Server VM
                </button>
              </>
            )}

            {(vmStarting || starting) && (
              <div className="space-y-2">
                <p className="text-sm text-yellow-300">
                  {startMessage || 'VM is starting...'}
                </p>
                <div className="w-full bg-mc-surface2 rounded-full h-1.5">
                  <div className="bg-yellow-400 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Login Card */}
        <div className="card">
          {!vmRunning && !vmLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Login will be available once the VM is running.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {!needs2FA ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input w-full pl-10"
                        placeholder="admin"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input w-full pl-10"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">2FA Code</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={totpToken}
                      onChange={(e) => setTotpToken(e.target.value)}
                      className="input w-full pl-10"
                      placeholder="123456"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enter the code from your authenticator app.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Authenticating...' : needs2FA ? 'Verify' : 'Login'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Secure admin panel — unauthorized access is logged.
        </p>
      </div>
    </div>
  );
}
