import { Component } from './Component';
import { ComponentType } from '../enums';

export class Tripod extends Component {
  public readonly maxHeightCm: number;
  public readonly loadKg: number;

  constructor(id: string, brand: string, model: string, basePricePaise: number, maxHeightCm: number, loadKg: number) {
    super(id, brand, model, basePricePaise);
    this.maxHeightCm = maxHeightCm;
    this.loadKg = loadKg;
  }

  getType(): ComponentType {
    return ComponentType.TRIPOD;
  }

  get specs(): string {
    return `${this.maxHeightCm}cm height, ${this.loadKg}kg payload`;
  }
}
