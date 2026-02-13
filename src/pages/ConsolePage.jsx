import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { Terminal, Send, Trash2 } from 'lucide-react';

export default function ConsolePage() {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const consoleRef = useRef(null);
  const wsRef = useRef(null);
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);

  // WebSocket connection for live logs
  useEffect(() => {
    const token = api.getToken();
    // Derive WS URL from the API base URL or fall back to same host
    const apiBase = import.meta.env.VITE_API_URL || '';
    let wsUrl;
    if (apiBase.startsWith('http')) {
      const url = new URL(apiBase);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}/ws/console?token=${token}`;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${window.location.host}/ws/console?token=${token}`;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'log' || msg.type === 'info' || msg.type === 'connected') {
          setLogs(prev => {
            const next = [...prev, { text: msg.data, type: msg.type, time: msg.timestamp }];
            return next.length > 1000 ? next.slice(-500) : next;
          });
        }
      } catch { /* ignore */ }
    };

    // Also fetch recent logs via REST
    api.getServerLogs(200).then(data => {
      setLogs(data.lines.map(line => ({ text: line, type: 'log' })));
    }).catch(() => {});

    return () => ws.close();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSendCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setSending(true);
    try {
      await api.sendCommand(command.trim());
      setLogs(prev => [...prev, {
        text: `> ${command}`,
        type: 'command',
        time: new Date().toISOString(),
      }]);
      commandHistory.current.unshift(command);
      historyIndex.current = -1;
      setCommand('');
    } catch (err) {
      setLogs(prev => [...prev, {
        text: `[ERROR] ${err.error || 'Command failed'}`,
        type: 'error',
        time: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = commandHistory.current;
      if (history.length > 0 && historyIndex.current < history.length - 1) {
        historyIndex.current++;
        setCommand(history[historyIndex.current]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current > 0) {
        historyIndex.current--;
        setCommand(commandHistory.current[historyIndex.current]);
      } else {
        historyIndex.current = -1;
        setCommand('');
      }
    }
  };

  const getLineColor = (type) => {
    switch (type) {
      case 'command': return 'text-mc-accent';
      case 'error': return 'text-mc-red';
      case 'info':
      case 'connected': return 'text-mc-green';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-mc-accent" />
          <h1 className="text-2xl font-bold text-white">Console</h1>
          <span className={connected ? 'badge-green' : 'badge-red'}>
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        <button
          onClick={() => setLogs([])}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Console Output */}
      <div
        ref={consoleRef}
        className="flex-1 min-h-[500px] bg-black/60 rounded-xl border border-mc-surface2 p-4 font-mono text-sm overflow-auto"
      >
        {logs.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} leading-relaxed`}>
            {line.text}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-600 italic">Waiting for server output...</div>
        )}
      </div>

      {/* Command Input */}
      <form onSubmit={handleSendCommand} className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mc-accent font-mono">&gt;</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input w-full pl-8 font-mono"
            placeholder="Enter command... (e.g., say Hello, list, whitelist add Player)"
            disabled={sending}
          />
        </div>
        <button
          type="submit"
          disabled={sending || !command.trim()}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>

      <p className="text-xs text-gray-600">
        Only whitelisted commands are allowed. Use Arrow Up/Down for command history.
      </p>
    </div>
  );
}
