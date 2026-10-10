import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { DemoScenarioScreen } from '../screens/DemoScenarioScreen';
import { TestSuiteScreen } from '../screens/TestSuiteScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AuditLogScreen } from '../screens/AuditLogScreen';
import { formatRupees } from './MoneyDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  Sliders,
  FileText,
  RotateCcw,
} from 'lucide-react';

export const DevControlCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clock' | 'scenario' | 'tests' | 'settings' | 'audit'>('scenario');

  const clockTime = kitBookingAppInstance.getClockTime();

  const handleAdvance = (mins: number) => {
    kitBookingAppInstance.advanceClock(mins);
  };

  return (
    <>
      {/* Floating Subtle Trigger Pill at Bottom-Left */}
      <div className="fixed bottom-4 left-4 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs font-mono font-medium transition-colors cursor-pointer group"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:animate-ping" />
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Demo & Test Tools</span>
        </motion.button>
      </div>

      {/* Slide-over Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">System Tools & Verification</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Demo Clock ({clockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}), Section 14 Walkthrough, Unit Tests
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-1 border-b border-slate-800 bg-slate-950/40 overflow-x-auto scrollbar-none text-xs font-mono">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('scenario')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'scenario'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Section 14 Scenario</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('tests')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'tests'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>20 Unit Tests</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('clock')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'clock'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Demo Clock</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Policies & Reset</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </motion.button>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {activeTab === 'scenario' && <DemoScenarioScreen />}
                {activeTab === 'tests' && <TestSuiteScreen />}
                {activeTab === 'settings' && <SettingsScreen />}
                {activeTab === 'audit' && <AuditLogScreen />}

                {activeTab === 'clock' && (
                  <div className="space-y-6 max-w-lg mx-auto py-4">
                    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3">
                      <Clock className="w-10 h-10 text-amber-400 mx-auto" />
                      <div className="text-3xl font-black font-mono text-amber-400">
                        {clockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {clockTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <p className="text-xs text-slate-300">
                        The Injected Demo Clock simulates real-time progression to test the 20-minute rebooking cooldown window.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAdvance(5)}
                        className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        +5 Minutes
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAdvance(20)}
                        className="py-3 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        +20 Minutes (Cooldown)
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleAdvance(60)}
                        className="py-3 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        +60 Minutes
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
