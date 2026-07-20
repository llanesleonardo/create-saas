import { redirect } from "next/navigation";
import { getDb } from "@/lib/shell";
import SetupForm from "./SetupForm";

/** One super admin: after first user exists, /setup → /login. */
export default async function SetupPage() {
  if ((await getDb().countUsers()) > 0) {
    redirect("/login");
  }
  return <SetupForm />;
}
