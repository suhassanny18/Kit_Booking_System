import { KitComponentFactory } from './KitComponentFactory';
import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';

export class StandardKitFactory implements KitComponentFactory {
  getTier(): Tier {
    return Tier.STANDARD;
  }

  createCamera(kitId: string): Camera {
    // Canon EOS R10 (24 MP, 4K, ₹150 base = 15,000 paise)
    return new Camera(`CAM-S-${kitId}`, 'Canon', 'EOS R10', 15000, 24, true);
  }

  createMic(kitId: string): Mic {
    // Boya BY-M1 (wired, 10 m, ₹30 base = 3,000 paise)
    return new Mic(`MIC-S-${kitId}`, 'Boya', 'BY-M1', 3000, false, 10);
  }

  createTripod(kitId: string): Tripod {
    // Digitek DTR-550 (150 cm, 5 kg, ₹25 base = 2,500 paise)
    return new Tripod(`TRI-S-${kitId}`, 'Digitek', 'DTR-550', 2500, 150, 5);
  }
}
