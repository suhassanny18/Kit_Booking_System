import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Tier } from '../../domain/enums';
import { TierBadge } from '../components/StatusBadge';
import { MoneyDisplay } from '../components/MoneyDisplay';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Disc3, Plus, Package, Layers } from 'lucide-react';

interface OwnerKitsScreenProps {
  currentOwnerId: string;
}

export const OwnerKitsScreen: React.FC<OwnerKitsScreenProps> = ({ currentOwnerId }) => {
  const { showToast, showDomainError } = useToast();
  const owner = kitBookingAppInstance.getOwner(currentOwnerId);
  const kits = kitBookingAppInstance.browseKits().filter((k) => k.ownerId === currentOwnerId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>(Tier.STANDARD);
  const [quantity, setQuantity] = useState<string>('1');
  const [dailyPriceRupees, setDailyPriceRupees] = useState<string>('600');
  const [submitting, setSubmitting] = useState(false);

  const handleAddKit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    const rupees = parseFloat(dailyPriceRupees);

    if (isNaN(qty) || qty <= 0) {
      showToast('error', 'Quantity must be a positive integer');
      return;
    }
    if (isNaN(rupees) || rupees <= 0) {
      showToast('error', 'Daily price must be a positive amount');
      return;
    }

    setSubmitting(true);
    try {
      const kit = kitBookingAppInstance.addKit(
        currentOwnerId,
        selectedTier,
        qty,
        Math.round(rupees * 100)
      );
      showToast('success', `Created ${kit.tier} kit (${kit.id}) with ${qty} unit(s)!`, 'Kit Added');
      setShowAddForm(false);
      setQuantity('1');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>My Kit Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {kits.length} kit(s)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Owned by <strong className="text-white">{owner?.name}</strong>. Components are constructed via Abstract Factory per tier.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add New Kit'}</span>
        </motion.button>
      </motion.div>

      {/* Add Kit Form Drawer/Card */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleAddKit}
            className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Assemble New Production Kit (KitBuilder + Abstract Factory)</span>
              </h3>
              <span className="text-xs font-mono text-indigo-300">Strict Domain Validation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Kit Tier</label>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value as Tier)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                >
                  <option value={Tier.PREMIUM}>PREMIUM (Sony A7S III + Rode GO II + Manfrotto)</option>
                  <option value={Tier.STANDARD}>STANDARD (Canon R10 + Boya M1 + Digitek)</option>
                  <option value={Tier.BUDGET}>BUDGET (Nikon D3500 + Maono + Simpex)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Total Quantity Owned</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                  placeholder="e.g. 1, 2, 5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Daily Price per Slot (₹)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={dailyPriceRupees}
                  onChange={(e) => setDailyPriceRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
                  placeholder="e.g. 600, 1000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {submitting ? 'Assembling Kit...' : 'Assemble & Save Kit'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Kits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kits.map((kit, idx) => {
          const details = kit.fullDetails();

          return (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TierBadge tier={kit.tier} />
                      <span className="font-mono text-xs text-slate-400">{kit.id}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{kit.tier} Kit</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Base Price / Slot</span>
                    <MoneyDisplay paise={kit.dailyPrice} className="text-emerald-400 font-bold text-base" />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] mb-1">
                    <span>Units Owned: <strong className="text-white">{kit.totalQuantity}</strong></span>
                    <span>No global counter</span>
                  </div>

                  {/* Components */}
                  <div className="text-slate-300">
                    <div className="font-semibold text-indigo-300">Camera: {details.camera.brand} {details.camera.model}</div>
                    <div className="text-[10px] text-slate-400">{details.camera.specs}</div>
                  </div>

                  <div className="text-slate-300">
                    <div className="font-semibold text-amber-300">Mic: {details.mic.brand} {details.mic.model}</div>
                    <div className="text-[10px] text-slate-400">{details.mic.specs}</div>
                  </div>

                  <div className="text-slate-300">
                    <div className="font-semibold text-emerald-300">Tripod: {details.tripod.brand} {details.tripod.model}</div>
                    <div className="text-[10px] text-slate-400">{details.tripod.specs}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                Slot availability dynamically computed from approved and active rentals.
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
