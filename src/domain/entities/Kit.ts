import { Camera } from '../components/Camera';
import { Mic } from '../components/Mic';
import { Tripod } from '../components/Tripod';
import { Tier } from '../enums';

export interface KitDetailsView {
  id: string;
  ownerId: string;
  tier: Tier;
  totalQuantity: number;
  dailyPrice: number;
  camera: {
    id: string;
    brand: string;
    model: string;
    basePrice: number;
    megapixels: number;
    has4K: boolean;
    specs: string;
  };
  mic: {
    id: string;
    brand: string;
    model: string;
    basePrice: number;
    wireless: boolean;
    rangeM: number;
    specs: string;
  };
  tripod: {
    id: string;
    brand: string;
    model: string;
    basePrice: number;
    maxHeightCm: number;
    loadKg: number;
    specs: string;
  };
}

export class Kit {
  public readonly id: string;
  public readonly ownerId: string;
  public readonly tier: Tier;
  public readonly camera: Camera;
  public readonly mic: Mic;
  public readonly tripod: Tripod;
  public readonly totalQuantity: number; // total units owned
  public readonly dailyPrice: number; // in integer paise

  constructor(
    id: string,
    ownerId: string,
    tier: Tier,
    camera: Camera,
    mic: Mic,
    tripod: Tripod,
    totalQuantity: number,
    dailyPricePaise: number
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.tier = tier;
    this.camera = camera;
    this.mic = mic;
    this.tripod = tripod;
    this.totalQuantity = Math.max(1, Math.floor(totalQuantity));
    this.dailyPrice = Math.round(dailyPricePaise);
  }

  fullDetails(): KitDetailsView {
    return {
      id: this.id,
      ownerId: this.ownerId,
      tier: this.tier,
      totalQuantity: this.totalQuantity,
      dailyPrice: this.dailyPrice,
      camera: {
        id: this.camera.id,
        brand: this.camera.brand,
        model: this.camera.model,
        basePrice: this.camera.basePrice,
        megapixels: this.camera.megapixels,
        has4K: this.camera.has4K,
        specs: this.camera.specs,
      },
      mic: {
        id: this.mic.id,
        brand: this.mic.brand,
        model: this.mic.model,
        basePrice: this.mic.basePrice,
        wireless: this.mic.wireless,
        rangeM: this.mic.rangeM,
        specs: this.mic.specs,
      },
      tripod: {
        id: this.tripod.id,
        brand: this.tripod.brand,
        model: this.tripod.model,
        basePrice: this.tripod.basePrice,
        maxHeightCm: this.tripod.maxHeightCm,
        loadKg: this.tripod.loadKg,
        specs: this.tripod.specs,
      },
    };
  }

  clone(): Kit {
    return new Kit(
      this.id,
      this.ownerId,
      this.tier,
      this.camera,
      this.mic,
      this.tripod,
      this.totalQuantity,
      this.dailyPrice
    );
  }
}
