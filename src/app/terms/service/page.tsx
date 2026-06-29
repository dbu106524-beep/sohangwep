import { PolicyPage } from "@/components/policy-page";
import { getLegalPage } from "@/lib/data";

export default async function ServiceTermsPage() {
  const page = await getLegalPage("service");

  return <PolicyPage title={page.title} description={page.description} content={page.content} />;
}
