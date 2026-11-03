'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import '../../dashboard/dashboard.css';
import '@/app/extension/extension-connect.css';
import BuddyBot from '@/components/BuddyBot';

export default function ExtensionConnectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [extensionDetected, setExtensionDetected] = useState(false);
  const [extensionVersion, setExtensionVersion] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    // Check if extension content script injected dataset attribute
    const checkExt = () => {
      const extVer = document.documentElement.dataset.tfbExtension;
      if (extVer) {
        setExtensionDetected(true);
        setExtensionVersion(extVer);
      }
    };

    checkExt();
    const interval = setInterval(checkExt, 500);

    const onExtReady = (e: any) => {
      const ver = e.detail?.version || '1.0.0';
      setExtensionDetected(true);
      setExtensionVersion(ver);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TFB_EXTENSION_READY') {
        setExtensionDetected(true);
        setExtensionVersion(e.data.version || '1.0.0');
      }
    };
    window.addEventListener('tfb-extension-ready', onExtReady);
    window.addEventListener('message', onMessage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tfb-extension-ready', onExtReady);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg('');
    try {
      if (!extensionDetected) throw new Error('Install or reload the extension on this page, then try again.');
      const requestId = `tfb-connect-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          window.removeEventListener('message', handleResult);
          reject(new Error('The extension did not respond. Reload the page and try again.'));
        }, 8000);
        const handleResult = (event: MessageEvent) => {
          if (event.source !== window || event.origin !== window.location.origin) return;
          if (event.data?.type !== 'TFB_CONNECT_RESULT' || event.data.requestId !== requestId) return;
          window.clearTimeout(timer);
          window.removeEventListener('message', handleResult);
          resolve({ success: Boolean(event.data.success), error: event.data.error });
        };
        window.addEventListener('message', handleResult);
        window.postMessage({ type: 'TFB_REQUEST_CONNECT', requestId }, window.location.origin);
      });
      if (!result.success) throw new Error(result.error || 'Extension pairing failed.');
      setConnected(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting extension');
    } finally {
      setConnecting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout extension-connect-page" style={{ minHeight: '100vh' }}>
      <main className="extension-connect-main">
        <div className="card extension-connect-card">
          <div className="extension-connect-heading">
            <BuddyBot size={132} label="Buddy is ready to connect" />
            <h1>
              Connect TechForm Buddy Extension
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Pair your browser extension to assist in filling official forms on external websites securely.
            </p>
          </div>

          {/* Extension Detection Status */}
          <div
            className="extension-detection-status"
            style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: extensionDetected ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${extensionDetected ? '#bbf7d0' : '#fde68a'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{extensionDetected ? '✅' : '⚠️'}</span>
              <div>
                <strong style={{ fontSize: '14px', color: extensionDetected ? '#166534' : '#92400e' }}>
                  {extensionDetected ? `Extension Detected (v${extensionVersion || '1.0.0'})` : 'Extension Not Detected'}
                </strong>
                <p style={{ margin: 0, fontSize: '12px', color: extensionDetected ? '#15803d' : '#b45309' }}>
                  {extensionDetected
                    ? 'Ready to establish authenticated connection.'
                    : 'Ensure the extension is installed and loaded in Chrome.'}
                </p>
              </div>
            </div>
          </div>

          {connected ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#16a34a', margin: '0 0 8px 0' }}>
                Extension Successfully Connected!
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                Your extension confirmed pairing with scoped access (<code>form:map</code>, <code>profile:read</code>).
                You can now navigate to any form website and click <strong>&ldquo;Start on this page&rdquo;</strong> in the extension popup.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </Link>
                <Link href="/settings" className="btn btn-secondary">
                  Manage Extensions
                </Link>
              </div>
            </div>
          ) : (
            <div>
              {errorMsg && (
                <div className="extension-connect-error" style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                  {errorMsg}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 600 }}
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? 'Authorizing & Connecting...' : 'Connect Extension Now'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Link href="/dashboard" style={{ fontSize: '13px', color: '#64748b' }}>
                  Cancel and return to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
