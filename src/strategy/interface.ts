export type Provider = {
  addr: string;
  fall: number;
};

export interface Strategy {
  targets: Provider[];
  update(newTargets: Provider[]): void;
  select(): Provider;
}
