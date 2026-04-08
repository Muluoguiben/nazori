import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Settings, TranslationRecord, LangCode, Domain } from '../shared/types';
import { LANGUAGES, DOMAINS, DOMAIN_LABELS, DEFAULT_SETTINGS } from '../shared/constants';
import './popup.css';

function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [translationCount, setTranslationCount] = useState(0);
  const [termCount, setTermCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await chrome.storage.local.get([
        'settings',
        'history',
        'terms:general',
        'terms:legal',
        'terms:medical',
        'terms:tech',
      ]);

      if (result.settings) {
        setSettings(result.settings as Settings);
      }

      const history = (result.history as TranslationRecord[] | undefined) ?? [];
      // Count translations from the last 24 hours as "session" stats
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      setTranslationCount(history.filter((r) => r.timestamp > dayAgo).length);

      const allTerms = [
        ...((result['terms:general'] as unknown[]) ?? []),
        ...((result['terms:legal'] as unknown[]) ?? []),
        ...((result['terms:medical'] as unknown[]) ?? []),
        ...((result['terms:tech'] as unknown[]) ?? []),
      ];
      setTermCount(allTerms.length);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await chrome.storage.local.set({ settings: updated });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <header className="popup-header">
        <div>
          <h1>Nazori</h1>
          <span className="subtitle">Translation Assistant</span>
        </div>
        <div className="toggle-wrap">
          <span className="toggle-label">{settings.enabled ? 'On' : 'Off'}</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
            />
            <span className="slider" />
          </label>
        </div>
      </header>

      <div className={`popup-body${settings.enabled ? '' : ' disabled'}`}>
        <div className="setting-row">
          <label htmlFor="target-lang">Target Language</label>
          <select
            id="target-lang"
            value={settings.defaultTargetLang}
            onChange={(e) => updateSetting('defaultTargetLang', e.target.value as LangCode)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        <div className="setting-row">
          <label htmlFor="domain">Domain</label>
          <select
            id="domain"
            value={settings.defaultDomain}
            onChange={(e) => updateSetting('defaultDomain', e.target.value as Domain)}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">{translationCount}</div>
            <div className="stat-label">Today</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">{termCount}</div>
            <div className="stat-label">Terms</div>
          </div>
        </div>
      </div>

      <div className="popup-footer">
        <button type="button" onClick={openOptions}>
          Open Settings &amp; Term Manager
        </button>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Popup />);
