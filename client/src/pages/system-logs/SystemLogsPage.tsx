import { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCcw,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api/client';
import { LOGS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { cn } from '@/lib/utils/cn';

interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  context?: string;
  trace?: string;
  raw?: boolean;
  [key: string]: any;
}

interface LogFile {
  name: string;
  size: number;
  modified: string;
}

const LEVEL_STYLES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  error: { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  warn: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  info: { icon: <Info className="h-3.5 w-3.5" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  debug: { icon: <Bug className="h-3.5 w-3.5" />, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' },
  verbose: { icon: <Bug className="h-3.5 w-3.5" />, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800' },
};

export default function SystemLogsPage() {
  useDocumentTitle('System Logs');

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState('combined');
  const [lineCount, setLineCount] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(LOGS.LIST, { params: { file: selectedFile, lines: lineCount } });
      const data = res.data.data;
      setEntries(data.entries || []);
      setTotal(data.total || 0);
    } catch (error) {
      handleApiError(error, 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get(LOGS.FILES);
      setFiles(res.data.data.files || []);
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    fetchFiles();
  }, [selectedFile, lineCount]);

  const filtered = filterLevel === 'all'
    ? entries
    : entries.filter((e) => e.level === filterLevel);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Logs</h1>
          <p className="text-sm text-muted-foreground">
            Application log viewer — {total} total entries in {selectedFile}.log
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* File selector */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
          >
            <option value="combined">combined.log</option>
            <option value="error">error.log</option>
          </select>

          {/* Level filter */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          {/* Lines */}
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={lineCount}
            onChange={(e) => setLineCount(parseInt(e.target.value))}
          >
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
            <option value={500}>Last 500</option>
          </select>

          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCcw className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Log Files Summary */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((f) => (
            <button
              key={f.name}
              onClick={() => setSelectedFile(f.name.replace('.log', ''))}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs transition-colors',
                selectedFile === f.name.replace('.log', '') ? 'bg-primary/10 border-primary text-primary' : 'hover:bg-accent',
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">{f.name}</span>
              <span className="text-muted-foreground">{formatSize(f.size)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Log Entries */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading logs...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {entries.length === 0
                  ? 'No log entries found. Logs are generated in production mode.'
                  : `No ${filterLevel} entries found`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border font-mono text-xs">
              {filtered.map((entry, idx) => {
                const level = entry.level || 'info';
                const style = LEVEL_STYLES[level] || LEVEL_STYLES.info;
                const isExpanded = expandedIdx === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className={cn(
                      'flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/50',
                      isExpanded && 'bg-muted/30',
                    )}
                  >
                    {/* Level badge */}
                    <span className={cn('mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 shrink-0', style.bg, style.color)}>
                      {style.icon}
                      <span className="uppercase font-bold text-[9px]">{level}</span>
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {entry.context && (
                          <span className="text-primary font-semibold">[{entry.context}]</span>
                        )}
                        <span className={cn('text-foreground', isExpanded ? '' : 'truncate')}>
                          {entry.message}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 space-y-1 text-muted-foreground">
                          {entry.timestamp && <p>Time: {new Date(entry.timestamp).toLocaleString()}</p>}
                          {entry.trace && (
                            <pre className="mt-1 rounded bg-muted p-2 text-[10px] overflow-x-auto whitespace-pre-wrap text-red-500">
                              {entry.trace}
                            </pre>
                          )}
                          {Object.entries(entry)
                            .filter(([k]) => !['timestamp', 'level', 'message', 'context', 'trace', 'raw'].includes(k))
                            .map(([k, v]) => (
                              <p key={k}>
                                <span className="text-muted-foreground/60">{k}:</span>{' '}
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </p>
                            ))
                          }
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="shrink-0 text-muted-foreground/60 text-[10px]">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleTimeString()
                        : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
