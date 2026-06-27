import { NoticeBoard } from "@/components/notice-board";
import { getNotices } from "@/lib/data";

export default async function UpdatesPage() {
  const notices = await getNotices();

  return <NoticeBoard type="update" notices={notices} />;
}
