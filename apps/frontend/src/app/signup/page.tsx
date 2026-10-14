import { redirect } from "next/navigation";

/**
 * Self-serve sign-up is closed (decision D4): new organisations apply for early
 * access, invited people join through /accept-invitation.
 */
export default function SignupPage(): never {
  redirect("/erken-erisim");
}
