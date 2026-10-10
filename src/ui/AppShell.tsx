import React, { useState, useEffect, useReducer } from 'react';
import { kitBookingAppInstance } from '../facade/KitBookingApp';
import { Kit } from '../domain/entities/Kit';
import { TopBar } from './components/TopBar';
import { ToastProvider } from './components/Toast';
import { AuthScreen } from './components/AuthScreen';
import { DevControlCenter } from './components/DevControlCenter';
import { BrowseKitsScreen } from './screens/BrowseKitsScreen';
import { RequestBookingModal } from './screens/RequestBookingModal';
import { MyBookingsScreen } from './screens/MyBookingsScreen';
import { WalletScreen } from './screens/WalletScreen';
import { OwnerPendingScreen } from './screens/OwnerPendingScreen';
import { OwnerHandoffScreen } from './screens/OwnerHandoffScreen';
import { OwnerKitsScreen } from './screens/OwnerKitsScreen';
import { InboxScreen } from './screens/InboxScreen';
import { motion, AnimatePresence } from 'framer-motion';

export const AppShell: React.FC = () => {
  // Reactive synchronization with facade state mutations
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const unsubscribe = kitBookingAppInstance.subscribe(() => {
      forceUpdate();
    });
    return unsubscribe;
  }, []);

  // Authentication State
  const [currentActorId, setCurrentActorId] = useState<string>('USR-ALICE');
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('browse');

  // Booking modal
  const [selectedKitForBooking, setSelectedKitForBooking] = useState<Kit | null>(null);

  const handleLogin = (actorId: string) => {
    setCurrentActorId(actorId);
    setIsLoggedOut(false);
    const isOwner = !!kitBookingAppInstance.getOwner(actorId);
    setActiveTab(isOwner ? 'owner-pending' : 'browse');
  };

  const handleSwitchActor = (actorId: string) => {
    setCurrentActorId(actorId);
    const isOwner = !!kitBookingAppInstance.getOwner(actorId);
    if (isOwner && (activeTab === 'browse' || activeTab === 'my-bookings' || activeTab === 'wallet')) {
      setActiveTab('owner-pending');
    } else if (!isOwner && (activeTab === 'owner-pending' || activeTab === 'owner-handoff' || activeTab === 'owner-kits')) {
      setActiveTab('browse');
    }
  };

  const isOwner = !!kitBookingAppInstance.getOwner(currentActorId);
  const inboxMessages = kitBookingAppInstance.inbox(currentActorId);
  const unreadCount = inboxMessages.filter((m) => !m.read).length;

  if (isLoggedOut) {
    return (
      <ToastProvider>
        <AuthScreen onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative">
        {/* Navigation Top Bar */}
        <TopBar
          currentActorId={currentActorId}
          onLogout={() => setIsLoggedOut(true)}
          onSwitchActor={handleSwitchActor}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenNotifications={() => setActiveTab('inbox')}
          unreadCount={unreadCount}
        />

        {/* Main Content Workspace with smooth Framer Motion page transitions */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${currentActorId}`}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Renter Tabs */}
              {activeTab === 'browse' && (
                <BrowseKitsScreen
                  currentUserId={currentActorId}
                  onSelectKit={(kit) => setSelectedKitForBooking(kit)}
                />
              )}

              {activeTab === 'my-bookings' && <MyBookingsScreen currentUserId={currentActorId} />}

              {activeTab === 'wallet' && <WalletScreen currentUserId={currentActorId} />}

              {/* Owner Tabs */}
              {activeTab === 'owner-pending' && <OwnerPendingScreen currentOwnerId={currentActorId} />}

              {activeTab === 'owner-handoff' && <OwnerHandoffScreen currentOwnerId={currentActorId} />}

              {activeTab === 'owner-kits' && <OwnerKitsScreen currentOwnerId={currentActorId} />}

              {/* Notifications Inbox */}
              {activeTab === 'inbox' && <InboxScreen currentActorId={currentActorId} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Booking Request Modal */}
        <AnimatePresence>
          {selectedKitForBooking && (
            <RequestBookingModal
              kit={selectedKitForBooking}
              currentUserId={currentActorId}
              onClose={() => setSelectedKitForBooking(null)}
              onSuccess={() => {
                setSelectedKitForBooking(null);
                setActiveTab('my-bookings');
              }}
            />
          )}
        </AnimatePresence>

        {/* Discrete Floating Dev, Clock & Verification Dock */}
        <DevControlCenter />
      </div>
    </ToastProvider>
  );
};
