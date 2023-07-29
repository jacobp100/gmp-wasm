/* global test, expect */
import { readFile } from "fs/promises";
import { resolve } from "path";
import { CalculateType, FloatRoundingMode, init } from "../src";
import { mpfr_rnd_t } from "../src/bindingTypes";
import { createWasmInstance } from "../src/wasmInstance";

type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
let instance: Awaited<ReturnType<typeof createWasmInstance>>;
let ctx: CalculateType = null;

beforeAll(async () => {
  const wasm = await readFile(resolve("wasm/gmp.wasm"));
  instance = await createWasmInstance(
    new Response(wasm, {
      headers: { "Content-Type": "application/wasm" },
    })
  );
  ctx = init(instance, { precisionBits: 16 });
});

test("addition", () => {
  // Create first number and initialize it to 30
  const num1Ptr = instance.mpz_t();
  instance.mpz_init_set_si(num1Ptr, 30);
  // Create second number from string. The string needs to be copied into WASM memory
  const num2Ptr = instance.mpz_t();
  const strPtr = instance.malloc_cstr("40");
  instance.mpz_init_set_str(num2Ptr, strPtr, 10);
  // Calculate num1Ptr + num2Ptr, store the result in num1Ptr
  instance.mpz_add(num1Ptr, num1Ptr, num2Ptr);
  // Get result as integer
  expect(instance.mpz_get_si(num1Ptr)).toBe(70);
  // Deallocate memory
  instance.free(strPtr);
  instance.mpz_clears(num1Ptr, num2Ptr);
  instance.mpz_t_frees(num1Ptr, num2Ptr);
});

test.skip("allocate a lot of objects", async () => {
  // @ts-expect-error
  const initLength = instance.heap.HEAP8.length;
  // 128 MB
  for (let i = 0; i < 128; i++) {
    instance.malloc(1024 * 1024);
  }
  // @ts-expect-error
  expect(instance.heap.HEAP8.length).toBeGreaterThan(initLength);
  // deallocate all memory
  await instance.reset();
  // @ts-expect-error
  expect(instance.heap.HEAP8.length).toBe(initLength);
});

test("has 64 bit instance", () => {
  expect(instance.mp_bits_per_limb()).toBe(64);
});

test("instance has macros", () => {
  const { mpq_t } = ctx.Rational(3, 4);
  expect(instance.mpz_get_si(instance.mpq_numref(mpq_t))).toBe(3);
  expect(instance.mpz_get_si(instance.mpq_denref(mpq_t))).toBe(4);
});

test.skip("mpfr_to_string()", () => {
  const getPi = (prec) => {
    const pi = ctx.Pi({
      precisionBits: prec,
      roundingMode: FloatRoundingMode.ROUND_TO_ZERO,
    });
    console.log(Math.floor((prec * Math.log2(2)) / Math.log2(10)));
    console.log(pi.nextBelow().toString());
    console.log(pi.toString());
    console.log(pi.toString(10, true));
    console.log(pi.nextAbove().toString());
    return instance.mpfr_to_string(pi.mpfr_t, 10, mpfr_rnd_t.MPFR_RNDZ, true);
  };

  const max = 10000;
  const ref = getPi(max);
  for (let i = 10; i < max; i++) {
    expect(ref).toContain(getPi(i));
  }
});
