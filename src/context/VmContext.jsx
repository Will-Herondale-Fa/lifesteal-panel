import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';

const VmContext = createContext(null);

export function VmProvider({ children }) {
  const [vmState, setVmState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startMessage, setStartMessage] = useState('');

  const fetchVmStatus = useCallback(async () => {
    try {
      const data = await api.getVmStatus();
      setVmState(data);
      return data;
    } catch {
      setVmState({ powerState: 'unknown', displayStatus: 'Unknown' });
      return null;
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchVmStatus().then(() => setLoading(false));
    const interval = setInterval(fetchVmStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchVmStatus]);

  const startVm = useCallback(async () => {
    setStarting(true);
    setStartMessage('Sending start command...');
    try {
      await api.startVm();
      setStartMessage('VM is booting up... This takes 1-2 minutes.');

      // Poll until VM is running
      let vmReady = false;
      for (let i = 0; i < 60 && !vmReady; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const vm = await api.getVmStatus();
        setVmState(vm);
        if (vm?.powerState === 'running') vmReady = true;
      }

      if (!vmReady) {
        setStartMessage('VM startup timed out. Please try again.');
        setStarting(false);
        return false;
      }

      setStartMessage('VM is running! Waiting for backend to come online...');

      // Wait for backend API to be reachable
      let backendReady = false;
      for (let i = 0; i < 30 && !backendReady; i++) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          await api.getServerStatus();
          backendReady = true;
        } catch {}
      }

      if (!backendReady) {
        setStartMessage('VM is running but backend is still starting. Try refreshing in a moment.');
        setStarting(false);
        return false;
      }

      setStartMessage('');
      setStarting(false);
      return true;
    } catch (err) {
      setStartMessage('Failed to start VM: ' + (err.message || 'Unknown error'));
      setStarting(false);
      return false;
    }
  }, []);

  const vmRunning = vmState?.powerState === 'running';
  const vmDeallocated = vmState?.powerState === 'deallocated' || vmState?.powerState === 'stopped';
  const vmStarting = vmState?.powerState === 'starting' || starting;

  return (
    <VmContext.Provider value={{
      vmState,
      vmRunning,
      vmDeallocated,
      vmStarting,
      loading,
      starting,
      startMessage,
      startVm,
      refreshVmStatus: fetchVmStatus,
    }}>
      {children}
    </VmContext.Provider>
  );
}

export function useVm() {
  const ctx = useContext(VmContext);
  if (!ctx) throw new Error('useVm must be inside VmProvider');
  return ctx;
}
