import assert from "node:assert/strict";
import { test } from "node:test";
import { createNotifier, type BaseToast } from "./notify";

function fakeBase() {
  const shown: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];
  const dismissed: string[] = [];
  let next = 0;
  const base: BaseToast = (payload) => {
    const id = `t${(next += 1)}`;
    shown.push({ ...payload, id });
    return {
      id,
      dismiss: () => dismissed.push(id),
      update: (update) => updates.push(update),
    };
  };
  return { base, shown, updates, dismissed };
}

test("errors render as destructive toasts, successes as default", () => {
  const { base, shown } = fakeBase();
  const toast = createNotifier(base);
  toast.success("Kaydedildi");
  toast.error("Kaydedilemedi", { description: "Bağlantı hatası" });
  assert.equal(shown[0].variant, "default");
  assert.equal(shown[1].variant, "destructive");
  assert.equal(shown[1].description, "Bağlantı hatası");
});

test("re-using an id updates the same toast and dismiss closes it", () => {
  const { base, shown, updates, dismissed } = fakeBase();
  const toast = createNotifier(base);
  toast.loading("Bağlanıyor…", { id: "connect" });
  toast.success("Bağlandı", { id: "connect" });
  assert.equal(shown.length, 1);
  assert.equal(updates[0].title, "Bağlandı");
  toast.dismiss("connect");
  assert.deepEqual(dismissed, ["t1"]);
});

test("promise shows loading, then the resolved message on the same toast", async () => {
  const { base, shown, updates } = fakeBase();
  const toast = createNotifier(base);
  const value = await toast.promise(Promise.resolve(3), {
    loading: "Test ediliyor…",
    success: (n) => `${n} hedef erişilebilir`,
    error: "Başarısız",
  });
  assert.equal(value, 3);
  assert.equal(shown[0].title, "Test ediliyor…");
  assert.equal(updates[0].title, "3 hedef erişilebilir");
});

test("a rejected promise ends as a destructive toast and still rejects", async () => {
  const { base, updates } = fakeBase();
  const toast = createNotifier(base);
  await assert.rejects(
    toast.promise(Promise.reject(new Error("x")), {
      loading: "…",
      success: "ok",
      error: "Başarısız",
    }),
  );
  assert.equal(updates[0].variant, "destructive");
  assert.equal(updates[0].title, "Başarısız");
});

test("dismiss without an id closes every open toast", () => {
  const { base, dismissed } = fakeBase();
  const toast = createNotifier(base);
  toast.info("A");
  toast.warning("B");
  toast.dismiss();
  assert.equal(dismissed.length, 2);
});
