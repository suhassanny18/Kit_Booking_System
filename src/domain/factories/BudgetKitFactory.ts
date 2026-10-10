import { KitComponentFactory } from './KitComponentFactory';
import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';

export class BudgetKitFactory implements KitComponentFactory {
  getTier(): Tier {
    return Tier.BUDGET;
  }

  createCamera(kitId: string): Camera {
    // Nikon D3500 (24 MP, no 4K, ₹90 base = 9,000 paise)
    return new Camera(`CAM-B-${kitId}`, 'Nikon', 'D3500', 9000, 24, false);
  }

  createMic(kitId: string): Mic {
    // Maono AU-100 (wired, 5 m, ₹15 base = 1,500 paise)
    return new Mic(`MIC-B-${kitId}`, 'Maono', 'AU-100', 1500, false, 5);
  }

  createTripod(kitId: string): Tripod {
    // Simpex TR-472 (130 cm, 3 kg, ₹10 base = 1,000 paise)
    return new Tripod(`TRI-B-${kitId}`, 'Simpex', 'TR-472', 1000, 130, 3);
  }
}
