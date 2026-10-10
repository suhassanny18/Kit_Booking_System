import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { MoneyDisplay, formatRupees } from './MoneyDisplay';
import { BookingStatus } from '../../domain/enums';
import {
  Camera,
  Film,
  Building2,
  Wallet,
  Bell,
  Clock,
  FastForward,
  ChevronDown,
  LogOut,
  Star,
  Plus,
  Compass,
  Package,
  Layers,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopBarProps {
  currentActorId: string;
  onLogout: () => void;
  onSwitchActor: (actorId: string) => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentActorId,
  onLogout,
  onSwitchActor,
  activeTab,
  onSelectTab,
  onOpenNotifications,
  unreadCount,
}) => {
  const users = kitBookingAppInstance.getUsers();
  const owners = kitBookingAppInstance.getOwners();
  const clockTime = kitBookingAppInstance.getClockTime();

  const currentUser = kitBookingAppInstance.getUser(currentActorId);
  const currentOwner = kitBookingAppInstance.getOwner(currentActorId);
  const isOwner = !!currentOwner;

  const currentWalletPaise = isOwner ? currentOwner.wallet : currentUser?.wallet ?? 0;
  const actorName = isOwner ? currentOwner.name : currentUser?.name ?? 'User';
  const actorRating = currentUser?.rating;

  const [showUserMenu, setShowUserMenu] = useState(false);

  // Quick stats
  const pendingRequestsCount = isOwner ? kitBookingAppInstance.pendingForOwner(currentActorId).length : 0;
  const userBookingsCount = !isOwner ? kitBookingAppInstance.bookingsForUser(currentActorId).length : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Portal Badge */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/10 ring-1 ring-white/20">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white block leading-none">
                  CineVault
                </span>
                <span
                  className={`text-[10px] font-mono font-bold tracking-wider uppercase inline-flex items-center gap-1 mt-0.5 ${
                    isOwner ? 'text-indigo-400' : 'text-amber-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {isOwner ? 'Studio Owner' : 'Creator Portal'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs with Framer Motion interactive feedback */}
            <nav className="hidden md:flex items-center gap-1">
              {!isOwner ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('browse')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'browse'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore Kits</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('my-bookings')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 relative cursor-pointer ${
                      activeTab === 'my-bookings'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>My Rentals</span>
                    {userBookingsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-200">
                        {userBookingsCount}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('wallet')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'wallet'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Wallet & Escrow</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('owner-pending')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 relative cursor-pointer ${
                      activeTab === 'owner-pending'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Rental Requests</span>
                    {pendingRequestsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold animate-pulse">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('owner-handoff')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'owner-handoff'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Handoff & Inspection Bay</span>
                    {kitBookingAppInstance
                      .bookingsForOwner(currentActorId)
                      .filter((b) => b.status === BookingStatus.RETURNED).length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black animate-pulse">
                        {
                          kitBookingAppInstance
                            .bookingsForOwner(currentActorId)
                            .filter((b) => b.status === BookingStatus.RETURNED).length
                        }
                      </span>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab('owner-kits')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'owner-kits'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Kit Fleet</span>
                  </motion.button>
                </>
              )}
            </nav>
          </div>

          {/* Right: Clock Widget, Wallet Pill, Notifications, User Menu */}
          <div className="flex items-center gap-2.5">
            {/* Clock Pill with quick +20m cooldown test button */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl px-2.5 py-1 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-200 font-bold">
                {clockTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => kitBookingAppInstance.advanceClock(20)}
                className="ml-1 text-[10px] px-1.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-colors cursor-pointer"
                title="Fast-forward 20 minutes to clear rebooking cooldown"
              >
                +20m
              </motion.button>
            </div>

            {/* Wallet pill */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab(isOwner ? 'owner-handoff' : 'wallet')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 transition-all text-xs shadow-sm cursor-pointer"
              title="View wallet & ledger"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono font-bold text-emerald-300">
                {formatRupees(currentWalletPaise)}
              </span>
            </motion.button>

            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onOpenNotifications}
              className="relative p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {/* User Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-left cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isOwner
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950'
                  }`}
                >
                  {actorName.slice(0, 1)}
                </div>
                <div className="hidden lg:block text-xs leading-none">
                  <span className="font-bold text-white block truncate max-w-[100px]">{actorName}</span>
                  {actorRating !== undefined && actorRating !== null && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {actorRating.toFixed(2)}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 6 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs"
                  >
                    <div className="p-2.5 border-b border-slate-800/80 mb-1">
                      <div className="font-bold text-white text-sm">{actorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {isOwner ? 'Studio Equipment Owner' : `Renter (Rating ★ ${actorRating?.toFixed(2)})`}
                      </div>
                    </div>

                    <div className="py-1">
                      <div className="px-2 py-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                        Switch Seed Profile
                      </div>
                      <div className="space-y-0.5">
                        {users.map((u) => (
                          <motion.button
                            key={u.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSwitchActor(u.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                              currentActorId === u.id
                                ? 'bg-amber-500/20 text-amber-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{u.name} (Creator)</span>
                            <span className="text-[10px] font-mono text-slate-400">★ {u.rating.toFixed(1)}</span>
                          </motion.button>
                        ))}
                        {owners.map((o) => (
                          <motion.button
                            key={o.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSwitchActor(o.id);
                              setShowUserMenu(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                              currentActorId === o.id
                                ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{o.name} (Owner)</span>
                            <span className="text-[10px] font-mono text-slate-400">Studio</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800/80 mt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out / Switch Role</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
