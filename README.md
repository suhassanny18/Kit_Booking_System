# Kit Booking System

A browser-based equipment rental marketplace (React + TypeScript + Tailwind CSS) with a clean domain layer mirroring Low-Level Design (LLD) specifications. Owners list camera + mic + tripod production kits and users request time-slotted bookings through an owner-approved lifecycle with a 20% advance payment held in escrow, rebooking cooldowns, gear pickup and return flows, final settlements, and post-return ratings.

---

## How to Run the App & Tests

### Development Server
```bash
npm run dev
```
The app runs at `http://localhost:3000`.

### Run Unit Tests
```bash
npm test
```
Or view the interactive **Test Suite** tab directly inside the web UI to run all 20 domain and service unit test cases live with execution profiling.

---

## Architecture & Layering

The application follows strict layering where the UI **only** interacts with the public `KitBookingApp` facade:

```
src/
├── domain/                  # Pure domain logic (entities, enums, states, strategies, validators)
│   ├── components/          # Component abstract class and Camera, Mic, Tripod subclasses
│   ├── factories/           # Abstract Factory (Premium, Standard, Budget kit component factories)
│   ├── builders/            # Builder pattern (KitBuilder with strict build validation)
│   ├── entities/            # User, Owner, Kit, Slot, Booking, LedgerEntry
│   ├── states/              # State pattern (8 booking lifecycle states with default-deny)
│   ├── strategies/          # Pricing, Priority, Approval, and Forfeit policies
│   ├── validators/          # Chain of Responsibility validators (Capacity, Cooldown, Advance, Rating)
│   ├── clock.ts             # Injected Clock interface (SystemClock, DemoClock)
│   ├── constants.ts         # ADVANCE_PCT, REBOOK_COOLDOWN_MIN, MIN_RATING_*
│   └── errors.ts            # Typed DomainError with codes (e.g. ILLEGAL_TRANSITION)
├── repositories/            # Repository contracts & in-memory implementations
│   ├── UserRepository.ts
│   ├── OwnerRepository.ts
│   ├── KitRepository.ts
│   ├── BookingRepository.ts
│   └── LedgerRepository.ts
├── services/                # Application domain services
│   ├── AuthService.ts       # User & Owner management
│   ├── KitService.ts        # Inventory listing & kit additions
│   ├── SlotService.ts       # Slot availability computation
│   ├── PaymentService.ts    # Escrow advance hold, adjustment, settlement, forfeiture
│   ├── RatingService.ts     # Post-return condition score adjustment & atomic completion
│   ├── UnitOfWork.ts        # Concurrency & transactional snapshot rollback (KI-19)
│   └── BookingService.ts    # Central booking orchestrator
├── observers/               # Observer pattern (cross-cutting notification side channels)
│   ├── BookingObserver.ts   # Observer interface & BookingEvent
│   ├── OwnerInboxObserver.ts
│   ├── UserInboxObserver.ts
│   └── AuditObserver.ts     # System audit trail & isolated error logging (KI-22)
├── facade/                  # Composition root & public gateway
│   ├── CompositionRoot.ts   # Dependency injection wiring & initial demo seed data
│   └── KitBookingApp.ts     # Single public Facade used by the UI
├── tests/                   # Domain & Service Vitest test runner
│   ├── testRunner.ts        # 20 executable unit tests covering all 11 suites in Section 15
│   └── domain.test.ts       # Vitest specification file
└── ui/                      # React UI layer (imports only from facade/KitBookingApp)
```

---

## Design Patterns to Code Mapping

| Design Pattern | Concern | Implementing Files |
| :--- | :--- | :--- |
| **Abstract Factory** | Kit family per tier (Camera, Mic, Tripod) | `src/domain/factories/KitComponentFactory.ts`<br>`src/domain/factories/PremiumKitFactory.ts`<br>`src/domain/factories/StandardKitFactory.ts`<br>`src/domain/factories/BudgetKitFactory.ts` |
| **Builder** | Fluent kit assembly with required field validation | `src/domain/builders/KitBuilder.ts` |
| **State** | Booking lifecycle with default-deny behavior (8 statuses) | `src/domain/states/BookingState.ts`<br>`src/domain/states/RequestedState.ts`<br>`src/domain/states/NegotiatingState.ts`<br>`src/domain/states/ApprovedState.ts`<br>`src/domain/states/PickedUpState.ts`<br>`src/domain/states/ReturnedState.ts`<br>`src/domain/states/CompletedState.ts`<br>`src/domain/states/RejectedState.ts`<br>`src/domain/states/CancelledState.ts` |
| **Chain of Responsibility** | Pre-booking check chain (Slot Capacity, Cooldown, Advance Funds, User Rating) | `src/domain/validators/BookingValidator.ts`<br>`src/domain/validators/SlotCapacityValidator.ts`<br>`src/domain/validators/CooldownValidator.ts`<br>`src/domain/validators/AdvanceFundsValidator.ts`<br>`src/domain/validators/UserRatingValidator.ts`<br>`src/domain/validators/ValidationChainFactory.ts` |
| **Strategy** | Pricing suggestions, owner queue sorting, approval rules, forfeit policies | `src/domain/strategies/PricingStrategy.ts` (`FlatDailyPricing`, `TierMultiplierPricing`)<br>`src/domain/strategies/PriorityStrategy.ts` (`RatingPriorityStrategy`)<br>`src/domain/strategies/ApprovalStrategy.ts` (`RatingThresholdApproval`)<br>`src/domain/strategies/ForfeitPolicy.ts` (`DefaultForfeitPolicy`, `RefundOnOwnerRejectionPolicy`) |
| **Observer** | Decoupled cross-cutting notification channel & audit logging | `src/observers/BookingObserver.ts`<br>`src/observers/OwnerInboxObserver.ts`<br>`src/observers/UserInboxObserver.ts`<br>`src/observers/AuditObserver.ts` |
| **Repository** | Decoupled persistence boundary for entities | `src/repositories/UserRepository.ts`<br>`src/repositories/OwnerRepository.ts`<br>`src/repositories/KitRepository.ts`<br>`src/repositories/BookingRepository.ts`<br>`src/repositories/LedgerRepository.ts` |
| **Facade** | Single entry point for presentation layer | `src/facade/KitBookingApp.ts` |
| **Unit of Work** | Transactional snapshot & rollback on error (concurrency safety) | `src/services/UnitOfWork.ts` |
| **Dependency Injection**| Composition root wiring all services and dependencies | `src/facade/CompositionRoot.ts` |

---

## Key Corrected Known Issues (KI-06 to KI-26)

- **KI-06 (No cancel):** Added `cancelBooking` in service and facade. User can cancel from `REQUESTED`, `NEGOTIATING`, or `APPROVED`. Cancelling releases capacity and emits `CANCELLED`.
- **KI-07 (Pricing unused):** PricingStrategy is queried to show opening suggested price to renters.
- **KI-08 (Cooldown ambiguity):** Cooldown counts from request creation (20 min) per user and per kit. Cooldown from `CANCELLED` bookings is ignored.
- **KI-09 (Forfeit credits nobody):** Forfeited advances are credited to the owner through the financial ledger.
- **KI-10 (Advance not 20% after negotiation):** On owner approval, advance is recomputed as 20% of the agreed price, debiting or crediting the user for the difference.
- **KI-11/12 (Inventory model):** Single slot-capacity model derived from `APPROVED` and `PICKED_UP` bookings. Pending requests do not consume capacity.
- **KI-14 (Negotiation turn identity):** Each offer records author (`USER` or `OWNER`). Consecutive offers by same author or accepting own offer are blocked.
- **KI-19 (Concurrency):** Every mutating service method executes inside `UnitOfWork` snapshot rollback.
- **KI-20 (Settle failure stranding):** `returnKit` pre-checks user wallet before transitioning state, preventing bookings stranded in invalid states.
- **KI-21 (Rating order & once-only):** `ownerRateUser` requires state `RETURNED`, adjusts score by return condition, applies rating and completes booking atomically.
- **KI-22 (Observer failure):** Each observer executes in isolated try/catch; failures log to audit and never abort main domain operations.
- **KI-23 (No float money):** All currency amounts stored as integer paise (1 Rupee = 100 paise).
- **KI-24 (Time injection):** Injected `Clock` interface with `DemoClock` supporting +5m, +20m, +60m advancements.
- **KI-25 (Field mutability):** Booking fields are private with read-only getters and package-internal mutation methods.
- **KI-26 (Validation chain injection):** `ValidationChainFactory.build()` injected at composition root.
