'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import './dashboard.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

interface Form {
  id: string;
  title: string;
  status: string;
  category: string;
  updated_at: string;
}

function getIcon(name: string) {
  switch (name) {
    case 'forms':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'documents':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    case 'notifications':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case 'assistant':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6.2 5 7.4V20a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.6c3-1.2 5-4.1 5-7.4a8 8 0 0 0-8-8z" />
          <path d="M10 10h4" />
        </svg>
      );
    case 'browser':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 014-10z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [stats, setStats] = useState({ forms: 0, documents: 0, watches: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const [notifRes, formsRes, statsRes] = await Promise.all([
        fetch('/api/notifications?limit=5'),
        fetch('/api/forms?limit=5'),
        fetch('/api/stats'),
      ]);
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (formsRes.ok) setRecentForms(await formsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="app-layout">
      {/* Unified Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Main content */}
      <main className="main-content">
        <header className="main-header">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <div>
            <h1>Dashboard</h1>
            <p className="text-sm text-muted">Welcome back, {session.user?.name?.split(' ')[0]}</p>
          </div>
        </header>

        <div className="dashboard-content animate-fadeIn">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-blue">
                {getIcon('forms')}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.forms}</span>
                <span className="stat-label">Forms</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">
                {getIcon('documents')}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.documents}</span>
                <span className="stat-label">Documents</span>
              </div>
            </div>
            <Link href="/form-watch" className="stat-card card-hover" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="stat-icon stat-icon-amber">
                {getIcon('notifications')}
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.watches}</span>
                <span className="stat-label">Form Watch</span>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <section className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <Link href="/assistant" className="action-card card card-hover">
                <div className="action-icon">
                  {getIcon('assistant')}
                </div>
                <span className="action-label">AI Assistant</span>
                <span className="action-desc">Guidance & Services</span>
              </Link>
              <Link href="/forms/new" className="action-card card card-hover">
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span className="action-label">New Form</span>
                <span className="action-desc">Voice & auto-fill</span>
              </Link>
              <Link href="/documents" className="action-card card card-hover">
                <div className="action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/></svg>
                </div>
                <span className="action-label">Upload Document</span>
                <span className="action-desc">Add to your profile</span>
              </Link>
              <Link href="/browser" className="action-card card card-hover">
                <div className="action-icon">
                  {getIcon('browser')}
                </div>
                <span className="action-label">Portal Launcher</span>
                <span className="action-desc">Launch official portals</span>
              </Link>
            </div>
          </section>

          {/* Recent Forms */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recent Forms</h2>
              <Link href="/forms" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {recentForms.length > 0 ? (
              <div className="recent-list">
                {recentForms.map((form) => (
                  <Link key={form.id} href={`/forms/${form.id}`} className="recent-item card card-hover">
                    <div className="recent-item-info">
                      <span className="recent-item-title">{form.title}</span>
                      <span className="text-xs text-muted">{form.category || 'General'}</span>
                    </div>
                    <span className={`badge badge-${form.status === 'completed' ? 'success' : form.status === 'submitted' ? 'accent' : 'default'}`}>
                      {form.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p className="text-sm text-muted">No forms yet. Create your first form!</p>
                <Link href="/forms/new" className="btn btn-primary btn-sm">Create Form</Link>
              </div>
            )}
          </section>

          {/* Notifications */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Notifications</h2>
              <Link href="/notifications" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {notifications.length > 0 ? (
              <div className="recent-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notif-item ${!notif.is_read ? 'notif-unread' : ''}`}>
                    <div className={`notif-dot notif-dot-${notif.type}`} />
                    <div className="notif-content">
                      <span className="notif-title">{notif.title}</span>
                      <span className="text-xs text-muted">{notif.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                No notifications yet
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
