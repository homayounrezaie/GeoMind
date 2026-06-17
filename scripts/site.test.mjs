import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../js/site.js", import.meta.url), "utf8");
const noop = () => {};
const mediaQuery = { matches: false, addEventListener: noop, removeEventListener: noop };
const context = {
  document: {
    currentScript: { src: "file:///site.js" },
    addEventListener: noop,
    querySelectorAll: () => [],
  },
  window: {
    location: { href: "http://localhost/" },
    matchMedia: () => mediaQuery,
    addEventListener: noop,
  },
  console,
};
vm.createContext(context);
vm.runInContext(code, context);

test("getDatasetItems unwraps the {datasets} envelope", () => {
  assert.deepEqual(context.getDatasetItems({ datasets: [{ id: "a" }] }), [{ id: "a" }]);
});

test("getDatasetItems passes a bare array through", () => {
  assert.deepEqual(context.getDatasetItems([{ id: "a" }]), [{ id: "a" }]);
});

test("getDatasetItems returns [] for empty/unknown payloads", () => {
  const fromEmpty = context.getDatasetItems({});
  const fromNull = context.getDatasetItems(null);
  assert.ok(Array.isArray(fromEmpty) && fromEmpty.length === 0);
  assert.ok(Array.isArray(fromNull) && fromNull.length === 0);
});

test("getDatasetLead prefers summary", () => {
  assert.equal(context.getDatasetLead({ summary: "S", description: "D" }), "S");
  assert.equal(context.getDatasetLead({ description: "D" }), "");
});
