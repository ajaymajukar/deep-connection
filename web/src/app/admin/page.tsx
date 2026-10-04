import { redirect } from "next/navigation";
import { DEFAULT_REALM_SLUG } from "@/lib/realms";

export default function AdminRedirect() {
  redirect(`/${DEFAULT_REALM_SLUG}/admin`);
}
