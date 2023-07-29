import {
  Float,
  FloatFactory,
  FloatOptions,
  FloatRoundingMode,
  getFloatContext,
} from "./float";
import { DivMode, Integer, IntegerFactory, getIntegerContext } from "./integer";
import { Rational, RationalFactory, getRationalContext } from "./rational";
import type { WasmInstance } from "./wasmInstance";

export * from "./bindingTypes";
export { DivMode, FloatRoundingMode };

export type {
  FloatOptions,
  Float as FloatType,
  Integer as IntegerType,
  Rational as RationalType,
};

export interface CalculateType {
  Integer: IntegerFactory;
  Rational: RationalFactory;
  Float: FloatFactory;
  Pi: (options?: FloatOptions) => Float;
  EulerConstant: (options?: FloatOptions) => Float;
  EulerNumber: (options?: FloatOptions) => Float;
  Log2: (options?: FloatOptions) => Float;
  Catalan: (options?: FloatOptions) => Float;
}

export interface CalculateOptions extends FloatOptions {}

export function init(
  binding: WasmInstance,
  options?: CalculateOptions
): CalculateType {
  const ctx = {
    intContext: null,
    rationalContext: null,
    floatContext: null,
  };

  ctx.intContext = getIntegerContext(binding, ctx);
  ctx.rationalContext = getRationalContext(binding, ctx);
  ctx.floatContext = getFloatContext(binding, ctx, options);

  return {
    Integer: ctx.intContext.Integer,
    Rational: ctx.rationalContext.Rational,
    Float: ctx.floatContext.Float,
    Pi: ctx.floatContext.Pi,
    EulerConstant: ctx.floatContext.EulerConstant,
    EulerNumber: ctx.floatContext.EulerNumber,
    Log2: ctx.floatContext.Log2,
    Catalan: ctx.floatContext.Catalan,
  };
}

export const precisionToBits = (digits: number) =>
  Math.ceil(digits * 3.3219281); // digits * log2(10)
