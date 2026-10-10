import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { MoneyDisplay, formatRupees } from '../components/MoneyDisplay';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import { Wallet, PlusCircle, ArrowDownLeft, ArrowUpRight, Receipt, ShieldCheck } from 'lucide-react';

interface WalletScreenProps {
  currentUserId: string;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ currentUserId }) => {
  const { showToast, showDomainError } = useToast();
  const user = kitBookingAppInstance.getUser(currentUserId);
  const ledgerEntries = kitBookingAppInstance.allLedger();

  const [topUpAmountRupees, setTopUpAmountRupees] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Filter ledger entries involving this user
  const userLedger = ledgerEntries.filter((e) => e.account === 'USER');

  const handleTopUp = (amountRupees: number) => {
    if (amountRupees <= 0) {
      showToast('error', 'Please enter a positive amount');
      return;
    }
    setSubmitting(true);
    try {
      kitBookingAppInstance.topUpWallet(currentUserId, Math.round(amountRupees * 100));
      showToast('success', `Added ₹${amountRupees} to your wallet!`, 'Wallet Topped Up');
      setTopUpAmountRupees('');
    } catch (err) {
      showDomainError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentWalletPaise = user?.wallet ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Wallet Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Available Wallet Balance</span>
            </div>
            <MoneyDisplay paise={currentWalletPaise} className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight" />
            <p className="text-xs text-slate-400 mt-2">
              Holder: <strong className="text-white">{user?.name}</strong> • Stored as integer paise (zero float rounding errors)
            </p>
          </div>

          {/* Quick Top up buttons */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 min-w-[280px]">
            <span className="text-xs font-semibold text-slate-200 block">Top Up Wallet</span>
            <div className="flex items-center gap-2">
              {[500, 1000, 5000].map((amt) => (
                <motion.button
                  key={amt}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTopUp(amt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors border border-slate-700/60 cursor-pointer"
                >
                  +₹{amt}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={topUpAmountRupees}
                  onChange={(e) => setTopUpAmountRupees(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full pl-6 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={submitting || !topUpAmountRupees}
                onClick={() => handleTopUp(parseFloat(topUpAmountRupees))}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Add
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ledger Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Transaction Ledger ({userLedger.length} events)</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">All money movements</span>
        </div>

        {userLedger.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono italic bg-slate-950/40 rounded-xl border border-slate-800">
            No transactions in ledger yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
            {userLedger.map((entry) => {
              const isCredit = entry.amount > 0;
              return (
                <div key={entry.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-200">{entry.reason}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>Ref: {entry.bookingId}</span>
                        <span>•</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <MoneyDisplay paise={entry.amount} showSign className="font-bold text-sm" />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
