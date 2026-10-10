import { Component } from './Component';
import { ComponentType } from '../enums';

export class Mic extends Component {
  public readonly wireless: boolean;
  public readonly rangeM: number;

  constructor(id: string, brand: string, model: string, basePricePaise: number, wireless: boolean, rangeM: number) {
    super(id, brand, model, basePricePaise);
    this.wireless = wireless;
    this.rangeM = rangeM;
  }

  getType(): ComponentType {
    return ComponentType.MIC;
  }

  get specs(): string {
    return `${this.wireless ? 'Wireless' : 'Wired'}, ${this.rangeM}m range`;
  }
}
