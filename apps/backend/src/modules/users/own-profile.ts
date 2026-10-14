import type { UpdateOwnProfileDto } from "./dto/update-own-profile.dto";

const PROFILE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "city",
  "country",
  "address",
  "bio",
] as const;
const METADATA_FIELDS = [
  "customerNumber",
  "schoolName",
  "studentId",
  "isSubscribedToNewsletter",
  "notificationPreferences",
  "newsletterPreferences",
  "customerData",
  "studentData",
] as const;

type ProfileTarget = { metadata?: Record<string, unknown> | null } & Partial<
  Record<(typeof PROFILE_FIELDS)[number], string>
>;

/** Copies only the listed keys that the caller actually sent. */
function pick<K extends string>(
  source: Partial<Record<K, unknown>> | undefined,
  keys: readonly K[],
) {
  return Object.fromEntries(
    keys
      .filter((key) => source?.[key] !== undefined)
      .map((key) => [key, source?.[key]]),
  ) as Partial<Record<K, unknown>>;
}

/**
 * Returns a new user with the self-editable fields applied. Fields outside the
 * allow-lists are ignored even if validation was bypassed (defence in depth).
 */
export function applyOwnProfileUpdate<T extends ProfileTarget>(
  user: T,
  dto: UpdateOwnProfileDto,
): T {
  return {
    ...user,
    ...pick(dto as Record<string, unknown>, PROFILE_FIELDS),
    metadata: {
      ...(user.metadata ?? {}),
      ...pick(
        dto.metadata as Record<string, unknown> | undefined,
        METADATA_FIELDS,
      ),
    },
  };
}
