import { Suspense } from "react";
import { getDb } from "@/lib/shell";
import LoginClient from "./LoginClient";

export default async function Page() {
  const needsSetup = (await getDb().countUsers()) === 0;

  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LoginClient needsSetup={needsSetup} />
    </Suspense>
  );
}
