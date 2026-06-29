import { PolicyPage } from "@/components/policy-page";
import { getLegalPage } from "@/lib/data";

export default async function PrivacyPage() {
  const page = await getLegalPage("privacy");

  return <PolicyPage title={page.title} description={page.description} content={page.content} />;
}
