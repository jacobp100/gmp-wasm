import type { GMPFunctions } from './functions';
import { assertInt32 } from './util';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type RationalFactoryReturn = ReturnType<typeof getRationalContext>['Rational'];
export interface RationalFactory extends RationalFactoryReturn {};
type RationalReturn = ReturnType<RationalFactoryReturn>;
export interface Rational extends RationalReturn {};

export function getRationalContext(gmp: GMPFunctions) {
  const mpq_t_arr: number[] = [];

  const RationalPrototype = {
    mpq_t: 0,
    type: 'rational',

    add(val: Rational | number): Rational {
      const n = RationalFn(0, 1);
      if (typeof val === 'number') {
        gmp.mpq_add(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
      } else {
        gmp.mpq_add(n.mpq_t, this.mpq_t, val.mpq_t);
      }
      return n;
    },

    sub(val: Rational | number): Rational {
      const n = RationalFn(0, 1);
      if (typeof val === 'number') {
        gmp.mpq_sub(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
      } else {
        gmp.mpq_sub(n.mpq_t, this.mpq_t, val.mpq_t);
      }
      return n;
    },

    mul(val: Rational | number): Rational {
      const n = RationalFn(0, 1);
      if (typeof val === 'number') {
        gmp.mpq_mul(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
      } else {
        gmp.mpq_mul(n.mpq_t, this.mpq_t, val.mpq_t);
      }
      return n;
    },

    neg(): Rational {
      const n = RationalFn(0, 1);
      gmp.mpq_neg(n.mpq_t, this.mpq_t);
      return n;
    },

    invert(): Rational {
      const n = RationalFn(0, 1);
      gmp.mpq_inv(n.mpq_t, this.mpq_t);
      return n;
    },

    abs(): Rational {
      const n = RationalFn(0, 1);
      gmp.mpq_abs(n.mpq_t, this.mpq_t);
      return n;
    },

    div(val: Rational | number): Rational {
      const n = RationalFn(0, 1);
      if (typeof val === 'number') {
        gmp.mpq_div(n.mpq_t, this.mpq_t, RationalFn(val).mpq_t);
      } else {
        gmp.mpq_div(n.mpq_t, this.mpq_t, val.mpq_t);
      }
      return n;
    },

    isEqual(val: Rational | number) {
      if (typeof val === 'number') {
        return gmp.mpq_equal(this.mpq_t, RationalFn(val).mpq_t) !== 0;
      } else {
        return gmp.mpq_equal(this.mpq_t, val.mpq_t) !== 0;
      }
    },

    lessThan(val: Rational | number) {
      if (typeof val === 'number') {
        return gmp.mpq_cmp(this.mpq_t, RationalFn(val).mpq_t) < 0;
      } else {
        return gmp.mpq_cmp(this.mpq_t, val.mpq_t) < 0;
      }
    },

    greaterThan(val: Rational | number) {
      if (typeof val === 'number') {
        return gmp.mpq_cmp(this.mpq_t, RationalFn(val).mpq_t) > 0;
      } else {
        return gmp.mpq_cmp(this.mpq_t, val.mpq_t) > 0;
      }
    },

    sign() {
      return gmp.mpq_sgn(this.mpq_t);
    },

    toNumber() {
      return gmp.mpq_get_d(this.mpq_t);
    },

    toString() {
      const strptr = gmp.mpq_get_str(0, 10, this.mpq_t);
      const endptr = gmp.mem.indexOf(0, strptr);
      const str = decoder.decode(gmp.mem.subarray(strptr, endptr));
      gmp.free(strptr);
      return str;
    },
  };

  const RationalFn = (p1: string | number | Rational, p2?: string | number) => {
    const instance = Object.create(RationalPrototype) as typeof RationalPrototype;
    instance.mpq_t = gmp.mpq_t();
    gmp.mpq_init(instance.mpq_t);

    if (typeof p1 === 'string' || typeof p2 === 'string') {
      const finalString = p2 !== undefined ? `${p1.toString()}/${p2.toString()}` : p1.toString();
      const encoded = encoder.encode(finalString);
      const strptr = gmp.malloc(encoded.length + 1);
      gmp.mem.set(encoded, strptr);
      gmp.mpq_set_str(instance.mpq_t, strptr, 10);
      gmp.free(strptr);
    } else if (typeof p1 === 'number' || typeof p2 === 'number') {
      assertInt32(p1 as number);
      if (p2 !== undefined) {
        assertInt32(p2);
        gmp.mpq_set_si(instance.mpq_t, p1 as number, Math.abs(p2));
        if (p2 < 0) {
          gmp.mpq_neg(instance.mpq_t, instance.mpq_t);
        }
      } else {
        gmp.mpq_set_si(instance.mpq_t, p1 as number, 1);
      }
    } else if (p1?.type === 'rational') {
      gmp.mpq_set(instance.mpq_t, p1.mpq_t);
    }

    gmp.mpq_canonicalize(instance.mpq_t);

    mpq_t_arr.push(instance.mpq_t);

    return instance;
  }

  return {
    Rational: RationalFn,
    destroy: () => mpq_t_arr.forEach(mpq_t => {
      gmp.mpq_clear(mpq_t);
      gmp.mpq_t_free(mpq_t);
    }),
  };
};
