import assert from "node:assert/strict";
import { test } from "node:test";
import { toCssColor } from "./css-color";

test("bare HSL channels become hsl(), CSS colours pass through", () => {
  assert.equal(toCssColor("220 9% 39%"), "hsl(220 9% 39%)");
  assert.equal(toCssColor("#ff8c00"), "#ff8c00");
  assert.equal(toCssColor("rgb(0 0 0)"), "rgb(0 0 0)");
});

test("non-string values have no swatch instead of crashing the page", () => {
  assert.equal(toCssColor({ light: "#fff" }), null);
  assert.equal(toCssColor(undefined), null);
  assert.equal(toCssColor("  "), null);
});
