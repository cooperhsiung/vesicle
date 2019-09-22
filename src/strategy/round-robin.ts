import { Provider, Strategy } from './';

export class RoundRobin implements Strategy {
  public counter: number;
  public targets: Provider[];
  constructor(targets: Provider[]) {
    this.counter = 0;
    this.targets = targets;
  }

  update(newTargets: Provider[]) {
    this.targets = newTargets;
  }

  select() {
    const healthyTargets = this.targets.filter(t => t.fall === 0);
    if (this.counter >= healthyTargets.length) {
      this.counter = 0;
    }
    //
    return healthyTargets[this.counter++];
  }
}
