import { sample } from 'lodash';
import { Provider, Strategy } from './';

export class Random implements Strategy {
  public targets: Provider[];
  constructor(targets: Provider[]) {
    this.targets = targets;
  }

  update(newTargets: Provider[]) {
    this.targets = newTargets;
  }

  select() {
    const healthyTargets = this.targets.filter(t => t.fall === 0);
    return sample(healthyTargets) as Provider;
  }
}
