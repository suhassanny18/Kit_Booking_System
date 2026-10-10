import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Kit } from '../../domain/entities/Kit';
import { TierBadge } from '../components/StatusBadge';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { Tier } from '../../domain/enums';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Camera,
  Mic,
  Disc3,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';

interface BrowseKitsScreenProps {
  currentUserId: string;
  onSelectKit: (kit: Kit) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export const BrowseKitsScreen: React.FC<BrowseKitsScreenProps> = ({ currentUserId, onSelectKit }) => {
  const kits = kitBookingAppInstance.browseKits();
  const owners = kitBookingAppInstance.getOwners();
  const ownerMap = new Map(owners.map((o) => [o.id, o.name]));

  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const filteredKits = kits.filter((k) => (selectedTier === 'ALL' ? true : k.tier === selectedTier));

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 p-8 sm:p-12 overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Cinema Equipment Packages</span>
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Rent Full Production Kits with Confidence.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
            Each kit combines a cinema camera, studio microphone, and heavy-duty tripod in a single calibrated package.
            Reserve your time slot with only <strong className="text-amber-400">20% advance</strong> held in secure escrow.
          </p>

          {/* Quick filter pills with animated hover and active state */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Packages' },
              { id: Tier.PREMIUM, label: '★ Premium Cinema (Sony 4K)' },
              { id: Tier.STANDARD, label: 'Standard Production (Canon 4K)' },
              { id: Tier.BUDGET, label: 'Budget Creator (Nikon)' },
            ].map((tab) => {
              const isSelected = selectedTier === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedTier(tab.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Kits Grid with Framer Motion Stagger */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={selectedTier}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredKits.map((kit) => {
            const ownerName = ownerMap.get(kit.ownerId) || kit.ownerId;
            const details = kit.fullDetails();
            const advanceRupees = kit.dailyPrice * 0.2;

            const isPremium = kit.tier === Tier.PREMIUM;
            const isStandard = kit.tier === Tier.STANDARD;
            const cooldown = kitBookingAppInstance.getKitInspectionCooldown(kit.id);

            return (
              <motion.div
                key={kit.id}
                variants={cardVariants}
                layout
                whileHover={{
                  y: -6,
                  scale: 1.01,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group shadow-xl ${
                  isPremium
                    ? 'bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border-amber-500/30 hover:border-amber-400/80 hover:shadow-2xl hover:shadow-amber-500/10'
                    : isStandard
                    ? 'bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border-blue-500/30 hover:border-blue-400/80 hover:shadow-2xl hover:shadow-blue-500/10'
                    : 'bg-gradient-to-b from-slate-900/95 via-slate-900 to-slate-950 border-emerald-500/30 hover:border-emerald-400/80 hover:shadow-2xl hover:shadow-emerald-500/10'
                }`}
              >
                <div className="p-6">
                  {/* Top Badge & Owner info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={kit.tier} />
                      <span className="text-[11px] font-mono text-slate-400">{kit.totalQuantity} units owned</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      By <strong className="text-white">{ownerName}</strong>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {kit.tier} Kit Package
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete setup for commercial filming, podcasts, and video shoots.
                  </p>

                  {/* Equipment Breakdown with Specs */}
                  <div className="mt-5 space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1 flex items-center justify-between">
                      <span>Calibrated Trio (Abstract Factory)</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Complete Set</span>
                    </div>

                    {/* Camera */}
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover/item:scale-110">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{details.camera.brand} {details.camera.model}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{details.camera.specs}</div>
                      </div>
                    </div>

                    {/* Mic */}
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover/item:scale-110">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{details.mic.brand} {details.mic.model}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{details.mic.specs}</div>
                      </div>
                    </div>

                    {/* Tripod */}
                    <div className="flex items-start gap-3 group/item">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover/item:scale-110">
                        <Disc3 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{details.tripod.brand} {details.tripod.model}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{details.tripod.specs}</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Kit Turnaround / Inspection Cooldown Notice */}
                  {cooldown.isInCooldown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 text-amber-300 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Owner Quality Check Active ({cooldown.remainingMinutes}m cooldown)</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">Sensor & audio check</span>
                    </motion.div>
                  )}
                </div>

                {/* Price & Book CTA Footer */}
                <div className="p-6 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Opening Rate</div>
                    <MoneyDisplay paise={kit.dailyPrice} className="text-xl font-black text-white" />
                    <div className="text-[10px] text-amber-400 font-mono">
                      20% advance: {formatRupees(advanceRupees)}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectKit(kit)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Select & Book</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
