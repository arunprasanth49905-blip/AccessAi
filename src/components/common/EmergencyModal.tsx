import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, X, MapPin, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { AccessibleButton } from './AccessibleButton';
import { audioFeedback } from '../../services/audioFeedbackService';

export const EmergencyModal: React.FC = () => {
  const { isEmergencyModalOpen, closeEmergencyModal, showToast } = useAssistant();
  const [step, setStep] = useState<'confirm' | 'alerting' | 'sent'>('confirm');

  if (!isEmergencyModalOpen) return null;

  const handleSimulateAlert = () => {
    audioFeedback.playAlert();
    setStep('alerting');

    setTimeout(() => {
      audioFeedback.playSuccess();
      setStep('sent');
      showToast('Emergency Alert Simulated', 'Trusted contacts notified with your current coordinates.', 'success');
    }, 1800);
  };

  const handleClose = () => {
    setStep('confirm');
    closeEmergencyModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-dialog-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden">
        {/* Top banner */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <h2 id="emergency-dialog-title" className="text-lg font-bold">
              Emergency Assistance Simulation
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'confirm' && (
            <>
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                <div>
                  <span className="font-bold block">Hackathon Demo Notice:</span>
                  This feature simulates notifying designated emergency contacts. Real 911 / emergency services are
                  never contacted.
                </div>
              </div>

              {/* Trusted Contact Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  Primary Emergency Contact
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Maya Sundaram</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sister • Primary Caregiver</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    +1 (555) 349-8821
                  </div>
                </div>
              </div>

              {/* Location telemetry */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Simulated GPS: 13.0827° N, 80.2707° E (Chennai Tech Center)</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <AccessibleButton
                  variant="danger"
                  size="lg"
                  fullWidth
                  icon={<PhoneCall className="w-5 h-5" />}
                  onClick={handleSimulateAlert}
                >
                  Confirm Emergency Alert
                </AccessibleButton>
                <AccessibleButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleClose}
                >
                  Cancel
                </AccessibleButton>
              </div>
            </>
          )}

          {step === 'alerting' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 mx-auto flex items-center justify-center animate-ping">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dispatching Simulated Emergency Beacon...
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Transmitting precise audio landmark context and visual telemetry to Maya Sundaram.
              </p>
            </div>
          )}

          {step === 'sent' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Simulated Alert Successfully Sent
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Trusted contact received SMS with live map tracking link and audio environment summary.
                </p>
              </div>
              <AccessibleButton variant="primary" size="md" fullWidth onClick={handleClose}>
                Return to AccessAI
              </AccessibleButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
