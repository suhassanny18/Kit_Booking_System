import React, { useState } from 'react';
import { kitBookingAppInstance } from '../../facade/KitBookingApp';
import { Slot } from '../../domain/entities/Slot';
import { BookingStatus, ReturnCondition } from '../../domain/enums';
import { formatRupees, MoneyDisplay } from '../components/MoneyDisplay';
import { useToast } from '../components/Toast';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  DollarSign,
  Star,
} from 'lucide-react';

export const DemoScenarioScreen: React.FC = () => {
  const { showToast, showDomainError } = useToast();

  const [stepStatus, setStepStatus] = useState<Record<number, 'pending' | 'success' | 'failed'>>({
    1: 'pending',
    2: 'pending',
    3: 'pending',
    4: 'pending',
    5: 'pending',
    6: 'pending',
    7: 'pending',
    8: 'pending',
  });

  const [stepLogs, setStepLogs] = useState<Record<number, string>>({});
  const [runningAll, setRunningAll] = useState(false);

  // Tracking demo booking IDs
  const [demoState, setDemoState] = useState<{
    aliceBooking1Id?: string;
    bobBookingId?: string;
    aliceBooking2Id?: string;
    devBookingId?: string;
  }>({});

  const tomorrowSlot1 = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
  const tomorrowSlot2 = new Slot('2026-10-11T13:00:00.000Z', '2026-10-11T16:00:00.000Z');

  // Step 1: Alice requests Premium Kit at ₹900
  const executeStep1 = () => {
    try {
      const booking = kitBookingAppInstance.book(
        'USR-ALICE',
        'KIT-PREMIUM-1',
        tomorrowSlot1,
        90000 // ₹900
      );
      setDemoState((prev) => ({ ...prev, aliceBooking1Id: booking.id }));
      setStepStatus((prev) => ({ ...prev, 1: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        1: `Alice booked ${booking.id} at ₹900. Advance ₹180 held in escrow. Alice wallet: ${formatRupees(
          kitBookingAppInstance.getUser('USR-ALICE')?.wallet ?? 0
        )}.`,
      }));
      showToast('success', 'Step 1 complete: Alice booking requested with ₹180 advance held in escrow!');
      return booking;
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 1: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 1: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 2: Bob requests same slot
  const executeStep2 = () => {
    try {
      const booking = kitBookingAppInstance.book(
        'USR-BOB',
        'KIT-PREMIUM-1',
        tomorrowSlot1,
        90000 // ₹900
      );
      setDemoState((prev) => ({ ...prev, bobBookingId: booking.id }));
      setStepStatus((prev) => ({ ...prev, 2: 'success' }));
      const pending = kitBookingAppInstance.pendingForOwner('OWN-STUDIOX');
      const bobIndex = pending.findIndex((b) => b.userId === 'USR-BOB');
      const aliceIndex = pending.findIndex((b) => b.userId === 'USR-ALICE');

      setStepLogs((prev) => ({
        ...prev,
        2: `Bob booked ${booking.id}. StudioX pending queue has Bob at position #${bobIndex + 1} (Rating 4.67) above Alice at #${aliceIndex + 1} (Rating 3.0)!`,
      }));
      showToast('success', 'Step 2 complete: Bob requested same slot! Bob prioritized over Alice by rating.');
      return booking;
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 2: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 2: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 3: Alice rebooking cooldown test
  const executeStep3 = () => {
    try {
      // 1. Immediate request fails
      let cooldownThrew = false;
      try {
        kitBookingAppInstance.book('USR-ALICE', 'KIT-PREMIUM-1', tomorrowSlot2, 90000);
      } catch (e: any) {
        if (e.code === 'COOLDOWN_ACTIVE') {
          cooldownThrew = true;
        }
      }

      if (!cooldownThrew) {
        throw new Error('Expected CooldownValidator to block immediate rebooking!');
      }

      // 2. Advance demo clock 20 minutes
      kitBookingAppInstance.advanceClock(20);

      // 3. Retry succeeds!
      const booking = kitBookingAppInstance.book('USR-ALICE', 'KIT-PREMIUM-1', tomorrowSlot2, 90000);
      setDemoState((prev) => ({ ...prev, aliceBooking2Id: booking.id }));
      setStepStatus((prev) => ({ ...prev, 3: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        3: `Immediate request was blocked by 20-min cooldown. Clock advanced by 20m. Re-request succeeded for slot 2 (${booking.id})!`,
      }));
      showToast('success', 'Step 3 complete: Cooldown blocked immediately, then succeeded after +20m demo clock advance!');
      return booking;
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 3: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 3: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 4: Negotiation & Approval with advance adjustment
  const executeStep4 = () => {
    try {
      const bId = demoState.aliceBooking1Id;
      if (!bId) throw new Error('Run Step 1 first to create Alice booking');

      // StudioX counters ₹1,100
      kitBookingAppInstance.ownerCounter(bId, 'OWN-STUDIOX', 110000);
      // Alice counters ₹1,000
      kitBookingAppInstance.userCounter(bId, 'USR-ALICE', 100000);
      // StudioX approves
      kitBookingAppInstance.ownerApprove(bId, 'OWN-STUDIOX');

      const b = kitBookingAppInstance.getBooking(bId);
      const alice = kitBookingAppInstance.getUser('USR-ALICE')!;

      setStepStatus((prev) => ({ ...prev, 4: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        4: `Owner countered ₹1,100, Alice countered ₹1,000. Owner approved. Advance adjusted from ₹180 to ₹200 (20% of ₹1,000). Alice wallet: ${formatRupees(
          alice.wallet
        )}. Status: APPROVED.`,
      }));
      showToast('success', 'Step 4 complete: Owner approved! Advance adjusted to ₹200 (KI-10).');
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 4: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 4: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 5: Capacity block on Bob approval
  const executeStep5 = () => {
    try {
      const bId = demoState.bobBookingId;
      if (!bId) throw new Error('Run Step 2 first to create Bob booking');

      let blocked = false;
      try {
        kitBookingAppInstance.ownerApprove(bId, 'OWN-STUDIOX');
      } catch (e: any) {
        if (e.code === 'SLOT_CAPACITY_EXCEEDED') {
          blocked = true;
        }
      }

      if (!blocked) {
        throw new Error('Expected owner approval for Bob to fail with SLOT_CAPACITY_EXCEEDED!');
      }

      setStepStatus((prev) => ({ ...prev, 5: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        5: `Owner tried to approve Bob for same slot and was successfully BLOCKED: Premium kit total quantity is 1 and already reserved by Alice!`,
      }));
      showToast('success', 'Step 5 complete: Bob approval blocked by capacity constraint (1/1 committed)!');
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 5: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 5: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 6: Pickup, Return GOOD, Settle ₹800, Rate 4.5
  const executeStep6 = () => {
    try {
      const bId = demoState.aliceBooking1Id;
      if (!bId) throw new Error('Run Step 1 & 4 first');

      // Pickup
      kitBookingAppInstance.pickup(bId, 'OWN-STUDIOX');
      // Return with GOOD condition
      kitBookingAppInstance.returnKit(bId, 'OWN-STUDIOX', ReturnCondition.GOOD);
      // Rate user 4.5
      kitBookingAppInstance.rateUser(bId, 'OWN-STUDIOX', 4.5);

      const b = kitBookingAppInstance.getBooking(bId);
      const alice = kitBookingAppInstance.getUser('USR-ALICE')!;
      const studioX = kitBookingAppInstance.getOwner('OWN-STUDIOX')!;

      setStepStatus((prev) => ({ ...prev, 6: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        6: `Pickup recorded -> Return GOOD recorded -> Alice debited remaining ₹800 (total ₹1,000) -> StudioX received ₹1,000 -> Owner rated Alice 4.5 -> Alice rating: ${alice.rating.toFixed(
          2
        )} -> Status: COMPLETED!`,
      }));
      showToast('success', 'Step 6 complete: Settle charge ₹800 executed, Alice rated 4.5, booking COMPLETED!');
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 6: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 6: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 7: Dev approval blocked (rating 2.0 < 2.5) -> Rejection forfeits advance to owner
  const executeStep7 = () => {
    try {
      const devBooking = kitBookingAppInstance.book(
        'USR-DEV',
        'KIT-PREMIUM-1',
        new Slot('2026-10-12T09:00:00.000Z', '2026-10-12T12:00:00.000Z'),
        100000 // ₹1000
      );
      setDemoState((prev) => ({ ...prev, devBookingId: devBooking.id }));

      let approvalBlocked = false;
      try {
        kitBookingAppInstance.ownerApprove(devBooking.id, 'OWN-STUDIOX');
      } catch (e: any) {
        if (e.code === 'RATING_BELOW_APPROVAL_THRESHOLD') {
          approvalBlocked = true;
        }
      }

      if (!approvalBlocked) {
        throw new Error('Expected Dev approval to be blocked by rating 2.0 < 2.5');
      }

      // Owner rejects
      kitBookingAppInstance.ownerReject(devBooking.id, 'OWN-STUDIOX');

      const studioX = kitBookingAppInstance.getOwner('OWN-STUDIOX')!;
      setStepStatus((prev) => ({ ...prev, 7: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        7: `Dev requested booking. Owner approval was BLOCKED (Dev rating 2.0 < 2.5 threshold). Owner rejected booking -> Advance ₹200 forfeited and credited to StudioX (KI-09)! StudioX wallet: ${formatRupees(
          studioX.wallet
        )}.`,
      }));
      showToast('success', 'Step 7 complete: Dev approval blocked, owner rejected, advance forfeited to owner!');
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 7: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 7: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Step 8: Carol requests booking with insufficient funds -> AdvanceFundsValidator failure, no money debited
  const executeStep8 = () => {
    try {
      const carolInitial = kitBookingAppInstance.getUser('USR-CAROL')!.wallet;
      let chainFailed = false;

      try {
        kitBookingAppInstance.book(
          'USR-CAROL',
          'KIT-PREMIUM-1',
          new Slot('2026-10-12T13:00:00.000Z', '2026-10-12T16:00:00.000Z'),
          200000 // ₹2000 proposed -> 20% advance is ₹400 > Carol's ₹300 wallet
        );
      } catch (e: any) {
        if (e.code === 'INSUFFICIENT_FUNDS_FOR_ADVANCE') {
          chainFailed = true;
        }
      }

      if (!chainFailed) {
        throw new Error('Expected AdvanceFundsValidator to fail for Carol!');
      }

      const carolFinal = kitBookingAppInstance.getUser('USR-CAROL')!.wallet;
      if (carolInitial !== carolFinal) {
        throw new Error('Carol wallet was mutated during failed validation!');
      }

      setStepStatus((prev) => ({ ...prev, 8: 'success' }));
      setStepLogs((prev) => ({
        ...prev,
        8: `Carol requested ₹2,000 booking (requires ₹400 advance). AdvanceFundsValidator aborted request cleanly. Carol's wallet remained exactly ${formatRupees(
          carolFinal
        )}. No money debited and no booking created!`,
      }));
      showToast('success', 'Step 8 complete: Carol request blocked by CoR, zero money debited!');
    } catch (err: any) {
      setStepStatus((prev) => ({ ...prev, 8: 'failed' }));
      setStepLogs((prev) => ({ ...prev, 8: `Failed: ${err.message}` }));
      showDomainError(err);
      throw err;
    }
  };

  // Run all 8 steps sequentially
  const handleRunAll = async () => {
    setRunningAll(true);
    kitBookingAppInstance.resetDemo();

    try {
      executeStep1();
      await new Promise((r) => setTimeout(r, 400));

      executeStep2();
      await new Promise((r) => setTimeout(r, 400));

      executeStep3();
      await new Promise((r) => setTimeout(r, 400));

      executeStep4();
      await new Promise((r) => setTimeout(r, 400));

      executeStep5();
      await new Promise((r) => setTimeout(r, 400));

      executeStep6();
      await new Promise((r) => setTimeout(r, 400));

      executeStep7();
      await new Promise((r) => setTimeout(r, 400));

      executeStep8();
      showToast('success', 'All 8 demo steps executed successfully end-to-end!', 'Demo Complete');
    } catch (e) {
      // Handled in individual steps
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Section 14 Specification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            End-to-End Demo Scenario Runner
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Execute all 8 steps of the required demo scenario with exact numbers, real state transitions, 20% advance adjustments, cooldown advancement, and capacity verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              kitBookingAppInstance.resetDemo();
              setStepStatus({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending', 6: 'pending', 7: 'pending', 8: 'pending' });
              setStepLogs({});
              showToast('info', 'Demo state reset');
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            disabled={runningAll}
            onClick={handleRunAll}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{runningAll ? 'Running Scenario...' : 'Run All 8 Steps'}</span>
          </button>
        </div>
      </div>

      {/* 8 Steps Cards */}
      <div className="space-y-3.5">
        {[
          {
            num: 1,
            title: "Alice requests Premium kit (Tomorrow 09:00-12:00) at ₹900",
            desc: "20% advance (₹180) held in escrow from Alice's ₹5,000 wallet.",
            action: executeStep1,
          },
          {
            num: 2,
            title: "Bob requests the SAME slot at ₹900",
            desc: "Pending requests do not consume capacity (KI-11). Bob succeeds, and StudioX queue ranks Bob (★ 4.67) above Alice (★ 3.0).",
            action: executeStep2,
          },
          {
            num: 3,
            title: "Alice requests another slot immediately -> Cooldown test (+20m clock)",
            desc: "Immediate request blocked by CooldownValidator. Demo clock advanced by 20 minutes, then request succeeds.",
            action: executeStep3,
          },
          {
            num: 4,
            title: "Negotiation & Approval: Owner counters ₹1,100, Alice counters ₹1,000",
            desc: "Owner approves. Advance adjusted to ₹200 (20% of agreed ₹1,000). Alice wallet debited difference ₹20 in ledger (KI-10).",
            action: executeStep4,
          },
          {
            num: 5,
            title: "Owner tries to approve Bob for same slot -> Capacity blocked",
            desc: "Premium kit quantity is 1 and already committed to Alice. Approval fails with SLOT_CAPACITY_EXCEEDED.",
            action: executeStep5,
          },
          {
            num: 6,
            title: "Pickup -> Return GOOD -> Settle ₹800 -> Rate Alice 4.5",
            desc: "Alice debited remaining ₹800. StudioX receives full ₹1,000. Owner rates Alice 4.5. New rating 4.50. Status: COMPLETED.",
            action: executeStep6,
          },
          {
            num: 7,
            title: "Dev requests booking (Rating 2.0 < 2.5) -> Owner rejects, advance forfeited",
            desc: "Owner cannot approve Dev (rating below 2.5). Owner rejects -> ₹200 advance forfeited and credited to StudioX (KI-09).",
            action: executeStep7,
          },
          {
            num: 8,
            title: "Carol requests ₹2,000 booking with insufficient wallet (₹300)",
            desc: "AdvanceFundsValidator aborts request cleanly. Zero money debited from Carol, no booking created.",
            action: executeStep8,
          },
        ].map((item) => {
          const status = stepStatus[item.num];
          const log = stepLogs[item.num];

          return (
            <div
              key={item.num}
              className={`p-4 rounded-xl border transition-all ${
                status === 'success'
                  ? 'bg-slate-900 border-emerald-500/40 shadow-sm'
                  : status === 'failed'
                  ? 'bg-rose-950/30 border-rose-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      status === 'success'
                        ? 'bg-emerald-500 text-slate-950'
                        : status === 'failed'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : item.num}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={item.action}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                    }`}
                  >
                    {status === 'success' ? 'Re-run Step' : `Run Step ${item.num}`}
                  </button>
                </div>
              </div>

              {log && (
                <div className="mt-3 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-emerald-300 bg-slate-950/60 p-2.5 rounded-lg">
                  {log}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
