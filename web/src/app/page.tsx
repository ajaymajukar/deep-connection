import { redirect } from "next/navigation";
import { DEFAULT_REALM_SLUG } from "@/lib/realms";

export default function RootPage() {
  redirect(`/${DEFAULT_REALM_SLUG}/story`);
}
