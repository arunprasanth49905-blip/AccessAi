import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { ToastContainer } from '../common/Toast';
import { EmergencyModal } from '../common/EmergencyModal';
import { useAssistant } from '../../context/AssistantContext';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { openEmergencyModal } = useAssistant();

  // Global accessibility keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      if (key === 'c') {
        navigate('/camera');
      } else if (key === 'v') {
        navigate('/voice');
      } else if (key === 'r') {
        navigate('/reader');
      } else if (key === 'n') {
        navigate('/navigation');
      } else if (key === 'h') {
        navigate('/app');
      } else if (key === 'e') {
        openEmergencyModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, openEmergencyModal]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <Outlet />
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileNavigation />

      {/* Persistent Live Region Notifications */}
      <ToastContainer />

      {/* Simulated Emergency Modal */}
      <EmergencyModal />
    </div>
  );
};
