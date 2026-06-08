export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";

// The signed-in user's own profile basics — used by the app shell (sidebar
// avatar) and the profile editor.
export async function GET() {
  const { user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname ?? null,
    avatar_url: profile.avatar_url ?? null,
    phone: profile.phone,
    email: profile.email,
    role: profile.role,
  });
}
