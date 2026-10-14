import { redirect } from "next/navigation";

/** The portal shares the single sign-in page. */
export default function PortalLoginPage(): never {
  redirect("/login");
}
