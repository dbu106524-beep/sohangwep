import { PolicyPage } from "@/components/policy-page";
import { getLegalPage } from "@/lib/data";

export default async function RefundPage() {
  const page = await getLegalPage("refund");

  return <PolicyPage title={page.title} description={page.description} content={page.content} />;
}
