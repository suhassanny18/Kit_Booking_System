import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';

/**
 * Abstract Factory Pattern: KitComponentFactory
 * Produces family of components (Camera, Mic, Tripod) matching the tier.
 */
export interface KitComponentFactory {
  createCamera(kitId: string): Camera;
  createMic(kitId: string): Mic;
  createTripod(kitId: string): Tripod;
  getTier(): Tier;
}
