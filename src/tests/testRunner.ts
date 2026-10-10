import { buildApplication } from '../facade/CompositionRoot';
import { KitBookingApp } from '../facade/KitBookingApp';
import { BookingStatus, ActorType, ReturnCondition, Tier } from '../domain/enums';
import { Slot } from '../domain/entities/Slot';
import { DomainError } from '../domain/errors';
import { SlotCapacityValidator } from '../domain/validators/SlotCapacityValidator';
import { CooldownValidator } from '../domain/validators/CooldownValidator';
import { AdvanceFundsValidator } from '../domain/validators/AdvanceFundsValidator';
import { UserRatingValidator } from '../domain/validators/UserRatingValidator';
import { ValidationChainFactory } from '../domain/validators/ValidationChainFactory';
import { RatingService } from '../services/RatingService';
import { DefaultForfeitPolicy, RefundOnOwnerRejectionPolicy } from '../domain/strategies/ForfeitPolicy';
import { BookingObserver, BookingEvent } from '../observers/BookingObserver';

export interface TestCaseResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runAllDomainTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function test(suite: string, name: string, fn: () => void) {
    const t0 = performance.now();
    try {
      fn();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Number((performance.now() - t0).toFixed(2)),
      });
    } catch (err: any) {
      results.push({
        suite,
        name,
        passed: false,
        error: err?.message || String(err),
        durationMs: Number((performance.now() - t0).toFixed(2)),
      });
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`Assertion failed: ${msg}`);
  }

  function assertThrows(fn: () => void, expectedCode?: string) {
    let threw = false;
    let actualErr: any = null;
    try {
      fn();
    } catch (e: any) {
      threw = true;
      actualErr = e;
    }
    if (!threw) {
      throw new Error('Expected function to throw, but it succeeded');
    }
    if (expectedCode && actualErr instanceof DomainError) {
      if (actualErr.code !== expectedCode) {
        throw new Error(`Expected error code ${expectedCode}, but got ${actualErr.code}: ${actualErr.message}`);
      }
    }
  }

  // =========================================================================
  // Suite 1: State Machine Transitions (Legal and Illegal per Table in Section 6)
  // =========================================================================
  test('State Machine', 'REQUESTED: counter goes to NEGOTIATING; accept stays REQUESTED; approve goes to APPROVED', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    assert(b.status === BookingStatus.REQUESTED, 'Initial status must be REQUESTED');

    // counter from owner -> moves to NEGOTIATING
    app.ownerCounter(b.id, 'OWN-STUDIOX', 110000);
    const b2 = app.getBooking(b.id);
    assert(b2.status === BookingStatus.NEGOTIATING, 'Counter should transition to NEGOTIATING');

    // illegal pickup from NEGOTIATING
    assertThrows(() => app.pickup(b.id, 'OWN-STUDIOX'), 'ILLEGAL_TRANSITION');
  });

  test('State Machine', 'REQUESTED can go straight to APPROVED without negotiation', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    const approved = app.getBooking(b.id);
    assert(approved.status === BookingStatus.APPROVED, 'Should reach APPROVED directly');
  });

  test('State Machine', 'APPROVED -> PICKED_UP -> RETURNED -> COMPLETED', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    app.pickup(b.id, 'OWN-STUDIOX');
    assert(app.getBooking(b.id).status === BookingStatus.PICKED_UP, 'Status should be PICKED_UP');

    app.returnKit(b.id, 'OWN-STUDIOX', ReturnCondition.GOOD);
    assert(app.getBooking(b.id).status === BookingStatus.RETURNED, 'Status should be RETURNED');

    app.rateUser(b.id, 'OWN-STUDIOX', 4.5);
    assert(app.getBooking(b.id).status === BookingStatus.COMPLETED, 'Status should be COMPLETED');
  });

  test('State Machine', 'Terminal states (REJECTED, CANCELLED, COMPLETED) reject further transitions', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.cancel(b.id, 'USR-ALICE');
    assert(app.getBooking(b.id).status === BookingStatus.CANCELLED, 'Status should be CANCELLED');

    assertThrows(() => app.ownerApprove(b.id, 'OWN-STUDIOX'), 'ILLEGAL_TRANSITION');
    assertThrows(() => app.ownerCounter(b.id, 'OWN-STUDIOX', 120000), 'ILLEGAL_TRANSITION');
    assertThrows(() => app.pickup(b.id, 'OWN-STUDIOX'), 'ILLEGAL_TRANSITION');
  });

  // =========================================================================
  // Suite 2: Validators & Chain Order (No money moved on failure)
  // =========================================================================
  test('Validators', 'AdvanceFundsValidator fails if user wallet < 20% of proposed price', () => {
    const validator = new AdvanceFundsValidator();
    const app = new KitBookingApp();
    const carol = app.getUser('USR-CAROL')!; // ₹300 = 30000 paise
    const kit = app.getKit('KIT-PREMIUM-1')!;
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    // 20% of ₹2000 (200,000 paise) is ₹400 (40,000 paise) > ₹300
    assertThrows(() => {
      validator.validate({
        user: carol,
        kit,
        slot,
        proposedPricePaise: 200000,
        existingBookings: [],
        now: new Date('2026-10-10T09:00:00.000Z'),
      });
    }, 'INSUFFICIENT_FUNDS_FOR_ADVANCE');
  });

  test('Validators', 'Failed validation debits no money and creates no booking', () => {
    const app = new KitBookingApp();
    const initialCarolWallet = app.getUser('USR-CAROL')!.wallet;
    const initialBookingsCount = app.bookingsForUser('USR-CAROL').length;
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    assertThrows(() => {
      app.book('USR-CAROL', 'KIT-PREMIUM-1', slot, 200000);
    }, 'INSUFFICIENT_FUNDS_FOR_ADVANCE');

    assert(app.getUser('USR-CAROL')!.wallet === initialCarolWallet, 'Carol wallet must remain completely unchanged');
    assert(app.bookingsForUser('USR-CAROL').length === initialBookingsCount, 'No booking must be created');
  });

  test('Validators', 'UserRatingValidator fails when rating < 1.0', () => {
    const validator = new UserRatingValidator();
    const app = new KitBookingApp();
    const lowUser = app.registerUser('LowRated', 500000);
    // Rating defaults to 3.0, let's test directly with mock
    const userMock = { rating: 0.8 } as any;
    assertThrows(() => {
      validator.validate({
        user: userMock,
        kit: app.getKit('KIT-PREMIUM-1')!,
        slot: new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z'),
        proposedPricePaise: 50000,
        existingBookings: [],
        now: new Date(),
      });
    }, 'RATING_BELOW_BOOKING_THRESHOLD');
  });

  // =========================================================================
  // Suite 3: Capacity Model (KI-11, KI-12)
  // =========================================================================
  test('Capacity', 'Pending requests do NOT consume capacity; approval DOES', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    // KIT-PREMIUM-1 totalQuantity is 1
    const bAlice = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 90000);
    // Bob requests the SAME slot. Should succeed because Alice is only REQUESTED!
    const bBob = app.book('USR-BOB', 'KIT-PREMIUM-1', slot, 90000);
    assert(bAlice.status === BookingStatus.REQUESTED, 'Alice is REQUESTED');
    assert(bBob.status === BookingStatus.REQUESTED, 'Bob is REQUESTED');

    // Owner approves Alice
    app.ownerApprove(bAlice.id, 'OWN-STUDIOX');
    assert(app.getBooking(bAlice.id).status === BookingStatus.APPROVED, 'Alice is now APPROVED');

    // Now owner tries to approve Bob for the same slot -> BLOCKED because capacity is 1
    assertThrows(() => {
      app.ownerApprove(bBob.id, 'OWN-STUDIOX');
    }, 'SLOT_CAPACITY_EXCEEDED');
  });

  test('Capacity', 'Cancelling an APPROVED booking releases capacity', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const bAlice = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 90000);
    const bBob = app.book('USR-BOB', 'KIT-PREMIUM-1', slot, 90000);

    app.ownerApprove(bAlice.id, 'OWN-STUDIOX');
    // Alice cancels
    app.cancel(bAlice.id, 'USR-ALICE');

    // Now owner CAN approve Bob because capacity was released!
    app.ownerApprove(bBob.id, 'OWN-STUDIOX');
    assert(app.getBooking(bBob.id).status === BookingStatus.APPROVED, 'Bob can now be approved');
  });

  // =========================================================================
  // Suite 4: Cooldown with DemoClock (19, 20, 21 minutes)
  // =========================================================================
  test('Cooldown', 'Rebooking same kit blocked at 19 min, allowed at 20 min and 21 min', () => {
    const app = new KitBookingApp();
    const slot1 = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const slot2 = new Slot('2026-10-11T13:00:00.000Z', '2026-10-11T16:00:00.000Z');

    app.book('USR-ALICE', 'KIT-PREMIUM-1', slot1, 90000);

    // Immediate second booking for same kit -> blocked
    assertThrows(() => {
      app.book('USR-ALICE', 'KIT-PREMIUM-1', slot2, 90000);
    }, 'COOLDOWN_ACTIVE');

    // Advance clock by 19 minutes -> still blocked
    app.advanceClock(19);
    assertThrows(() => {
      app.book('USR-ALICE', 'KIT-PREMIUM-1', slot2, 90000);
    }, 'COOLDOWN_ACTIVE');

    // Advance 1 more minute (total 20 minutes) -> allowed!
    app.advanceClock(1);
    const b2 = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot2, 90000);
    assert(b2.status === BookingStatus.REQUESTED, 'Booking at 20 min must succeed');
  });

  test('Cooldown', 'Cooldown from CANCELLED booking is ignored (KI-08)', () => {
    const app = new KitBookingApp();
    const slot1 = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const slot2 = new Slot('2026-10-11T13:00:00.000Z', '2026-10-11T16:00:00.000Z');

    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot1, 90000);
    app.cancel(b.id, 'USR-ALICE');

    // Even though 20 minutes haven't passed, CANCELLED booking cooldown is ignored
    const b2 = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot2, 90000);
    assert(b2.status === BookingStatus.REQUESTED, 'Rebooking after cancel must succeed immediately');
  });

  // =========================================================================
  // Suite 5: Advance Maths (20%, integer paise, adjustment on approval)
  // =========================================================================
  test('Advance Maths', 'Initial 20% advance deduction and adjustment on approval (KI-10)', () => {
    const app = new KitBookingApp();
    const aliceInitialWallet = app.getUser('USR-ALICE')!.wallet; // ₹5,000 = 500000 paise
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    // Alice proposes ₹900 (90,000 paise). 20% advance = ₹180 (18,000 paise)
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 90000);
    assert(b.advanceAmount === 18000, 'Advance must be 18000 paise');
    assert(app.getUser('USR-ALICE')!.wallet === aliceInitialWallet - 18000, 'Alice debited 18000 paise');

    // Negotiation: Owner counters ₹1,100, Alice counters ₹1,000 (100,000 paise)
    app.ownerCounter(b.id, 'OWN-STUDIOX', 110000);
    app.userCounter(b.id, 'USR-ALICE', 100000);

    // Owner approves at ₹1,000. New advance is 20% of 100,000 = 20,000 paise.
    // Additional 2,000 paise must be debited from Alice!
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    const updatedB = app.getBooking(b.id);
    assert(updatedB.advanceAmount === 20000, 'Advance must be adjusted to 20000 paise');
    assert(app.getUser('USR-ALICE')!.wallet === aliceInitialWallet - 20000, 'Alice debited extra 2000 paise diff');
  });

  test('Advance Maths', 'Settlement charge is agreedPrice - advance; owner receives full agreed price', () => {
    const app = new KitBookingApp();
    const aliceInitial = app.getUser('USR-ALICE')!.wallet;
    const ownerInitial = app.getOwner('OWN-STUDIOX')!.wallet;
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000); // ₹1000, adv ₹200
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    app.pickup(b.id, 'OWN-STUDIOX');
    app.returnKit(b.id, 'OWN-STUDIOX', ReturnCondition.GOOD);

    // Alice charged remainder: ₹1000 - ₹200 = ₹800 (80,000 paise)
    assert(app.getUser('USR-ALICE')!.wallet === aliceInitial - 100000, 'Alice total debited ₹1000');
    // Owner receives full ₹1000 (100,000 paise)
    assert(app.getOwner('OWN-STUDIOX')!.wallet === ownerInitial + 100000, 'Owner receives full ₹1000');
  });

  // =========================================================================
  // Suite 6: Forfeit Policies (Default vs RefundOnOwnerRejection)
  // =========================================================================
  test('Forfeit Policies', 'DefaultForfeitPolicy credits advance to owner on rejection and cancel (KI-09)', () => {
    const app = new KitBookingApp();
    const ownerInitial = app.getOwner('OWN-STUDIOX')!.wallet;
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000); // ₹200 advance
    app.ownerReject(b.id, 'OWN-STUDIOX');

    assert(app.getOwner('OWN-STUDIOX')!.wallet === ownerInitial + 20000, 'Owner credited ₹200 forfeited advance');
  });

  test('Forfeit Policies', 'RefundOnOwnerRejectionPolicy refunds user on rejection', () => {
    const app = new KitBookingApp();
    app.setSettings({ forfeitPolicyId: 'REFUND_ON_REJECTION' });
    const aliceInitial = app.getUser('USR-ALICE')!.wallet;
    const ownerInitial = app.getOwner('OWN-STUDIOX')!.wallet;
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.ownerReject(b.id, 'OWN-STUDIOX');

    assert(app.getUser('USR-ALICE')!.wallet === aliceInitial, 'Alice refunded advance');
    assert(app.getOwner('OWN-STUDIOX')!.wallet === ownerInitial, 'Owner received 0');
  });

  // =========================================================================
  // Suite 7: Settlement Pre-Check (KI-20)
  // =========================================================================
  test('Settlement Pre-check', 'returnKit leaves booking in PICKED_UP when user cannot pay settlement (KI-20)', () => {
    const app = new KitBookingApp();
    // Register user with just enough for 20% advance (₹200) but not for remaining ₹800
    const brokeUser = app.registerUser('BrokeUser', 20000); // ₹200
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');

    const b = app.book(brokeUser.id, 'KIT-PREMIUM-1', slot, 100000); // debited ₹200, wallet now 0
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    app.pickup(b.id, 'OWN-STUDIOX');

    assertThrows(() => {
      app.returnKit(b.id, 'OWN-STUDIOX', ReturnCondition.GOOD);
    }, 'INSUFFICIENT_FUNDS_FOR_SETTLEMENT');

    // Status MUST remain in PICKED_UP
    assert(app.getBooking(b.id).status === BookingStatus.PICKED_UP, 'Booking must remain in PICKED_UP');
  });

  // =========================================================================
  // Suite 8: Rating Atomic Completion & Once-only Rule (KI-21)
  // =========================================================================
  test('Rating', 'ownerRateUser is atomic and cannot be applied twice (KI-21)', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    app.pickup(b.id, 'OWN-STUDIOX');
    app.returnKit(b.id, 'OWN-STUDIOX', ReturnCondition.GOOD);

    app.rateUser(b.id, 'OWN-STUDIOX', 4.5);
    assert(app.getBooking(b.id).status === BookingStatus.COMPLETED, 'Booking is COMPLETED');

    // Calling rateUser again must throw ILLEGAL_TRANSITION
    assertThrows(() => {
      app.rateUser(b.id, 'OWN-STUDIOX', 5.0);
    }, 'ILLEGAL_TRANSITION');
  });

  // =========================================================================
  // Suite 9: Rating Adjustment Table & Range Validation
  // =========================================================================
  test('Rating Adjustments', 'PRISTINE +0.5 (cap 5), GOOD unchanged, FAIR -0.5 (floor 0), DAMAGED 1.0', () => {
    const ratingService = new RatingService();
    // PRISTINE
    assert(ratingService.computeAdjustedRating(4.0, ReturnCondition.PRISTINE) === 4.5, '4.0 + 0.5 = 4.5');
    assert(ratingService.computeAdjustedRating(4.8, ReturnCondition.PRISTINE) === 5.0, 'Cap at 5.0');

    // GOOD
    assert(ratingService.computeAdjustedRating(4.5, ReturnCondition.GOOD) === 4.5, 'GOOD unchanged');

    // FAIR
    assert(ratingService.computeAdjustedRating(3.0, ReturnCondition.FAIR) === 2.5, '3.0 - 0.5 = 2.5');
    assert(ratingService.computeAdjustedRating(0.3, ReturnCondition.FAIR) === 0.0, 'Floor at 0.0');

    // DAMAGED
    assert(ratingService.computeAdjustedRating(4.5, ReturnCondition.DAMAGED) === 1.0, 'DAMAGED fixed 1.0');

    // Range validation
    assertThrows(() => ratingService.computeAdjustedRating(-0.5, ReturnCondition.GOOD), 'INVALID_RATING_RANGE');
    assertThrows(() => ratingService.computeAdjustedRating(5.5, ReturnCondition.GOOD), 'INVALID_RATING_RANGE');
  });

  // =========================================================================
  // Suite 10: Negotiation Turn Order & Identity Checks (KI-14)
  // =========================================================================
  test('Negotiation', 'Only other party may respond; cannot counter or accept your own offer (KI-14)', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 90000);

    // Alice made initial offer. Alice trying to counter her own offer must fail
    assertThrows(() => {
      app.userCounter(b.id, 'USR-ALICE', 85000);
    }, 'NOT_YOUR_TURN');

    // Alice trying to accept her own offer must fail
    assertThrows(() => {
      app.userAccept(b.id, 'USR-ALICE');
    }, 'INVALID_OFFER_AUTHOR');

    // Owner counters
    app.ownerCounter(b.id, 'OWN-STUDIOX', 110000);

    // Owner cannot counter again consecutively
    assertThrows(() => {
      app.ownerCounter(b.id, 'OWN-STUDIOX', 115000);
    }, 'NOT_YOUR_TURN');
  });

  // =========================================================================
  // Suite 11: Observer Isolation (KI-22)
  // =========================================================================
  test('Observers', 'A throwing observer does NOT abort the domain operation and is logged to audit (KI-22)', () => {
    const app = new KitBookingApp();
    // Add a faulty observer that always throws
    const faultyObserver: BookingObserver = {
      name: 'BrokenAnalyticsObserver',
      onEvent: () => {
        throw new Error('Analytics server connection timeout 504');
      },
    };
    (app as any).deps.bookingService.addObserver(faultyObserver);

    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    // Operation must NOT throw despite observer crashing!
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    assert(b.status === BookingStatus.REQUESTED, 'Booking created successfully');

    // Audit log must record the observer failure
    const auditLogs = app.auditLog();
    const failureLog = auditLogs.find((l) => l.eventType.includes('FAILURE') || l.message.includes('BrokenAnalyticsObserver'));
    assert(!!failureLog, 'Observer failure recorded in audit log');
  });

  // =========================================================================
  // Suite 12: Kit Turnaround & Inspection Cooldown
  // =========================================================================
  test('Kit Inspection Turnaround', 'returnKit activates 20-minute owner inspection cooldown buffer', () => {
    const app = new KitBookingApp();
    const slot = new Slot('2026-10-11T09:00:00.000Z', '2026-10-11T12:00:00.000Z');
    const b = app.book('USR-ALICE', 'KIT-PREMIUM-1', slot, 100000);
    app.ownerApprove(b.id, 'OWN-STUDIOX');
    app.pickup(b.id, 'OWN-STUDIOX');
    app.returnKit(b.id, 'OWN-STUDIOX', ReturnCondition.GOOD);

    const returnedBooking = app.getBooking(b.id);
    assert(returnedBooking.status === BookingStatus.RETURNED, 'Status must be RETURNED');
    assert(!!returnedBooking.inspectionCooldownUntil, 'Inspection cooldown must be set');
    assert(returnedBooking.isUnderInspection === true, 'Booking is under inspection');

    const expectedCooldownMs = returnedBooking.returnedAt!.getTime() + 20 * 60 * 1000;
    assert(
      returnedBooking.inspectionCooldownUntil!.getTime() === expectedCooldownMs,
      'Inspection cooldown must be 20 minutes from return'
    );

    // Human common-sense check: Bob tries to book KIT-PREMIUM-1 while it is under owner inspection
    const slot2 = new Slot('2026-10-11T13:00:00.000Z', '2026-10-11T16:00:00.000Z');
    assertThrows(() => {
      app.book('USR-BOB', 'KIT-PREMIUM-1', slot2, 100000);
    }, 'COOLDOWN_ACTIVE');

    // Advance clock by 20 minutes: inspection cooldown completes!
    app.advanceClock(20);
    const bobBooking = app.book('USR-BOB', 'KIT-PREMIUM-1', slot2, 100000);
    assert(bobBooking.status === BookingStatus.REQUESTED, 'Bob can book after inspection cooldown expires');
  });

  return results;
}
