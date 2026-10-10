import { DemoClock } from '../domain/clock';
import { InMemoryUserRepository } from '../repositories/in-memory/InMemoryUserRepository';
import { InMemoryOwnerRepository } from '../repositories/in-memory/InMemoryOwnerRepository';
import { InMemoryKitRepository } from '../repositories/in-memory/InMemoryKitRepository';
import { InMemoryBookingRepository } from '../repositories/in-memory/InMemoryBookingRepository';
import { InMemoryLedgerRepository } from '../repositories/in-memory/InMemoryLedgerRepository';
import { ValidationChainFactory } from '../domain/validators/ValidationChainFactory';
import { RatingThresholdApproval } from '../domain/strategies/ApprovalStrategy';
import { DefaultForfeitPolicy, RefundOnOwnerRejectionPolicy, ForfeitPolicy } from '../domain/strategies/ForfeitPolicy';
import { FlatDailyPricing, TierMultiplierPricing, PricingStrategy } from '../domain/strategies/PricingStrategy';
import { RatingPriorityStrategy } from '../domain/strategies/PriorityStrategy';
import { OwnerInboxObserver } from '../observers/OwnerInboxObserver';
import { UserInboxObserver } from '../observers/UserInboxObserver';
import { AuditObserver } from '../observers/AuditObserver';
import { PaymentService } from '../services/PaymentService';
import { RatingService } from '../services/RatingService';
import { BookingService } from '../services/BookingService';
import { AuthService } from '../services/AuthService';
import { KitService } from '../services/KitService';
import { SlotService } from '../services/SlotService';
import { UnitOfWork } from '../services/UnitOfWork';
import { Tier } from '../domain/enums';
import { User } from '../domain/entities/User';
import { Owner } from '../domain/entities/Owner';
import { KitBuilder } from '../domain/builders/KitBuilder';

export interface AppDependencies {
  clock: DemoClock;
  userRepo: InMemoryUserRepository;
  ownerRepo: InMemoryOwnerRepository;
  kitRepo: InMemoryKitRepository;
  bookingRepo: InMemoryBookingRepository;
  ledgerRepo: InMemoryLedgerRepository;
  ownerInboxObserver: OwnerInboxObserver;
  userInboxObserver: UserInboxObserver;
  auditObserver: AuditObserver;
  authService: AuthService;
  kitService: KitService;
  slotService: SlotService;
  paymentService: PaymentService;
  ratingService: RatingService;
  bookingService: BookingService;
  unitOfWork: UnitOfWork;
  pricingStrategy: PricingStrategy;
  tierMultiplierPricing: TierMultiplierPricing;
  flatDailyPricing: FlatDailyPricing;
  defaultForfeitPolicy: DefaultForfeitPolicy;
  refundOnOwnerRejectionPolicy: RefundOnOwnerRejectionPolicy;
  approvalStrategy: RatingThresholdApproval;
}

/**
 * Composition Root for Kit Booking System
 * Wires repositories, services, strategies, observers and seeds initial demo data.
 */
export function buildApplication(): AppDependencies {
  // 1. Clock (DemoClock starts at 2026-10-10 09:00:00)
  const clock = new DemoClock(new Date('2026-10-10T09:00:00.000Z'));

  // 2. Repositories
  const userRepo = new InMemoryUserRepository();
  const ownerRepo = new InMemoryOwnerRepository();
  const kitRepo = new InMemoryKitRepository();
  const bookingRepo = new InMemoryBookingRepository();
  const ledgerRepo = new InMemoryLedgerRepository();

  // 3. Observers
  const ownerInboxObserver = new OwnerInboxObserver();
  const userInboxObserver = new UserInboxObserver();
  const auditObserver = new AuditObserver();

  // 4. Strategies & Policies
  const flatDailyPricing = new FlatDailyPricing();
  const tierMultiplierPricing = new TierMultiplierPricing();
  const pricingStrategy: PricingStrategy = flatDailyPricing;

  const defaultForfeitPolicy = new DefaultForfeitPolicy();
  const refundOnOwnerRejectionPolicy = new RefundOnOwnerRejectionPolicy();

  const approvalStrategy = new RatingThresholdApproval();
  const priorityStrategy = new RatingPriorityStrategy();

  // 5. Injected Validation Chain (KI-26)
  const validationChain = ValidationChainFactory.build();

  // 6. Services
  const unitOfWork = new UnitOfWork(userRepo, ownerRepo, bookingRepo, ledgerRepo);
  const authService = new AuthService(userRepo, ownerRepo);
  const kitService = new KitService(kitRepo, ownerRepo);
  const slotService = new SlotService(kitRepo, bookingRepo);
  const paymentService = new PaymentService(ledgerRepo, clock);
  const ratingService = new RatingService();

  const bookingService = new BookingService(
    userRepo,
    ownerRepo,
    kitRepo,
    bookingRepo,
    paymentService,
    ratingService,
    validationChain,
    approvalStrategy,
    defaultForfeitPolicy,
    priorityStrategy,
    clock,
    unitOfWork
  );

  // Register observers
  bookingService.addObserver(ownerInboxObserver);
  bookingService.addObserver(userInboxObserver);
  bookingService.addObserver(auditObserver);

  // Seed initial data
  seedDemoData(userRepo, ownerRepo, kitRepo);

  return {
    clock,
    userRepo,
    ownerRepo,
    kitRepo,
    bookingRepo,
    ledgerRepo,
    ownerInboxObserver,
    userInboxObserver,
    auditObserver,
    authService,
    kitService,
    slotService,
    paymentService,
    ratingService,
    bookingService,
    unitOfWork,
    pricingStrategy,
    tierMultiplierPricing,
    flatDailyPricing,
    defaultForfeitPolicy,
    refundOnOwnerRejectionPolicy,
    approvalStrategy,
  };
}

/**
 * Section 13 Seed Data:
 * • Users: Alice (wallet ₹5,000, rating 3.0, 0 ratings), Bob (₹5,000, rating 4.67 from three ratings 5, 5, 4),
 *   Carol (₹300, rating 3.0), Dev (₹5,000, rating 2.0).
 * • Owners: StudioX, LensLab.
 * • Kits:
 *   - StudioX: PREMIUM at ₹1,000 per slot with quantity 1
 *   - StudioX: STANDARD at ₹600 with quantity 2
 *   - LensLab: BUDGET at ₹400 with quantity 2
 */
export function seedDemoData(
  userRepo: InMemoryUserRepository,
  ownerRepo: InMemoryOwnerRepository,
  kitRepo: InMemoryKitRepository
): void {
  userRepo.clear();
  ownerRepo.clear();
  kitRepo.clear();

  // Users (Paise: ₹5000 = 500,000 paise; ₹300 = 30,000 paise)
  const alice = new User('USR-ALICE', 'Alice', 500000, 3.0, 0);
  const bob = new User('USR-BOB', 'Bob', 500000, 4.67, 3);
  const carol = new User('USR-CAROL', 'Carol', 30000, 3.0, 0);
  const dev = new User('USR-DEV', 'Dev', 500000, 2.0, 1);

  userRepo.save(alice);
  userRepo.save(bob);
  userRepo.save(carol);
  userRepo.save(dev);

  // Owners
  const studioX = new Owner('OWN-STUDIOX', 'StudioX', 0);
  const lensLab = new Owner('OWN-LENSLAB', 'LensLab', 0);

  ownerRepo.save(studioX);
  ownerRepo.save(lensLab);

  // Kits
  // Kit 1: StudioX - PREMIUM, ₹1,000 = 100,000 paise, qty 1
  const kit1 = new KitBuilder()
    .withId('KIT-PREMIUM-1')
    .withOwnerId('OWN-STUDIOX')
    .withTier(Tier.PREMIUM)
    .withTotalQuantity(1)
    .withDailyPrice(100000)
    .build();

  // Kit 2: StudioX - STANDARD, ₹600 = 60,000 paise, qty 2
  const kit2 = new KitBuilder()
    .withId('KIT-STANDARD-1')
    .withOwnerId('OWN-STUDIOX')
    .withTier(Tier.STANDARD)
    .withTotalQuantity(2)
    .withDailyPrice(60000)
    .build();

  // Kit 3: LensLab - BUDGET, ₹400 = 40,000 paise, qty 2
  const kit3 = new KitBuilder()
    .withId('KIT-BUDGET-1')
    .withOwnerId('OWN-LENSLAB')
    .withTier(Tier.BUDGET)
    .withTotalQuantity(2)
    .withDailyPrice(40000)
    .build();

  kitRepo.save(kit1);
  kitRepo.save(kit2);
  kitRepo.save(kit3);
}
