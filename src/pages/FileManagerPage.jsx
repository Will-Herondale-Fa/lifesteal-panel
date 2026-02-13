import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import {
  FolderOpen, File, ChevronRight, Home, Upload,
  Download, Trash2, Save, ArrowLeft, Edit3, Eye
} from 'lucide-react';
import clsx from 'clsx';

export default function FileManagerPage() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  const browse = useCallback(async (path = '') => {
    setLoading(true);
    setEditingFile(null);
    try {
      const data = await api.browseFiles(path);
      setEntries(data.entries);
      setCurrentPath(path);
    } catch (err) {
      console.error('Browse failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    browse('');
  }, [browse]);

  const openFile = async (name) => {
    const filePath = currentPath ? `${currentPath}/${name}` : name;
    try {
      const data = await api.readFile(filePath);
      setEditingFile({ path: filePath, ...data });
      setFileContent(data.content);
    } catch (err) {
      alert(err.error || 'Cannot read file.');
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      await api.writeFile(editingFile.path, fileContent);
      alert('File saved.');
    } catch (err) {
      alert(err.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      await api.uploadFile(currentPath, uploadFile);
      setUploadFile(null);
      browse(currentPath);
    } catch (err) {
      alert(err.error || 'Upload failed.');
    }
  };

  const handleDelete = async (name) => {
    const filePath = currentPath ? `${currentPath}/${name}` : name;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteFile(filePath);
      browse(currentPath);
    } catch (err) {
      alert(err.error || 'Delete failed.');
    }
  };

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/');
    browse(parent);
  };

  const breadcrumbs = currentPath ? currentPath.split('/') : [];

  // File editor view
  if (editingFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingFile(null)} className="btn-secondary flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-lg font-semibold text-white">{editingFile.path}</h2>
          </div>
          <button onClick={saveFile} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Size: {(editingFile.size / 1024).toFixed(1)} KB</span>
          <span>Modified: {new Date(editingFile.modified).toLocaleString()}</span>
          <span>Type: {editingFile.extension}</span>
        </div>

        <textarea
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          className="w-full h-[600px] bg-black/60 border border-mc-surface2 rounded-xl p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-mc-accent"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">File Manager</h1>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm overflow-x-auto">
        <button
          onClick={() => browse('')}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" /> server
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-gray-600" />
            <button
              onClick={() => browse(breadcrumbs.slice(0, i + 1).join('/'))}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {crumb}
            </button>
          </span>
        ))}
      </div>

      {/* Upload bar */}
      <div className="card flex items-center gap-3">
        <input
          type="file"
          onChange={(e) => setUploadFile(e.target.files[0])}
          className="flex-1 text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-mc-surface2 file:text-gray-200 hover:file:bg-mc-accent2"
        />
        {uploadFile && (
          <button onClick={handleUpload} className="btn-primary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload
          </button>
        )}
        {currentPath && (
          <button onClick={navigateUp} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Up
          </button>
        )}
      </div>

      {/* File listing */}
      {loading ? (
        <div className="animate-pulse text-gray-400">Loading...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-mc-surface2">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Modified</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.name}
                  className="border-b border-mc-surface2/50 hover:bg-mc-surface2/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (entry.type === 'directory') {
                          browse(currentPath ? `${currentPath}/${entry.name}` : entry.name);
                        } else if (entry.editable) {
                          openFile(entry.name);
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-2 text-sm font-medium',
                        entry.type === 'directory' ? 'text-mc-yellow hover:text-yellow-300' : 'text-gray-300 hover:text-white'
                      )}
                    >
                      {entry.type === 'directory' ? (
                        <FolderOpen className="w-4 h-4" />
                      ) : (
                        <File className="w-4 h-4" />
                      )}
                      {entry.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {entry.size !== null ? `${(entry.size / 1024).toFixed(1)} KB` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(entry.modified).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {entry.editable && entry.type === 'file' && (
                        <button
                          onClick={() => openFile(entry.name)}
                          className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-mc-surface2"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.name)}
                        className="p-1.5 rounded text-gray-500 hover:text-mc-red hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Empty directory
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
