import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { Settings, TranslationRecord, LangCode, Domain } from '../shared/types';
import { LANGUAGES, LANGUAGE_MAP, DOMAIN_LABELS, DEFAULT_SETTINGS } from '../shared/constants';
import TermManager from './TermManager';
import './options.css';

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

type Tab = 'terms' | 'history' | 'settings';

// -----------------------------------------------------------------------
// Options root
// -----------------------------------------------------------------------

function Options() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');
  const [toast, setToast] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    chrome.storage.local.get('settings', (result) => {
      if (result.settings) setSettings(result.settings as Settings);
    });
  }, []);

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.remove('theme-light', 'theme-dark');
    if (settings.theme === 'light') document.body.classList.add('theme-light');
    else if (settings.theme === 'dark') document.body.classList.add('theme-dark');
  }, [settings.theme]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'terms', label: 'Terms' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="options-root">
      <header className="options-header">
        <h1>Nazori</h1>
        <p>Translation assistant settings and terminology management</p>
      </header>

      <nav className="tab-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'terms' && <TermManager showToast={showToast} />}
      {activeTab === 'history' && <HistoryTab showToast={showToast} />}
      {activeTab === 'settings' && (
        <SettingsTab settings={settings} setSettings={setSettings} showToast={showToast} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------
// History tab
// -----------------------------------------------------------------------

function HistoryTab({ showToast }: { showToast: (msg: string) => void }) {
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get('history', (result) => {
      const history = (result.history as TranslationRecord[] | undefined) ?? [];
      // Sort newest first
      setRecords(history.sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });
  }, []);

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.sourceText.toLowerCase().includes(q) ||
      r.translatedText.toLowerCase().includes(q) ||
      r.url?.toLowerCase().includes(q)
    );
  });

  async function clearHistory() {
    await chrome.storage.local.set({ history: [] });
    setRecords([]);
    showToast('History cleared');
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function langName(code: LangCode): string {
    return LANGUAGE_MAP[code]?.name ?? code;
  }

  return (
    <>
      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-danger"
          onClick={clearHistory}
          disabled={records.length === 0}
        >
          Clear History
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading history...</div>
      ) : filtered.length === 0 ? (
        <div className="history-empty">
          {search ? 'No history items match your search.' : 'No translation history yet.'}
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((r) => (
            <div key={r.id} className="history-item">
              <div className="history-source">
                <p>{r.sourceText}</p>
                <div className="history-meta">
                  {langName(r.sourceLang)} &middot; {DOMAIN_LABELS[r.domain]} &middot;{' '}
                  {formatDate(r.timestamp)}
                </div>
              </div>
              <div className="history-arrow">&#8594;</div>
              <div className="history-target">
                <p>{r.translatedText}</p>
                <div className="history-meta">
                  {langName(r.targetLang)}
                  {r.matchedTerms.length > 0 && (
                    <> &middot; {r.matchedTerms.length} term{r.matchedTerms.length > 1 ? 's' : ''} matched</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
        {records.length} total record{records.length !== 1 ? 's' : ''}
        {search && filtered.length !== records.length && ` (${filtered.length} shown)`}
      </div>
    </>
  );
}

// -----------------------------------------------------------------------
// Settings tab
// -----------------------------------------------------------------------

function SettingsTab({
  settings,
  setSettings,
  showToast,
}: {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  showToast: (msg: string) => void;
}) {
  async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await chrome.storage.local.set({ settings: updated });
    showToast('Settings saved');
  }

  return (
    <div className="card">
      <h2>Settings</h2>

      <div className="settings-grid">
        {/* Theme */}
        <div className="setting-card">
          <label htmlFor="opt-theme">Theme</label>
          <div className="setting-desc">Choose the UI color scheme</div>
          <select
            id="opt-theme"
            value={settings.theme}
            onChange={(e) => update('theme', e.target.value as Settings['theme'])}
          >
            <option value="system">System default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Font size */}
        <div className="setting-card">
          <label htmlFor="opt-font">Translation Font Size</label>
          <div className="setting-desc">Size of translated text in the popup overlay</div>
          <select
            id="opt-font"
            value={settings.fontSize}
            onChange={(e) => update('fontSize', e.target.value as Settings['fontSize'])}
          >
            <option value="small">Small (12px)</option>
            <option value="medium">Medium (14px)</option>
            <option value="large">Large (16px)</option>
          </select>
        </div>

        {/* Trigger mode */}
        <div className="setting-card">
          <label htmlFor="opt-trigger">Trigger Mode</label>
          <div className="setting-desc">How to activate translation on a page</div>
          <select
            id="opt-trigger"
            value={settings.triggerMode}
            onChange={(e) => update('triggerMode', e.target.value as Settings['triggerMode'])}
          >
            <option value="select">Text selection</option>
            <option value="double-click">Double-click word</option>
            <option value="hotkey">Keyboard shortcut</option>
          </select>
        </div>

        {/* Default target language */}
        <div className="setting-card">
          <label htmlFor="opt-lang">Default Target Language</label>
          <div className="setting-desc">Language to translate into by default</div>
          <select
            id="opt-lang"
            value={settings.defaultTargetLang}
            onChange={(e) => update('defaultTargetLang', e.target.value as LangCode)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toggle: Term highlighting */}
      <div style={{ marginTop: 16 }}>
        <div className="toggle-row">
          <div className="toggle-info">
            <label>Term Highlighting</label>
            <span>Highlight matched terminology in translated text</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.showTermHighlight}
              onChange={(e) => update('showTermHighlight', e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>

      {/* Toggle: Enabled */}
      <div style={{ marginTop: 8 }}>
        <div className="toggle-row">
          <div className="toggle-info">
            <label>Extension Enabled</label>
            <span>Master switch to enable or disable Nazori on all pages</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// Mount
// -----------------------------------------------------------------------

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
