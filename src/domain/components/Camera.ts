import { Component } from './Component';
import { ComponentType } from '../enums';

export class Camera extends Component {
  public readonly megapixels: number;
  public readonly has4K: boolean;

  constructor(id: string, brand: string, model: string, basePricePaise: number, megapixels: number, has4K: boolean) {
    super(id, brand, model, basePricePaise);
    this.megapixels = megapixels;
    this.has4K = has4K;
  }

  getType(): ComponentType {
    return ComponentType.CAMERA;
  }

  get specs(): string {
    return `${this.megapixels} MP, ${this.has4K ? '4K Video' : 'Full HD'}`;
  }
}
