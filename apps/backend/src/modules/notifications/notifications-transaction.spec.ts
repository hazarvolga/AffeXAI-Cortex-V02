import { NotificationsService } from "./notifications.service";
import { Notification } from "./entities/notification.entity";
import { User } from "../users/entities/user.entity";
import { EntityManager, IsNull } from "typeorm";
describe("notification transaction participation", () => {
  const fallback = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const users = {
    findOne: jest.fn(async () => ({ id: "11111111-1111-4111-8111-111111111111", tenantId: "tenant-a" })),
  };
  const notifications = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const manager = {
    queryRunner: { isTransactionActive: true },
    getRepository: jest.fn((entity) =>
      entity === User ? users : notifications,
    ),
  };
  const service = Object.assign(Object.create(NotificationsService.prototype), {
    notificationRepository: fallback,
    userRepository: fallback,
    tenantService: { getTenantContext: () => ({tenantId:"tenant-a",source:"system"}) },
  }) as NotificationsService;
  beforeEach(() => jest.clearAllMocks());
  it("uses transaction repositories for both recipient scope and persisted notification", async () => {
    await service.createNotification(
      { userId: "11111111-1111-4111-8111-111111111111", message: "Escalated", type: "ticket_escalated" },
      manager as unknown as EntityManager,
    );
    expect(manager.getRepository).toHaveBeenCalledWith(User);
    expect(manager.getRepository).toHaveBeenCalledWith(Notification);
    expect(users.findOne).toHaveBeenCalledWith({
      where: { id: "11111111-1111-4111-8111-111111111111", tenantId: "tenant-a", isActive:true, deletedAt:IsNull() },
    });
    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "tenant-a", userId: "11111111-1111-4111-8111-111111111111" }),
    );
    expect(fallback.save).not.toHaveBeenCalled();
  });
  it("rejects a nontransactional supplied manager", async () => {
    await expect(
      service.createNotification(
        { userId: "11111111-1111-4111-8111-111111111111", message: "Escalated", type: "ticket_escalated" },
        {
          ...manager,
          queryRunner: { isTransactionActive: false },
        } as unknown as EntityManager,
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(manager.getRepository).not.toHaveBeenCalled();
  });
  it("propagates persistence failure to the callers transaction", async () => {
    notifications.save.mockRejectedValueOnce(
      new Error("transaction fixture failure"),
    );
    await expect(
      service.createNotification(
        { userId: "11111111-1111-4111-8111-111111111111", message: "Escalated", type: "ticket_escalated" },
        manager as unknown as EntityManager,
      ),
    ).rejects.toThrow("transaction fixture failure");
  });
});
