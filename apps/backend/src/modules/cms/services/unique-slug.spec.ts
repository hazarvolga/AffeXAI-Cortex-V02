import { uniqueSlug } from "./unique-slug";

describe("uniqueSlug", () => {
  it("slugifies Turkish names instead of dropping their letters", async () => {
    await expect(uniqueSlug("Ürün Kartı", async () => false)).resolves.toBe(
      "urun-karti",
    );
  });

  it("adds the first free counter when the slug is taken", async () => {
    const taken = new Set(["hero", "hero-1"]);
    await expect(
      uniqueSlug("Hero", async (slug) => taken.has(slug)),
    ).resolves.toBe("hero-2");
  });

  it("falls back to a usable slug for names without letters or digits", async () => {
    await expect(uniqueSlug("!!!", async () => false)).resolves.toBe("icerik");
  });
});
