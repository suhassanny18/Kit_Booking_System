import { KitComponentFactory } from './KitComponentFactory';
import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';

export class PremiumKitFactory implements KitComponentFactory {
  getTier(): Tier {
    return Tier.PREMIUM;
  }

  createCamera(kitId: string): Camera {
    // Sony A7S III (12 MP, 4K, ₹250 base = 25,000 paise)
    return new Camera(`CAM-P-${kitId}`, 'Sony', 'A7S III', 25000, 12, true);
  }

  createMic(kitId: string): Mic {
    // Rode Wireless GO II (wireless, 200 m, ₹80 base = 8,000 paise)
    return new Mic(`MIC-P-${kitId}`, 'Rode', 'Wireless GO II', 8000, true, 200);
  }

  createTripod(kitId: string): Tripod {
    // Manfrotto MT055 (170 cm, 9 kg, ₹60 base = 6,000 paise)
    return new Tripod(`TRI-P-${kitId}`, 'Manfrotto', 'MT055', 6000, 170, 9);
  }
}
