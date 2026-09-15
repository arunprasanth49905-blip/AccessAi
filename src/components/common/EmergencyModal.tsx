import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, X, MapPin, UserCheck, AlertTriangle, Phone, MessageSquare, Copy } from 'lucide-react';
import { useAssistant } from '../../context/AssistantContext';
import { AccessibleButton } from './AccessibleButton';
import { audioFeedback } from '../../services/audioFeedbackService';

export const EmergencyModal: React.FC = () => {
  const { isEmergencyModalOpen, closeEmergencyModal, showToast } = useAssistant();
  const [currentCoords, setCurrentCoords] = useState<{ lat: string; lng: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  if (!isEmergencyModalOpen) return null;

  const contactPhone = '+15553498821';
  const contactName = 'Maya Sundaram';

  const handleCallContact = () => {
    audioFeedback.playChime();
    window.location.href = `tel:${contactPhone}`;
  };

  const handleSmsContact = () => {
    audioFeedback.playChime();
    const locationNote = currentCoords
      ? ` My current GPS coordinates are: https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`
      : '';
    const bodyText = encodeURIComponent(`URGENT: I need assistance.${locationNote}`);
    window.location.href = `sms:${contactPhone}?body=${bodyText}`;
  };

  const handleCallEmergencyServices = () => {
    audioFeedback.playAlert();
    window.location.href = 'tel:911';
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGettingLocation(false);
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          setCurrentCoords({ lat, lng });
          showToast('GPS Acquired', `Coordinates: ${lat}, ${lng}`, 'success');
        },
        () => {
          setIsGettingLocation(false);
          showToast('GPS Notice', 'Location permission denied or unavailable.', 'warning');
        }
      );
    } else {
      showToast('GPS Unsupported', 'Geolocation is not supported by your browser.', 'warning');
    }
  };

  const handleCopyLocation = () => {
    if (currentCoords) {
      const link = `https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`;
      navigator.clipboard.writeText(link);
      audioFeedback.playSuccess();
      showToast('Copied', 'Location link copied to clipboard.', 'success');
    }
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
              Emergency Assistance Interface
            </h2>
          </div>
          <button
            onClick={closeEmergencyModal}
            className="p-1.5 rounded-full hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold block">Direct Device Communication:</span>
              This interface triggers direct phone calls and messages via your device. For immediate life-threatening emergencies, call emergency services directly.
            </div>
          </div>

          {/* Primary Emergency Contact Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
              Designated Emergency Contact
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{contactName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Primary Caregiver</div>
                </div>
              </div>
              <div className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {contactPhone}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <AccessibleButton
                variant="primary"
                size="md"
                fullWidth
                icon={<Phone className="w-4 h-4" />}
                onClick={handleCallContact}
              >
                Call Contact
              </AccessibleButton>
              <AccessibleButton
                variant="outline"
                size="md"
                fullWidth
                icon={<MessageSquare className="w-4 h-4" />}
                onClick={handleSmsContact}
              >
                Send SMS
              </AccessibleButton>
            </div>
          </div>

          {/* Location Helper */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>
                  {currentCoords
                    ? `GPS: ${currentCoords.lat}, ${currentCoords.lng}`
                    : 'Device GPS Location'}
                </span>
              </div>
              {currentCoords ? (
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isGettingLocation}
                  onClick={handleGetLocation}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {isGettingLocation ? 'Acquiring...' : 'Get Current GPS'}
                </button>
              )}
            </div>
          </div>

          {/* Direct Emergency Services Action */}
          <div className="pt-1">
            <AccessibleButton
              variant="danger"
              size="lg"
              fullWidth
              icon={<PhoneCall className="w-5 h-5 animate-pulse" />}
              onClick={handleCallEmergencyServices}
            >
              Call 911 / Local Emergency
            </AccessibleButton>
          </div>
        </div>
      </div>
    </div>
  );
};
