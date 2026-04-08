import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Term, Domain, LangCode } from '../shared/types';
import { DOMAINS, DOMAIN_LABELS, LANGUAGES } from '../shared/constants';

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sendMsg<T = unknown>(type: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type, payload, requestId: generateRequestId(), timestamp: Date.now() },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response as T);
        }
      },
    );
  });
}

// -----------------------------------------------------------------------
// TermManager
// -----------------------------------------------------------------------

interface TermManagerProps {
  showToast: (message: string) => void;
}

export default function TermManager({ showToast }: TermManagerProps) {
  const [activeDomain, setActiveDomain] = useState<Domain>('general');
  const [terms, setTerms] = useState<Term[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTranslations, setAddTranslations] = useState<Partial<Record<LangCode, string>>>({});
  const [addNote, setAddNote] = useState('');

  // Edit modal
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [editTranslations, setEditTranslations] = useState<Partial<Record<LangCode, string>>>({});
  const [editNote, setEditNote] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------ Load terms ------
  const loadTerms = useCallback(async () => {
    setLoading(true);
    try {
      const key = `terms:${activeDomain}`;
      const result = await chrome.storage.local.get(key);
      setTerms((result[key] as Term[] | undefined) ?? []);
    } catch {
      showToast('Failed to load terms');
    } finally {
      setLoading(false);
    }
  }, [activeDomain, showToast]);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  // ------ Filtered terms ------
  const filtered = terms.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const inTranslations = Object.values(t.translations).some((v) =>
      v?.toLowerCase().includes(q),
    );
    const inNote = t.note?.toLowerCase().includes(q);
    return inTranslations || inNote;
  });

  // ------ Add term ------
  async function handleAdd() {
    const nonEmpty = Object.fromEntries(
      Object.entries(addTranslations).filter(([, v]) => v && v.trim()),
    ) as Partial<Record<LangCode, string>>;

    if (Object.keys(nonEmpty).length < 2) {
      showToast('Please add translations for at least 2 languages');
      return;
    }

    try {
      await sendMsg('TERMS_ADD', {
        domain: activeDomain,
        translations: nonEmpty,
        note: addNote.trim() || undefined,
      });
      setAddTranslations({});
      setAddNote('');
      setShowAddForm(false);
      showToast('Term added');
      loadTerms();
    } catch {
      showToast('Failed to add term');
    }
  }

  // ------ Edit term ------
  function startEdit(term: Term) {
    setEditingTerm(term);
    setEditTranslations({ ...term.translations });
    setEditNote(term.note ?? '');
  }

  async function handleUpdate() {
    if (!editingTerm) return;

    const nonEmpty = Object.fromEntries(
      Object.entries(editTranslations).filter(([, v]) => v && v.trim()),
    ) as Partial<Record<LangCode, string>>;

    if (Object.keys(nonEmpty).length < 2) {
      showToast('Please keep at least 2 language translations');
      return;
    }

    try {
      await sendMsg('TERMS_UPDATE', {
        id: editingTerm.id,
        translations: nonEmpty,
        note: editNote.trim() || undefined,
      });
      setEditingTerm(null);
      showToast('Term updated');
      loadTerms();
    } catch {
      showToast('Failed to update term');
    }
  }

  // ------ Delete term ------
  async function handleDelete(id: string) {
    try {
      await sendMsg('TERMS_DELETE', { domain: activeDomain, id });
      setDeletingId(null);
      showToast('Term deleted');
      loadTerms();
    } catch {
      showToast('Failed to delete term');
    }
  }

  // ------ Import ------
  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let importedTerms: Term[];

      if (file.name.endsWith('.csv')) {
        importedTerms = parseCSV(text);
      } else {
        importedTerms = JSON.parse(text);
      }

      if (!Array.isArray(importedTerms)) {
        showToast('Invalid file format: expected an array of terms');
        return;
      }

      await sendMsg('TERMS_IMPORT', { domain: activeDomain, terms: importedTerms });
      showToast(`Imported ${importedTerms.length} terms`);
      loadTerms();
    } catch {
      showToast('Failed to import terms: invalid file format');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function parseCSV(text: string): Term[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const result: Term[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const translations: Partial<Record<LangCode, string>> = {};
      let note = '';

      headers.forEach((header, idx) => {
        const val = values[idx];
        if (!val) return;
        if (header === 'note') {
          note = val;
        } else if (LANGUAGES.some((l) => l.code === header)) {
          translations[header as LangCode] = val;
        }
      });

      if (Object.keys(translations).length >= 1) {
        result.push({
          id: `import_${Date.now()}_${i}`,
          domain: activeDomain,
          translations,
          note: note || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return result;
  }

  // ------ Export ------
  async function handleExport() {
    try {
      const data = JSON.stringify(terms, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nazori-terms-${activeDomain}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Terms exported');
    } catch {
      showToast('Failed to export terms');
    }
  }

  // ------ Display columns: pick top languages that have data ------
  const displayLangs: LangCode[] = (() => {
    const langSet = new Set<LangCode>();
    for (const t of terms) {
      for (const code of Object.keys(t.translations) as LangCode[]) {
        langSet.add(code);
      }
    }
    // Ensure at least en + the source language are shown
    langSet.add('en');
    // Return sorted based on LANGUAGES order
    return LANGUAGES.map((l) => l.code).filter((c) => langSet.has(c));
  })();

  // Limit table columns to a manageable count
  const tableLangs = displayLangs.slice(0, 5);

  return (
    <>
      {/* Domain tabs */}
      <div className="domain-tabs">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            className={`domain-tab${activeDomain === d ? ' active' : ''}`}
            onClick={() => setActiveDomain(d)}
          >
            {DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Add Term
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleImportClick}>
          Import
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleExport}
          disabled={terms.length === 0}
        >
          Export
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input-hidden"
          accept=".json,.csv"
          onChange={handleImportFile}
        />
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="card">
          <h3>Add New Term</h3>
          <div className="term-form">
            <div className="translations-grid">
              {LANGUAGES.map((lang) => (
                <div key={lang.code} className="form-group">
                  <label>{lang.name}</label>
                  <input
                    type="text"
                    placeholder={lang.nativeName}
                    value={addTranslations[lang.code] ?? ''}
                    onChange={(e) =>
                      setAddTranslations((prev) => ({ ...prev, [lang.code]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <label>Note (optional)</label>
              <input
                type="text"
                placeholder="Context or usage note"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setAddTranslations({});
                  setAddNote('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAdd}>
                Add Term
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms table */}
      {loading ? (
        <div className="empty-state">Loading terms...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">---</div>
          {search
            ? 'No terms match your search.'
            : `No terms in ${DOMAIN_LABELS[activeDomain]} domain yet. Add one above.`}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="terms-table">
            <thead>
              <tr>
                {tableLangs.map((code) => {
                  const lang = LANGUAGES.find((l) => l.code === code)!;
                  return <th key={code}>{lang.name}</th>;
                })}
                <th>Note</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((term) => (
                <tr key={term.id}>
                  {tableLangs.map((code) => (
                    <td key={code}>{term.translations[code] ?? '--'}</td>
                  ))}
                  <td className="note-cell">{term.note ?? '--'}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => startEdit(term)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => setDeletingId(term.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        {terms.length} term{terms.length !== 1 ? 's' : ''} in {DOMAIN_LABELS[activeDomain]}
        {search && filtered.length !== terms.length && ` (${filtered.length} shown)`}
      </div>

      {/* Edit modal */}
      {editingTerm && (
        <div className="modal-overlay" onClick={() => setEditingTerm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Term</h2>
            <div className="term-form">
              <div className="translations-grid">
                {LANGUAGES.map((lang) => (
                  <div key={lang.code} className="form-group">
                    <label>{lang.name}</label>
                    <input
                      type="text"
                      placeholder={lang.nativeName}
                      value={editTranslations[lang.code] ?? ''}
                      onChange={(e) =>
                        setEditTranslations((prev) => ({
                          ...prev,
                          [lang.code]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="form-group" style={{ maxWidth: 400 }}>
                <label>Note (optional)</label>
                <input
                  type="text"
                  placeholder="Context or usage note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTerm(null)}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdate}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="confirm-dialog">
              <h2>Delete Term</h2>
              <p>Are you sure you want to delete this term? This action cannot be undone.</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeletingId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(deletingId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
