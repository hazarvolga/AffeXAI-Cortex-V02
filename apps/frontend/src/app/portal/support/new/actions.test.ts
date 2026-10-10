import { analyzeSupportTicket, FormState } from "./actions";
import { cookies } from "next/headers";
jest.mock("next/headers", () => ({ cookies: jest.fn() }));
const fixtureId = "00000000-0000-4000-8000-000000000001";
const state: FormState = { step: 1, message: "" };
const form = (create = false) => {
  const data = new FormData();
  data.set("title", "A valid support title");
  data.set(
    "problemDescription",
    "A sufficiently detailed support description for validating the issue.",
  );
  data.set("category", fixtureId);
  data.set("priority", "medium");
  data.set("attachmentIds", JSON.stringify([fixtureId]));
  if (create) {
    data.set("action", "create_ticket");
    data.set("summary", "Verified form summary");
  }
  return data;
};
describe("Support wizard verified actor transport", () => {
  const original = global.fetch;
  beforeEach(() => {
    jest.clearAllMocks();
    (cookies as jest.Mock).mockResolvedValue({
      get: (name: string) =>
        name === "auth_token" ? { value: "test-access-token" } : undefined,
    });
    global.fetch = jest.fn(async () =>
      Response.json({
        success: true,
        data: {
          id: "ticket",
          analysisAvailable: true,
          summary: "summary",
          priority: "medium",
          suggestion: "suggestion",
        },
      }),
    );
  });
  afterAll(() => {
    global.fetch = original;
  });
  it.each([false, true])(
    "passes cookie bearer to authenticated ticket route, create=%s",
    async (create) => {
      const result = await analyzeSupportTicket(state, form(create));
      expect(result.message).not.toMatch(/hata|error/i);
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toMatch(
        create ? /\/api\/tickets$/ : /\/api\/tickets\/analyze$/,
      );
      expect(init.headers.Authorization).toBe("Bearer test-access-token");
      expect(init.cache).toBe("no-store");
      const payload = JSON.parse(init.body);
      expect(payload.userId).toBeUndefined();
      expect(payload.tenantId).toBeUndefined();
      if (create) expect(payload.attachmentIds).toEqual([fixtureId]);
    },
  );
  it("rejects missing session without provider or ticket request", async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });
    const result = await analyzeSupportTicket(state, form(true));
    expect(result.ticketCreated).not.toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("validates creation fields and attachment identity before network", async () => {
    const data = form(true);
    data.set("attachmentIds", '["foreign"]');
    const result = await analyzeSupportTicket(state, data);
    expect(result.ticketCreated).not.toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("keeps attachment IDs in analysis state and handles unwrapped response", async () => {
    global.fetch = jest.fn(async () =>
      Response.json({
        analysisAvailable: true,
          summary: "summary",
        priority: "medium",
        suggestion: "suggestion",
      }),
    );
    const result = await analyzeSupportTicket(state, form());
    expect(result.originalInput?.attachmentIds).toEqual([fixtureId]);
    expect(result.data?.summary).toBe("summary");
  });
  it.each([false, undefined])("does not invent analysis when availability is %s", async (analysisAvailable) => {
    global.fetch = jest.fn(async () => Response.json({analysisAvailable,summary:"Fallback",priority:"medium",suggestion:"Fallback"}));
    const input=form(); input.set("priority","urgent");
    const result=await analyzeSupportTicket(state,input);
    expect(result.data?.analysisAvailable).toBe(false);
    expect(result.data?.priority).toBe("urgent");
    expect(result.message).not.toBe("Analiz başarılı!");
    expect(result.originalInput?.priority).toBe("urgent");
  });

});
