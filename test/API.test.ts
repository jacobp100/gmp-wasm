/* global test, expect */
import { precisionToBits } from "../src";

test("precisionToBits()", () => {
  expect(precisionToBits(12)).toBe(40);
});
