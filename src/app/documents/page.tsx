'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import '../dashboard/dashboard.css';
import './documents.css';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  extracted_data: string | null;
  uploaded_at: string;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchDocuments();
  }, [status]);

  const fetchDocuments = async () => {
    const res = await fetch('/api/documents');
    if (res.ok) setDocuments(await res.json());
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadSuccessMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadSuccessMsg(`"${file.name}" was stored encrypted. Its contents were not analyzed or added to your profile.`);
        setTimeout(() => setUploadSuccessMsg(''), 6000);
        fetchDocuments();
      }
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchDocuments();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📎';
  };

  const parseExtracted = (jsonStr: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr) as Record<string, string>;
    } catch {
      return null;
    }
  };

  if (status === 'loading' || !session) {
    return <div className="loading-screen"><div className="loading-spinner" /><p>Loading...</p></div>;
  }

  return (
    <div className="app-layout">
      {/* Unified Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <main className="main-content">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
            <div>
              <h1>Documents</h1>
              <p className="text-sm text-muted">Store documents securely. File contents are not currently analyzed or used for autofill.</p>
            </div>
          </div>
        </header>

        <div className="docs-content animate-fadeIn">
          {uploadSuccessMsg && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-success)', background: '#ecfdf5', padding: 'var(--space-md) var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>✓ Encrypted storage complete</span>
              </div>
              <p className="text-sm text-muted" style={{ marginTop: '4px' }}>{uploadSuccessMsg}</p>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`upload-area ${dragActive ? 'upload-area-active' : ''} ${uploading ? 'upload-area-uploading' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="upload-input"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
            />
            {uploading ? (
              <>
                <div className="loading-spinner" />
                <p>Encrypting and storing document...</p>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40" style={{ color: 'var(--color-text-tertiary)' }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p><strong>Drop files here</strong> or click to browse</p>
                <span className="text-xs text-muted">Aadhaar, PAN, Passport, Certificates, Utility Bills, Resume (PDF, Images, Word)</span>
              </>
            )}
          </div>

          {/* Documents List */}
          {documents.length > 0 ? (
            <div className="docs-list">
              <h2>Your Documents ({documents.length})</h2>
              <div className="docs-grid">
                {documents.map(doc => {
                  const extracted = parseExtracted(doc.extracted_data);
                  return (
                    <div key={doc.id} className="doc-item card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div className="doc-icon">{getFileIcon(doc.file_type)}</div>
                        <div className="doc-info" style={{ flex: 1 }}>
                          <span className="doc-name">{doc.file_name}</span>
                          <div className="doc-meta">
                            <span className="text-xs text-muted">{formatSize(doc.file_size)}</span>
                            <span className="text-xs text-muted">·</span>
                            <span className="text-xs text-muted">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteDocument(doc.id)} title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>

                      {extracted && (
                        <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                              📄 {extracted.documentType || 'Stored document'}
                            </span>
                            <span className="badge" style={{ fontSize: '10px' }}>Not analyzed</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', color: 'var(--color-text-secondary)' }}>
                            {Object.entries(extracted).filter(([k]) => k !== 'documentType' && k !== 'processingStatus').map(([key, val]) => (
                              <span key={key} style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                <strong>{key.replace(/_/g, ' ')}:</strong> {String(val)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" width="64" height="64"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <p className="text-muted">No documents uploaded yet</p>
              <p className="text-xs text-muted">Files are encrypted and stored only; you can manually enter their details into forms.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
