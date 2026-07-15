import logger from "./logger";

type AsyncFunction<T> = (...args: any[]) => Promise<T>;

enum State {
  CLOSED,
  OPEN,
  HALF_OPEN
}

export class CircuitBreaker<T> {
  private state: State = State.CLOSED;
  private failureThreshold: number;
  private successThreshold: number;
  private timeout: number;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private serviceName: string;

  constructor(
    serviceName: string,
    options = { failureThreshold: 5, successThreshold: 2, timeout: 30000 }
  ) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold;
    this.successThreshold = options.successThreshold;
    this.timeout = options.timeout;
  }

  async execute(fn: AsyncFunction<T>, ...args: any[]): Promise<T> {
    if (this.state === State.OPEN) {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = State.HALF_OPEN;
        logger.info(`[CircuitBreaker] ${this.serviceName} entering HALF_OPEN state`);
      } else {
        throw new Error(`Circuit for ${this.serviceName} is OPEN`);
      }
    }

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === State.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = State.CLOSED;
        this.successes = 0;
        logger.info(`[CircuitBreaker] ${this.serviceName} circuit CLOSED`);
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === State.CLOSED && this.failures >= this.failureThreshold) {
      this.state = State.OPEN;
      logger.error(`[CircuitBreaker] ${this.serviceName} circuit OPENED`);
    } else if (this.state === State.HALF_OPEN) {
      this.state = State.OPEN;
      logger.error(`[CircuitBreaker] ${this.serviceName} circuit re-OPENED during HALF_OPEN`);
    }
  }
}
