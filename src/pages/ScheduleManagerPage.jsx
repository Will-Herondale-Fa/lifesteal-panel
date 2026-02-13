import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  CalendarClock, Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, Clock
} from 'lucide-react';

const ACTIONS = [
  { value: 'restart', label: 'Restart Server' },
  { value: 'backup', label: 'Run Backup' },
  { value: 'save', label: 'Save All' },
  { value: 'say', label: 'Broadcast Message' },
];

function nextCronRun(cron) {
  // Simple display — real calculation is server-side
  return cron;
}

export default function ScheduleManagerPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [action, setAction] = useState('restart');
  const [cron, setCron] = useState('');
  const [actionParam, setActionParam] = useState('');

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getSchedules();
      setSchedules(data.schedules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const resetForm = () => {
    setName('');
    setAction('restart');
    setCron('');
    setActionParam('');
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !cron.trim()) return;

    try {
      await api.createSchedule({
        name: name.trim(),
        action,
        cron: cron.trim(),
        ...(action === 'say' && { param: actionParam }),
      });
      resetForm();
      fetchSchedules();
    } catch (err) {
      alert(err.error || 'Failed to create schedule.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.toggleSchedule(id);
      fetchSchedules();
    } catch (err) {
      alert(err.error || 'Failed to toggle.');
    }
  };

  const handleDelete = async (id, scheduleName) => {
    if (!confirm(`Delete schedule "${scheduleName}"?`)) return;
    try {
      await api.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err.error || 'Failed to delete.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Scheduled Tasks</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSchedules} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="font-semibold text-white">New Scheduled Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="e.g. Auto Restart"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="input w-full">
                {ACTIONS.map(a => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cron Expression</label>
              <input
                type="text"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                className="input w-full font-mono"
                placeholder="0 4 * * *"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
            {action === 'say' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Message</label>
                <input
                  type="text"
                  value={actionParam}
                  onChange={(e) => setActionParam(e.target.value)}
                  className="input w-full"
                  placeholder="Server restarting soon!"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn-primary text-sm">Create</button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
          </div>

          {/* Cron Cheat Sheet */}
          <div className="mt-2 text-xs text-gray-500 bg-mc-surface2/30 rounded-lg p-3">
            <p className="font-semibold mb-1">Common patterns:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 font-mono">
              <span>0 4 * * *   → 4am daily</span>
              <span>0 */6 * * * → Every 6 hours</span>
              <span>*/30 * * * * → Every 30 min</span>
              <span>0 0 * * 0  → Sunday midnight</span>
              <span>0 12 * * 1-5 → Weekdays noon</span>
              <span>0 0 1 * *  → 1st of month</span>
            </div>
          </div>
        </form>
      )}

      {/* Schedule List */}
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="card text-center text-gray-500 py-8">
          No schedules configured. Create one to automate server tasks.
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map((sched) => (
            <div key={sched.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(sched.id)}
                  className="text-gray-400 hover:text-white transition"
                  title={sched.enabled ? 'Disable' : 'Enable'}
                >
                  {sched.enabled
                    ? <ToggleRight className="w-6 h-6 text-mc-green" />
                    : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{sched.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      sched.enabled ? 'bg-mc-green/20 text-mc-green' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {sched.enabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>Action: <span className="text-gray-300">
                      {ACTIONS.find(a => a.value === sched.action)?.label || sched.action}
                    </span></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">{sched.cron}</span>
                    </span>
                    {sched.nextRun && (
                      <span>Next: {new Date(sched.nextRun).toLocaleString()}</span>
                    )}
                    {sched.param && <span>Param: "{sched.param}"</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(sched.id, sched.name)}
                className="btn-danger text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
