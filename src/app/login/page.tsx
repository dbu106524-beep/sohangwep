import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/login-panel";
import { getCurrentUser } from "@/lib/auth";
import { normalizeNextPath } from "@/lib/routes";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = normalizeNextPath(params.next);
  const user = await getCurrentUser();

  if (user) {
    redirect(nextPath);
  }

  return (
    <main>
      <LoginPanel nextPath={nextPath} hasError={params.error === "auth"} />
    </main>
  );
}

