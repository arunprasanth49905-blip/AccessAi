import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Eye,
  Mic,
  Compass,
  FileText,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Layers,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { AccessibleButton } from '../components/common/AccessibleButton';
import { ConfidenceIndicator } from '../components/common/ConfidenceIndicator';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Access<span className="text-brand-600">AI</span>
            </span>
          </NavLink>

          <div className="flex items-center gap-3">
            <NavLink
              to="/demo"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-2 rounded-xl transition-colors hidden sm:block"
            >
              Judge Demo
            </NavLink>
            <NavLink to="/app">
              <AccessibleButton variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                Try AccessAI
              </AccessibleButton>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-8 pt-12 pb-20 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/15 dark:bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Tagline pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs sm:text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI Multimodal Accessibility Companion</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Your world, made <span className="text-brand-600 dark:text-brand-400 underline decoration-brand-300 dark:decoration-brand-700 underline-offset-8">more understandable.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            An AI accessibility companion that helps you see, hear, understand, and navigate the world around you.
          </p>

          {/* Feature statement badge */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs sm:text-sm font-bold tracking-widest text-slate-700 dark:text-slate-300">
            <span className="text-brand-600 dark:text-brand-400">SEE</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400">HEAR</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-600 dark:text-amber-400">UNDERSTAND</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-purple-600 dark:text-purple-400">ASSIST</span>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <NavLink to="/app" className="w-full sm:w-auto">
              <AccessibleButton
                variant="primary"
                size="xl"
                fullWidth
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Try AccessAI
              </AccessibleButton>
            </NavLink>

            <NavLink to="/demo" className="w-full sm:w-auto">
              <AccessibleButton
                variant="outline"
                size="xl"
                fullWidth
                icon={<Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              >
                Explore Demo
              </AccessibleButton>
            </NavLink>
          </div>

          {/* Interactive Live Assistant Preview */}
          <div className="mt-16 max-w-4xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-8 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-medium text-slate-400 ml-2">
                  AccessAI Live Assistant Feed
                </span>
              </div>
              <ConfidenceIndicator level="high" percentage={96} showDetails={false} size="sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
              {/* Vision Preview */}
              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
                  alt="Office Hallway Demonstration"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Simulated Bounding Box Overlay */}
                <div
                  className="absolute border-2 border-brand-400 bg-brand-500/20 rounded-lg flex items-start p-1"
                  style={{ top: '22%', left: '38%', width: '24%', height: '56%' }}
                >
                  <span className="text-[10px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded shadow">
                    Doorway 97%
                  </span>
                </div>
                <div
                  className="absolute border-2 border-amber-400 bg-amber-500/20 rounded-lg flex items-start p-1"
                  style={{ top: '62%', left: '42%', width: '20%', height: '26%' }}
                >
                  <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded shadow">
                    Obstacle 84%
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-sm text-white px-3 py-2 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Real-time spatial analysis: 4 objects identified</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-75">1080p • 30 FPS</span>
                </div>
              </div>

              {/* AI Reasoning Response Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800">
                  <div className="text-xs uppercase font-bold text-brand-600 dark:text-brand-400 mb-1">
                    Auditory AI Description
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                    "I can see an accessible doorway approximately 3 meters ahead. A chair is to your right. Please caution: a low cleaning cart is in the center walkway."
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-0.5">⚠️ Safety Confidence: Medium</span>
                  Please verify before moving forward.
                </div>

                <div className="flex gap-2">
                  <NavLink to="/camera" className="flex-1">
                    <AccessibleButton variant="secondary" size="sm" fullWidth icon={<Eye className="w-4 h-4" />}>
                      Explore Vision
                    </AccessibleButton>
                  </NavLink>
                  <NavLink to="/voice" className="flex-1">
                    <AccessibleButton variant="primary" size="sm" fullWidth icon={<Mic className="w-4 h-4" />}>
                      Speak with AI
                    </AccessibleButton>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Core Pillars: SEE, READ, TALK, NAVIGATE */}
        <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Designed around four fundamental superpowers
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Not another generic chatbot. Built specifically for physical autonomy, safety, and confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SEE */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">SEE</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Describe surroundings, estimate distance to obstacles, identify people, and detect open doors.
              </p>
              <NavLink to="/camera" className="text-sm font-bold text-brand-600 hover:underline inline-flex items-center gap-1">
                Open Camera <span>→</span>
              </NavLink>
            </div>

            {/* READ */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">READ</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Extract text from signs, medicine bottles, and menus. Instant translation to Tamil, Hindi, Telugu, and Malayalam.
              </p>
              <NavLink to="/reader" className="text-sm font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
                Read Text <span>→</span>
              </NavLink>
            </div>

            {/* TALK */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">TALK</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Natural conversational voice interface with dynamic speech waveforms and confidence calibration.
              </p>
              <NavLink to="/voice" className="text-sm font-bold text-purple-600 hover:underline inline-flex items-center gap-1">
                Start Talking <span>→</span>
              </NavLink>
            </div>

            {/* NAVIGATE */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">NAVIGATE</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Find accessible step-free paths, ramps, elevators, and tactile paving while actively avoiding stairs.
              </p>
              <NavLink to="/navigation" className="text-sm font-bold text-amber-600 hover:underline inline-flex items-center gap-1">
                Calculate Route <span>→</span>
              </NavLink>
            </div>
          </div>
        </section>

        {/* Accessibility Commitments */}
        <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto bg-gradient-to-b from-brand-50/50 to-transparent dark:from-brand-950/20 rounded-3xl mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <ShieldCheck className="w-10 h-10 text-brand-600 mx-auto mb-3" />
              <div className="font-bold text-lg mb-1">Safety-First Confidence</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Never overpromises. Explicitly communicates uncertainty with High, Medium, and Low warnings.
              </p>
            </div>

            <div className="p-4">
              <Layers className="w-10 h-10 text-brand-600 mx-auto mb-3" />
              <div className="font-bold text-lg mb-1">Adaptive UI Engine</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Large Text, High Contrast, and Simplified Modes actually transform the interface in real time.
              </p>
            </div>

            <div className="p-4">
              <Volume2 className="w-10 h-10 text-brand-600 mx-auto mb-3" />
              <div className="font-bold text-lg mb-1">Resilient Fallbacks</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Seamless demo modes and Web API fallbacks ensure judges and users never encounter a broken screen.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-slate-900 dark:text-slate-100">AccessAI</span>
            <span>— Your world, made more understandable.</span>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/safety" className="hover:underline">Safety Center</NavLink>
            <NavLink to="/profile" className="hover:underline">Accessibility Profile</NavLink>
            <NavLink to="/demo" className="hover:underline font-bold text-brand-600">Demo Mode</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
};
