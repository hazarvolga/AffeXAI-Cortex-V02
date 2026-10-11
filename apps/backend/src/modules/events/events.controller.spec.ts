import { GUARDS_METADATA } from "@nestjs/common/constants";
import { JwtAuthGuard } from "../../core/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../core/auth/guards/permissions.guard";
import { PERMISSIONS } from "../../lib/permissions";

jest.mock("./dto/create-event.dto", () => ({
  CreateEventDto: class CreateEventDto {},
}));
jest.mock("./dto/update-event.dto", () => ({
  UpdateEventDto: class UpdateEventDto {},
}));

import { EventsController } from "./events.controller";

describe("EventsController authorization policy", () => {
  it("enforces authentication and granular permissions at the controller boundary", () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      EventsController,
    ) as unknown[];

    expect(guards).toEqual(
      expect.arrayContaining([JwtAuthGuard, PermissionsGuard]),
    );
  });

  it.each([
    ["create", [PERMISSIONS.EVENTS_CREATE]],
    ["findAll", [PERMISSIONS.EVENTS_VIEW]],
    ["getStats", [PERMISSIONS.EVENTS_VIEW]],
    ["findUpcoming", [PERMISSIONS.EVENTS_VIEW]],
    ["findOne", [PERMISSIONS.EVENTS_VIEW]],
    ["update", [PERMISSIONS.EVENTS_UPDATE]],
    ["remove", [PERMISSIONS.EVENTS_DELETE]],
    ["register", [PERMISSIONS.EVENTS_VIEW]],
    [
      "generateCertificates",
      [PERMISSIONS.EVENTS_MANAGE_ATTENDEES, PERMISSIONS.CERTIFICATES_CREATE],
    ],
    ["getCertificateStats", [PERMISSIONS.CERTIFICATES_VIEW]],
    ["getEventCertificates", [PERMISSIONS.CERTIFICATES_VIEW]],
    ["sendInvitation", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["sendReminder", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["sendCancellation", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["sendUpdate", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["sendBulkReminder", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["getRegistrations", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
    ["updateRegistrationStatus", [PERMISSIONS.EVENTS_MANAGE_ATTENDEES]],
  ] as const)("%s requires %j", (method, expectedPermissions) => {
    const permissions = Reflect.getMetadata(
      "permissions",
      EventsController.prototype[method],
    );

    expect(permissions).toEqual(expectedPermissions);
  });
});
