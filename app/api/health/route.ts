import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Which commit is actually serving traffic. Netlify has silently skipped builds
// on this site before, and the workaround was probing a new route for 404 vs 401
// to guess whether a deploy landed — this answers it directly.
// Public on purpose: it exposes nothing but a commit hash and a build timestamp.
export async function GET() {
  return NextResponse.json({
    ok: true,
    commit: process.env.BUILD_COMMIT_REF ?? "unknown",
    builtAt: process.env.BUILD_TIME ?? "unknown",
  });
}
