import { NextRequest } from "next/server";
import { GET as getRealmProfileRoute, POST as postRealmProfileRoute } from "../realms/[slug]/profile/route";
import { DEFAULT_REALM_SLUG } from "@/lib/realms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getRealmProfileRoute(req, { params: Promise.resolve({ slug: DEFAULT_REALM_SLUG }) });
}

export async function POST(req: NextRequest) {
  return postRealmProfileRoute(req, { params: Promise.resolve({ slug: DEFAULT_REALM_SLUG }) });
}
