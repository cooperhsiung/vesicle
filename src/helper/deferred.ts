import Timeout = NodeJS.Timeout;

export class Deferred {
  public promise: Promise<any>;
  public resolve!: (data: any) => void;
  public reject!: (err: Error) => void;
  public timer!: Timeout;
  constructor(timeout: number = 20000) {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.timer = setTimeout(reject, timeout, 'timeout');
    });
  }
}
