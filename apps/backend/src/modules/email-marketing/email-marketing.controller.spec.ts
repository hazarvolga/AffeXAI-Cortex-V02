import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../core/auth/guards/permissions.guard";
import { PlatformAdminGuard } from "../../core/auth/guards/platform-admin.guard";
import { EmailMarketingController } from "./email-marketing.controller";
import { EmailMarketingService } from "./email-marketing.service";

describe("EmailMarketingController", () => {
  const service = {
    sendEmail: jest.fn(async () => undefined),
    sendCampaignEmail: jest.fn(async () => undefined),
    getQueueStatus: jest.fn(async () => ({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    })),
  };
  const controller = new EmailMarketingController(
    service as unknown as EmailMarketingService,
  );

  it("is guarded by authentication and marketing permission", () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, EmailMarketingController),
    ).toEqual([JwtAuthGuard, PermissionsGuard]);
    expect(
      Reflect.getMetadata("permissions", EmailMarketingController),
    ).toEqual(["marketing.manage"]);
  });

  it("limits the queue status to platform admins", () => {
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        EmailMarketingController.prototype.getQueueStatus,
      ),
    ).toEqual([PlatformAdminGuard]);
  });

  it("delegates sends to the service", async () => {
    await expect(
      controller.sendEmail({ to: "a@b.co", subject: "S", body: "B" }),
    ).resolves.toEqual({ message: "Email queued successfully" });
    expect(service.sendEmail).toHaveBeenCalledWith("a@b.co", "S", "B");
    await controller.sendCampaignEmail({
      to: "a@b.co",
      subject: "S",
      body: "B",
      campaignId: "c1",
      recipientId: "r1",
    });
    expect(service.sendCampaignEmail).toHaveBeenCalledWith(
      "a@b.co",
      "S",
      "B",
      "c1",
      "r1",
    );
  });
});
