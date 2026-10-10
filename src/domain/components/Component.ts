import { ComponentType } from '../enums';

export abstract class Component {
  public readonly id: string;
  public readonly brand: string;
  public readonly model: string;
  public readonly basePrice: number; // in integer paise

  constructor(id: string, brand: string, model: string, basePricePaise: number) {
    this.id = id;
    this.brand = brand;
    this.model = model;
    this.basePrice = Math.round(basePricePaise);
  }

  abstract getType(): ComponentType;

  get displayName(): string {
    return `${this.brand} ${this.model}`;
  }
}
