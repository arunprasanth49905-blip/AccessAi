import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Phone,
  Send,
  Share2,
  Info,
  UserCheck,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { SafetyAlert } from '../components/common/SafetyAlert';
import { useAssistant } from '../context/AssistantContext';
import { audioFeedback } from '../services/audioFeedbackService';
import { TrustedContact, SafetyAlertItem } from '../types';

export const SafetyCenterPage: React.FC = () => {
  const { openEmergencyModal, showToast } = useAssistant();

  const [trustedContact] = useState<TrustedContact>({
    name: 'Maya Sundaram',
    relation: 'Sister & Designated Caregiver',
    phone: '+1 (555) 349-8821',
    email: 'maya.sundaram@accessai.demo',
    isEmergencyAlertRecipient: true,
  });

  const [activeAlerts, setActiveAlerts] = useState<SafetyAlertItem[]>([
    {
      id: 'alt-1',
      title: 'Possible obstacle in hallway',
      description: 'An object (cleaning trolley) may be blocking your central corridor path approximately 1.5 meters ahead.',
      confidence: 'medium',
      timeAgo: '14 mins ago',
      severity: 'medium',
      recommendation: 'Please verify physical path before moving forward.',
      verified: false,
    },
    {
      id: 'alt-2',
      title: 'Descending steps without tactile strip',
      description: 'Staircase detected on your far left concourse. Step-free path is straight ahead.',
      confidence: 'high',
      timeAgo: '42 mins ago',
      severity: 'high',
      recommendation: 'Use Elevator Bank B on the right side of the concourse.',
      verified: true,
    },
  ]);

  const handleSimulateCall = () => {
    audioFeedback.playChime();
    showToast(`Calling ${trustedContact.name}`, 'Simulating hands-free call over speakerphone...', 'info');
  };

  const handleSimulateMessage = () => {
    audioFeedback.playChime();
    showToast(`Message Sent to ${trustedContact.name}`, '"AccessAI status update: I am at Chennai Tech Center Concourse."', 'success');
  };

  const handleSimulateLocationShare = () => {
    audioFeedback.playSuccess();
    showToast('Location Broadcast Active', 'Sharing live telemetry: 13.0827° N, 80.2707° E with Maya Sundaram.', 'success');
  };

  const handleVerifyAlert = (id: string) => {
    audioFeedback.playClick();
    setActiveAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, verified: true } : a))
    );
    showToast('Alert Verified', 'Recorded verified state in local safety ledger.', 'info');
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>SAFETY SYSTEM & RISK CALIBRATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Safety Center
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AccessAI provides assistance, not guaranteed decisions. Always verify critical information.
          </p>
        </div>

        <AccessibleButton
          variant="danger"
          size="lg"
          icon={<PhoneCall className="w-5 h-5 animate-pulse" />}
          onClick={openEmergencyModal}
          className="shadow-md shadow-red-500/25"
        >
          Emergency Support
        </AccessibleButton>
      </div>

      {/* Primary AI Safety Guarantee Disclaimer */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border-2 border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-amber-400">
              The AccessAI Safety Principle
            </h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
              "AccessAI provides assistance, not guaranteed decisions. Always verify critical information before stepping forward or relying on automated obstacle detection."
            </p>
            <div className="text-xs text-slate-400 font-mono pt-1">
              Safety Standard ISO 21801-1 • Calibrated Multi-Sensor Redundancy
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Indicators Guide */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              How AccessAI Communicates Confidence
            </h3>
          </div>
          <span className="text-xs text-slate-400">3 Calibrated Tiers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* High */}
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                🟢 High Confidence
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded">
                90% – 100%
              </span>
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
              Crisp visual match with high illumination. Used for clear doors, signs, and verified tactile paving.
            </p>
          </div>

          {/* Medium */}
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                🟡 Medium Confidence
              </span>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-2 py-0.5 rounded">
                70% – 89%
              </span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-semibold">
              "An object may be blocking your path approximately 1.5m ahead. Please verify before moving."
            </p>
          </div>

          {/* Low */}
          <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                🔴 Low Confidence
              </span>
              <span className="text-xs font-mono font-bold bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-200 px-2 py-0.5 rounded">
                &lt; 70%
              </span>
            </div>
            <p className="text-xs text-rose-950 dark:text-rose-100 leading-relaxed font-semibold">
              "I'm not completely sure what this object is. Please verify before relying on this information."
            </p>
          </div>
        </div>
      </div>

      {/* Trusted Contact Card & Quick Actions */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Trusted Contact
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Emergency Recipient
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-extrabold text-lg">
              MS
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                {trustedContact.name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {trustedContact.relation} • {trustedContact.phone}
              </div>
            </div>
          </div>

          {/* Contact Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <AccessibleButton
              variant="secondary"
              size="sm"
              icon={<Phone className="w-4 h-4 text-emerald-600" />}
              onClick={handleSimulateCall}
            >
              Call
            </AccessibleButton>

            <AccessibleButton
              variant="secondary"
              size="sm"
              icon={<Send className="w-4 h-4 text-brand-600" />}
              onClick={handleSimulateMessage}
            >
              Message
            </AccessibleButton>

            <AccessibleButton
              variant="secondary"
              size="sm"
              icon={<Share2 className="w-4 h-4 text-purple-600" />}
              onClick={handleSimulateLocationShare}
            >
              Share Location
            </AccessibleButton>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Note: For hackathon demonstration purposes, calls, SMS messages, and location broadcasts are simulated safely.
        </p>
      </div>

      {/* Active Safety Alerts & Obstacle Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Active Obstacle & Safety Alerts
            </h3>
          </div>
          <span className="text-xs text-slate-400">{activeAlerts.length} recorded</span>
        </div>

        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-3xl border-2 transition-all space-y-3 ${
                alert.severity === 'high'
                  ? 'bg-red-50/80 dark:bg-red-950/40 border-red-400 dark:border-red-700'
                  : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h4>
                    <span className="text-xs text-slate-400">• {alert.timeAgo}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
                <ConfidenceIndicator level={alert.confidence} showDetails={false} size="sm" />
              </div>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-200">
                  Recommendation: {alert.recommendation}
                </span>
                {alert.verified ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleVerifyAlert(alert.id)}
                    className="text-brand-600 hover:underline font-bold"
                  >
                    Mark Verified
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
