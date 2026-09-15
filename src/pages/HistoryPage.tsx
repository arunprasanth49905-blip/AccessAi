import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Volume2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  FileText,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';
import { useAssistant } from '../context/AssistantContext';
import { speechService } from '../services/speechService';
import { audioFeedback } from '../services/audioFeedbackService';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { recentAssistance, showToast, clearHistory } = useAssistant();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = recentAssistance.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesQuery && matchesFilter;
  });

  const handleReplay = (summary: string) => {
    audioFeedback.playChime();
    speechService.speak(summary);
    showToast('Replaying Assistance', summary, 'info');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    audioFeedback.playClick();
    setCopiedId(id);
    showToast('Copied to Clipboard', 'Text copied successfully.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your local assistance history?')) {
      clearHistory();
      showToast('History Cleared', 'Local assistance logs have been reset.', 'info');
    }
  };

  const typeIcons = {
    scene: <Eye className="w-5 h-5 text-brand-600" />,
    ocr: <FileText className="w-5 h-5 text-emerald-600" />,
    safety: <ShieldAlert className="w-5 h-5 text-amber-500" />,
    navigation: <Compass className="w-5 h-5 text-amber-500" />,
    voice: <Volume2 className="w-5 h-5 text-purple-600" />,
  };

  return (
    <PageContainer maxWidth="xl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>ASSISTANCE HISTORY & ARCHIVE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Assistance History
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Replay previous scene descriptions, review OCR documents, and continue conversations.
          </p>
        </div>

        {recentAssistance.length > 0 && (
          <AccessibleButton
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            Clear History
          </AccessibleButton>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past logs, signs, or obstacles..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'All' },
            { key: 'scene', label: '📷 Vision' },
            { key: 'ocr', label: '📝 Read' },
            { key: 'safety', label: '⚠️ Obstacles' },
            { key: 'navigation', label: '🧭 Routes' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                audioFeedback.playClick();
                setFilterType(tab.key);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                filterType === tab.key
                  ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <Clock className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="font-bold text-base text-slate-800 dark:text-slate-200">No matching logs</div>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm hover:shadow transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {typeIcons[item.type as keyof typeof typeIcons] || <Eye className="w-5 h-5 text-brand-600" />}
                  </div>

                  <div>
                    <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.relativeTime} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {item.confidence && (
                  <ConfidenceIndicator level={item.confidence} showDetails={false} size="sm" />
                )}
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {item.summary}
              </p>

              {/* Action Buttons: Open, Replay, Copy */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReplay(item.summary)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.summary)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <AccessibleButton
                  variant="primary"
                  size="sm"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => navigate(item.actionUrl)}
                >
                  Continue
                </AccessibleButton>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
};
