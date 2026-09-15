import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AssistantProvider } from './context/AssistantContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { CameraVisionPage } from './pages/CameraVisionPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { TextReaderPage } from './pages/TextReaderPage';
import { NavigationPage } from './pages/NavigationPage';
import { HistoryPage } from './pages/HistoryPage';
import { AccessibilityProfilePage } from './pages/AccessibilityProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { SafetyCenterPage } from './pages/SafetyCenterPage';

export const App: React.FC = () => {
  return (
    <AccessibilityProvider>
      <AssistantProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Main App Layout */}
            <Route element={<AppShell />}>
              <Route path="/app" element={<HomePage />} />
              <Route path="/camera" element={<CameraVisionPage />} />
              <Route path="/voice" element={<VoiceAssistantPage />} />
              <Route path="/reader" element={<TextReaderPage />} />
              <Route path="/navigation" element={<NavigationPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<AccessibilityProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/safety" element={<SafetyCenterPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </BrowserRouter>
      </AssistantProvider>
    </AccessibilityProvider>
  );
};

export default App;
