import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  Puzzle, Upload, Power, PowerOff, Trash2, Settings,
  RefreshCw, GitBranch, ChevronDown, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

export default function PluginManagerPage() {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deps, setDeps] = useState(null);
  const [expandedPlugin, setExpandedPlugin] = useState(null);
  const [configContent, setConfigContent] = useState('');
  const [configFile, setConfigFile] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('');

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    try {
      const [pluginData, depData] = await Promise.all([
        api.getPlugins(),
        api.getPluginDependencies().catch(() => null),
      ]);
      setPlugins(pluginData.plugins);
      setDeps(depData?.dependencies || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlugins(); }, [fetchPlugins]);

  const handleToggle = async (name) => {
    try {
      await api.togglePlugin(name);
      fetchPlugins();
    } catch (err) {
      alert(err.error || 'Toggle failed.');
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete plugin "${name}"? This cannot be undone.`)) return;
    try {
      await api.deletePlugin(name, true);
      fetchPlugins();
    } catch (err) {
      alert(err.error || 'Delete failed.');
    }
  };

  const loadConfig = async (plugin, file = 'config.yml') => {
    try {
      const data = await api.getPluginConfig(plugin, file);
      setExpandedPlugin(plugin);
      setConfigContent(data.content);
      setConfigFile(file);
    } catch (err) {
      alert(err.error || 'Could not load config.');
    }
  };

  const saveConfig = async () => {
    if (!expandedPlugin) return;
    setSaving(true);
    try {
      await api.updatePluginConfig(expandedPlugin, configFile, configContent);
      alert('Config saved.');
    } catch (err) {
      alert(err.error || 'Save failed. Check syntax.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      await api.uploadPlugin(uploadFile, uploadCategory);
      setUploadFile(null);
      setUploadCategory('');
      fetchPlugins();
    } catch (err) {
      alert(err.error || 'Upload failed.');
    }
  };

  const categories = [...new Set(plugins.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Puzzle className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Plugin Manager</h1>
          <span className="badge-green">{plugins.length} loaded</span>
        </div>
        <button onClick={fetchPlugins} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Upload */}
      <div className="card">
        <h2 className="card-header"><Upload className="w-5 h-5 text-mc-accent" /> Upload Plugin</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Plugin JAR</label>
            <input
              type="file"
              accept=".jar"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-mc-surface2 file:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="input text-sm"
            >
              <option value="">Root</option>
              <option value="Core">Core</option>
              <option value="QoL">QoL</option>
              <option value="WorldGen">WorldGen</option>
              <option value="Admin">Admin</option>
              <option value="Dependencies">Dependencies</option>
            </select>
          </div>
          <button onClick={handleUpload} disabled={!uploadFile} className="btn-primary text-sm">
            Upload
          </button>
        </div>
      </div>

      {/* Plugin List */}
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading plugins...</div>
      ) : (
        <div className="space-y-2">
          {plugins.map((plugin) => (
            <div key={plugin.fileName} className="card p-0 overflow-hidden">
              {/* Plugin Row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-2.5 h-2.5 rounded-full',
                    plugin.enabled ? 'bg-mc-green' : 'bg-gray-600'
                  )} />
                  <div>
                    <p className="font-medium text-white">{plugin.name}</p>
                    <p className="text-xs text-gray-500">
                      {plugin.category && <span className="text-mc-accent2">[{plugin.category}]</span>}
                      {' '}{(plugin.size / 1024).toFixed(0)} KB
                      {deps?.[plugin.name] && ` • v${deps[plugin.name].version}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {plugin.hasConfig && (
                    <button
                      onClick={() => expandedPlugin === plugin.name ? setExpandedPlugin(null) : loadConfig(plugin.name)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-mc-surface2"
                      title="Config"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(plugin.name)}
                    className={clsx(
                      'p-1.5 rounded',
                      plugin.enabled
                        ? 'text-mc-green hover:text-mc-red hover:bg-red-900/20'
                        : 'text-gray-500 hover:text-mc-green hover:bg-emerald-900/20'
                    )}
                    title={plugin.enabled ? 'Disable' : 'Enable'}
                  >
                    {plugin.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(plugin.name)}
                    className="p-1.5 rounded text-gray-500 hover:text-mc-red hover:bg-red-900/20"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Config Editor */}
              {expandedPlugin === plugin.name && (
                <div className="border-t border-mc-surface2 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-400">Config file:</label>
                      <select
                        value={configFile}
                        onChange={(e) => loadConfig(plugin.name, e.target.value)}
                        className="input text-xs py-1"
                      >
                        {plugin.configFiles.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={saveConfig} disabled={saving} className="btn-primary text-sm flex items-center gap-1">
                      {saving ? 'Saving...' : 'Save Config'}
                    </button>
                  </div>
                  <textarea
                    value={configContent}
                    onChange={(e) => setConfigContent(e.target.value)}
                    className="w-full h-64 bg-black/60 border border-mc-surface2 rounded-lg p-3 font-mono text-xs text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-mc-accent"
                    spellCheck={false}
                  />
                </div>
              )}

              {/* Dependencies */}
              {deps?.[plugin.name]?.depend?.length > 0 && (
                <div className="border-t border-mc-surface2/50 px-4 py-2 text-xs text-gray-500 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" /> Depends: {deps[plugin.name].depend.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
