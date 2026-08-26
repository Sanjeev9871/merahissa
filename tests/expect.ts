import assert from 'node:assert/strict';

/**
 * A ~60-line expect() over node:assert.
 *
 * Mera Hissa runs its tests on Node's built-in test runner rather than Vitest or
 * Jest. Rationale: the test suite that guards PII redaction and statutory
 * share computation should have zero third-party dependencies. A supply-chain
 * compromise in a test framework is a compromise of the thing verifying our
 * security guarantees, and those guarantees are the product.
 *
 * Run with:  npm test   (node --test --experimental-strip-types tests/)
 */

type AnyFn = (...args: never[]) => unknown;

class Expectation<T> {
  private readonly actual: T;
  private readonly negated: boolean;

  constructor(actual: T, negated = false) {
    this.actual = actual;
    this.negated = negated;
  }

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.negated);
  }

  private check(pass: boolean, message: string): void {
    if (pass === this.negated) {
      assert.fail(this.negated ? `Expected NOT: ${message}` : message);
    }
  }

  toBe(expected: unknown): void {
    this.check(
      Object.is(this.actual, expected),
      `expected ${fmt(this.actual)} to be ${fmt(expected)}`,
    );
  }

  toEqual(expected: unknown): void {
    let same = true;
    try {
      assert.deepStrictEqual(this.actual, expected);
    } catch {
      same = false;
    }
    this.check(same, `expected ${fmt(this.actual)} to deep-equal ${fmt(expected)}`);
  }

  toContain(needle: string): void {
    const hay = this.actual;
    const found = typeof hay === 'string'
      ? hay.includes(needle)
      : Array.isArray(hay) && hay.includes(needle as never);
    this.check(found, `expected ${fmt(hay)} to contain ${fmt(needle)}`);
  }

  toHaveLength(n: number): void {
    const len = (this.actual as { length?: number })?.length;
    this.check(len === n, `expected length ${n}, got ${len}`);
  }

  toBeNull(): void {
    this.check(this.actual === null, `expected ${fmt(this.actual)} to be null`);
  }

  toBeUndefined(): void {
    this.check(this.actual === undefined, `expected ${fmt(this.actual)} to be undefined`);
  }

  toBeInstanceOf(ctor: new (...a: never[]) => unknown): void {
    this.check(this.actual instanceof ctor, `expected instance of ${ctor.name}`);
  }

  toThrow(ctor?: new (...a: never[]) => Error): void {
    let threw = false;
    let error: unknown;
    try {
      (this.actual as AnyFn)();
    } catch (e) {
      threw = true;
      error = e;
    }

    if (this.negated) {
      this.check(threw, `expected function not to throw, but it threw ${fmt(error)}`);
      return;
    }

    this.check(threw, 'expected function to throw, but it did not');
    if (ctor && !(error instanceof ctor)) {
      assert.fail(`expected a ${ctor.name}, got ${fmt(error)}`);
    }
  }
}

function fmt(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof Error) return `${v.name}(${v.message})`;
  try {
    const s = JSON.stringify(v);
    return s === undefined ? String(v) : s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return String(v);
  }
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}
