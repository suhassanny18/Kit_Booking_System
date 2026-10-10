import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { User } from '../../domain/entities/User';
import { Owner } from '../../domain/entities/Owner';
import { formatRupees } from './MoneyDisplay';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Film,
  Building2,
  Star,
  Wallet,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (actorId: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const { showToast, showDomainError } = useToast();
  const [role, setRole] = useState<'renter' | 'owner'>('renter');

  const users = kitBookingAppInstance.getUsers();
  const owners = kitBookingAppInstance.getOwners();

  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [newName, setNewName] = useState('');
  const [initialBalance, setInitialBalance] = useState('5000');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('error', 'Please enter a name');
      return;
    }
    const balanceRupees = parseFloat(initialBalance) || 0;
    const balancePaise = Math.round(balanceRupees * 100);

    try {
      if (role === 'renter') {
        const newUser = kitBookingAppInstance.registerUser(newName, balancePaise);
        showToast('success', `Welcome ${newUser.name}! Account created with ${formatRupees(balancePaise)}.`);
        onLogin(newUser.id);
      } else {
        const newOwner = kitBookingAppInstance.registerOwner(newName, balancePaise);
        showToast('success', `Welcome ${newOwner.name}! Studio registered.`);
        onLogin(newOwner.id);
      }
    } catch (err) {
      showDomainError(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 shadow-xl shadow-amber-500/10 mb-4 ring-1 ring-white/20"
          >
            <Camera className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            CineVault
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Professional Cinema Equipment Rental Marketplace with 20% Advance Escrow Protection
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 mb-6 relative">
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setRole('renter');
                setIsRegistering(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                role === 'renter'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Renter / Creator</span>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setRole('owner');
                setIsRegistering(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                role === 'owner'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Studio Owner</span>
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {!isRegistering ? (
              <motion.div
                key={`login-${role}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono uppercase tracking-wider">
                    {role === 'renter' ? 'Select Verified Creator' : 'Select Equipment Provider'}
                  </span>
                  <span>1-Click Sign In</span>
                </div>

                <div className="space-y-2.5">
                  {role === 'renter'
                    ? users.map((u, idx) => {
                        return (
                          <motion.button
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.015, x: 4 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => onLogin(u.id)}
                            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 transition-all text-left group shadow-sm hover:shadow-amber-500/5 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                                {u.name.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                                  <span>{u.name}</span>
                                  {u.name === 'Bob' && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                      High Rating
                                    </span>
                                  )}
                                  {u.name === 'Carol' && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                                      Low Wallet
                                    </span>
                                  )}
                                  {u.name === 'Dev' && (
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                                      Low Rating (2.0)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                                  <span className="flex items-center gap-1 text-amber-400">
                                    <Star className="w-3 h-3 fill-current" />
                                    {u.rating.toFixed(2)}
                                  </span>
                                  <span>•</span>
                                  <span className="text-emerald-400">{formatRupees(u.wallet)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-400 transition-all">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </motion.button>
                        );
                      })
                    : owners.map((o, idx) => (
                        <motion.button
                          key={o.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.015, x: 4 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => onLogin(o.id)}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 transition-all text-left group shadow-sm hover:shadow-indigo-500/5 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                              {o.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                                {o.name}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                                <span>Kit Fleet Provider</span>
                                <span>•</span>
                                <span className="text-emerald-400">Payouts: {formatRupees(o.wallet)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </motion.button>
                      ))}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsRegistering(true)}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Create new {role === 'renter' ? 'Creator' : 'Studio'} profile</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {role === 'renter' ? 'Full Name / Brand' : 'Studio / Business Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={role === 'renter' ? 'e.g. Maya Lin' : 'e.g. Apex Cinema Rentals'}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Initial Wallet Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Held as integer paise in the financial ledger.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsRegistering(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Back
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Register & Enter Dashboard
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Security / System Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>20% Advance Escrow Protection</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Strict Domain LLD Verification</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};
