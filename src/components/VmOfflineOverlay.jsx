import { Heart, Power, Loader2, Monitor } from 'lucide-react';
import { useVm } from '../context/VmContext';

export default function VmOfflineOverlay() {
  const { vmState, vmDeallocated, vmStarting, starting, startMessage, startVm } = useVm();

  const handleStart = async () => {
    const success = await startVm();
    if (success) {
      // Backend is ready — reload to verify auth token and enter the panel
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mc-darker p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mc-accent/20 mb-4">
          <Heart className="w-8 h-8 text-mc-accent" fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">LifeSteal SMP</h1>
        <p className="text-gray-400 text-sm mb-6">Server Control Panel</p>

        <div className="card">
          <div className="flex items-center justify-center gap-3 mb-4">
            {vmStarting || starting ? (
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            ) : (
              <Monitor className="w-6 h-6 text-red-400" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-white">Server VM is Offline</p>
              <p className="text-xs text-gray-400">
                {vmState?.displayStatus || 'Deallocated'}
              </p>
            </div>
          </div>

          {vmDeallocated && !starting && (
            <>
              <p className="text-sm text-gray-400 mb-4">
                The server VM is currently shut down to save costs.
                Start it to access the control panel.
              </p>
              <button
                onClick={handleStart}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                Start Server VM
              </button>
            </>
          )}

          {(vmStarting || starting) && (
            <div className="space-y-3">
              <p className="text-sm text-yellow-300">
                {startMessage || 'Starting VM...'}
              </p>
              <div className="w-full bg-mc-surface2 rounded-full h-1.5">
                <div className="bg-yellow-400 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-gray-500">
                This usually takes 1-2 minutes. The page will reload once ready.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
