import { applyOwnProfileUpdate } from "./own-profile";

const user = {
  id: "u-1",
  tenantId: "acme",
  email: "kisi@acme.test",
  roleId: "role-customer",
  isActive: true,
  firstName: "Eski",
  lastName: "Ad",
  phone: "1",
  city: "",
  metadata: { isCustomer: true, customerNumber: "C-1" },
};

describe("applyOwnProfileUpdate", () => {
  it("updates only the provided profile fields and returns a new object", () => {
    const next = applyOwnProfileUpdate(user, {
      firstName: "Yeni",
      city: "İzmir",
    });
    expect(next).not.toBe(user);
    expect(next.firstName).toBe("Yeni");
    expect(next.city).toBe("İzmir");
    expect(next.lastName).toBe("Ad");
    expect(user.firstName).toBe("Eski");
  });

  it("merges metadata so keys the user cannot edit survive", () => {
    const next = applyOwnProfileUpdate(user, {
      metadata: {
        notificationPreferences: { email: false, sms: true, push: false },
      },
    });
    expect(next.metadata).toEqual({
      isCustomer: true,
      customerNumber: "C-1",
      notificationPreferences: { email: false, sms: true, push: false },
    });
  });

  it("never copies identity, role, status or tenant fields even if they slip through", () => {
    const hostile = {
      firstName: "X",
      email: "baska@acme.test",
      roleId: "role-admin",
      isActive: false,
      tenantId: "other",
      metadata: { isCustomer: false },
    } as unknown as Parameters<typeof applyOwnProfileUpdate>[1];
    const next = applyOwnProfileUpdate(user, hostile);
    expect(next.email).toBe("kisi@acme.test");
    expect(next.roleId).toBe("role-customer");
    expect(next.isActive).toBe(true);
    expect(next.tenantId).toBe("acme");
    expect(next.metadata.isCustomer).toBe(true);
  });
});
