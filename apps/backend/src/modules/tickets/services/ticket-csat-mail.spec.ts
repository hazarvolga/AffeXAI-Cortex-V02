import { TicketEmailService } from "./ticket-email.service";
import { Ticket } from "../entities/ticket.entity";
import { User } from "../../users/entities/user.entity";

const customer = {
  id: "00000000-0000-4000-8000-000000000010",
  tenantId: "tenant-a",
  email: "customer@example.test",
  firstName: "Customer",
  lastName: "A",
  isActive: true,
} as User;

const ticket = {
  id: "00000000-0000-4000-8000-000000000020",
  tenantId: "tenant-a",
  userId: customer.id,
  subject: "Issue",
  user: customer,
} as Ticket;

describe("CSAT delivery failure truth", () => {
  const sendMail = jest.fn();
  const logger = { log: jest.fn(), error: jest.fn() };
  const ticketRepository = { findOne: jest.fn(async () => ticket) };
  const userRepository = { findOne: jest.fn(async () => customer) };
  const service = new TicketEmailService(
    { sendMail } as never,
    {} as never,
    ticketRepository as never,
    {} as never,
    userRepository as never,
  );

  Object.assign(service, {
    baseUrl: "https://tenant.example.test",
    logger,
  });

  beforeEach(() => jest.clearAllMocks());

  it.each([false, undefined])(
    "rejects unconfirmed adapter delivery %s",
    async (success) => {
      sendMail.mockResolvedValue(
        success === undefined ? undefined : { success },
      );
      await expect(
        service.sendTicketResolved(ticket, "a".repeat(64)),
      ).rejects.toMatchObject({ status: 503 });
    },
  );

  it("propagates safe failure without provider details", async () => {
    sendMail.mockRejectedValue(new Error("private-provider-password"));
    await expect(
      service.sendTicketResolved(ticket, "a".repeat(64)),
    ).rejects.toMatchObject({ status: 503 });
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain(
      "private-provider-password",
    );
  });

  it("succeeds only with explicit delivery confirmation and tenant brand", async () => {
    sendMail.mockResolvedValue({ success: true });
    await service.sendTicketResolved(ticket, "a".repeat(64));
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          surveyUrl: expect.stringContaining("/survey/"),
          siteSettings: expect.objectContaining({ siteName: "AffeXAI Cortex" }),
        }),
      }),
      "tenant-a",
    );
  });
});
