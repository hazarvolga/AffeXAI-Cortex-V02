import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Queue } from "bullmq";
import { TenantService } from "../../core/tenant/tenant.service";
import { EmailDispatchPolicy } from "./email-dispatch-policy";
import { EmailMarketingService } from "./email-marketing.service";

function setup(tenant: string | null = "tenant-a") {
  const queue = {
    add: jest.fn(async () => ({ id: "job-1" })),
    getJobCounts: jest.fn(async () => ({
      waiting: 2,
      active: 1,
      completed: 40,
    })),
  };
  const policy = { authorize: jest.fn(async () => "sub-1") };
  const service = new EmailMarketingService(
    queue as unknown as Queue,
    { getTenantId: () => tenant } as unknown as TenantService,
    policy as unknown as EmailDispatchPolicy,
  );
  return { service, queue, policy };
}

describe("EmailMarketingService", () => {
  it("queues a tenant email only after the dispatch policy allows it", async () => {
    const { service, queue, policy } = setup();
    await service.sendEmail("ada@example.com", "Hi", "<p>Hello</p>");
    expect(policy.authorize).toHaveBeenCalledWith("tenant-a", {
      to: "ada@example.com",
    });
    expect(queue.add).toHaveBeenCalledWith("sendEmail", {
      to: "ada@example.com",
      subject: "Hi",
      body: "<p>Hello</p>",
      tenantId: "tenant-a",
    });
  });

  it("checks the campaign recipient before queueing a campaign email", async () => {
    const { service, queue, policy } = setup();
    await service.sendCampaignEmail(
      "ada@example.com",
      "S",
      "B",
      "camp-1",
      "sub-1",
    );
    expect(policy.authorize).toHaveBeenCalledWith("tenant-a", {
      to: "ada@example.com",
      campaignId: "camp-1",
      recipientId: "sub-1",
    });
    expect(queue.add).toHaveBeenCalledWith(
      "sendCampaignEmail",
      expect.objectContaining({ campaignId: "camp-1", tenantId: "tenant-a" }),
    );
  });

  it("queues nothing when consent is missing", async () => {
    const { service, queue, policy } = setup();
    policy.authorize.mockRejectedValueOnce(
      new ForbiddenException("Marketing consent is not active"),
    );
    await expect(service.sendEmail("x@example.com", "S", "B")).rejects.toThrow(
      ForbiddenException,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("requires a tenant context", async () => {
    const { service, queue } = setup(null);
    await expect(service.sendEmail("x@example.com", "S", "B")).rejects.toThrow(
      UnauthorizedException,
    );
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("reports queue counts without loading jobs, defaulting missing states to zero", async () => {
    const { service, queue } = setup();
    await expect(service.getQueueStatus()).resolves.toEqual({
      waiting: 2,
      active: 1,
      completed: 40,
      failed: 0,
    });
    expect(queue.getJobCounts).toHaveBeenCalledWith(
      "waiting",
      "active",
      "completed",
      "failed",
    );
  });
});
