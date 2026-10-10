import React from 'react';
import { kitBookingAppInstance, AppSettings } from '../../facade/KitBookingApp';
import { useToast } from '../components/Toast';
import { Sliders, RotateCcw, ShieldCheck, DollarSign, RefreshCw, Check } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { showToast } = useToast();
  const settings = kitBookingAppInstance.getSettings();

  const handlePricingChange = (pricingStrategyId: 'FLAT' | 'TIER_MULTIPLIER') => {
    kitBookingAppInstance.setSettings({ pricingStrategyId });
    showToast('success', `Pricing strategy updated to: ${pricingStrategyId === 'FLAT' ? 'Flat Daily Pricing' : 'Tier Multiplier Pricing'}`);
  };

  const handleForfeitChange = (forfeitPolicyId: 'DEFAULT' | 'REFUND_ON_REJECTION') => {
    kitBookingAppInstance.setSettings({ forfeitPolicyId });
    showToast('success', `Forfeit policy updated to: ${forfeitPolicyId === 'DEFAULT' ? 'Default (Owner Keeps Advance)' : 'Refund On Owner Rejection'}`);
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset all demo data back to clean initial state (Alice, Bob, Carol, Dev, StudioX, LensLab)?')) {
      kitBookingAppInstance.resetDemo();
      showToast('info', 'Demo data reset to original seed state!', 'Reset Complete');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>System Settings & Strategy Selection</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure runtime Strategy patterns (Pricing & Forfeiture) and reset in-memory repositories.
        </p>
      </div>

      {/* Pricing Strategy Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Pricing Strategy (Opening Suggestion)</span>
        </div>
        <p className="text-xs text-slate-400">
          Governs suggested slot price presented to users during booking creation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handlePricingChange('FLAT')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              settings.pricingStrategyId === 'FLAT'
                ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">FlatDailyPricing (Default)</span>
              {settings.pricingStrategyId === 'FLAT' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              1 Slot = 1x Base Daily Price. (e.g. Premium = ₹1,000, Standard = ₹600, Budget = ₹400).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handlePricingChange('TIER_MULTIPLIER')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              settings.pricingStrategyId === 'TIER_MULTIPLIER'
                ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">TierMultiplierPricing</span>
              {settings.pricingStrategyId === 'TIER_MULTIPLIER' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Multipliers applied: Premium x1.2 (₹1,200), Standard x1.0 (₹600), Budget x0.85 (₹340).
            </p>
          </button>
        </div>
      </div>

      {/* Forfeit Policy Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Forfeit Policy (Advance Escrow Disbursal)</span>
        </div>
        <p className="text-xs text-slate-400">
          Controls how the held 20% advance is disbursed when an owner rejects or user cancels.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleForfeitChange('DEFAULT')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              settings.forfeitPolicyId === 'DEFAULT'
                ? 'bg-indigo-500/15 border-indigo-400 text-white ring-1 ring-indigo-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">DefaultForfeitPolicy</span>
              {settings.forfeitPolicyId === 'DEFAULT' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Advance is forfeited to the owner on rejection and on cancellation (KI-09 credited via ledger).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleForfeitChange('REFUND_ON_REJECTION')}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              settings.forfeitPolicyId === 'REFUND_ON_REJECTION'
                ? 'bg-indigo-500/15 border-indigo-400 text-white ring-1 ring-indigo-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">RefundOnOwnerRejectionPolicy</span>
              {settings.forfeitPolicyId === 'REFUND_ON_REJECTION' && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protects user: advance refunded to user if owner rejects; forfeited to owner if user cancels.
            </p>
          </button>
        </div>
      </div>

      {/* Demo Reset Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset Demo Data</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Restores initial seed data (Alice ₹5,000, Bob ₹5,000, Carol ₹300, Dev ₹5,000, StudioX, LensLab) and clears test bookings.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-200 text-xs font-bold transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );
};
