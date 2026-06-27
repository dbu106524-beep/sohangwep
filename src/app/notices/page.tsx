import { NoticeBoard } from "@/components/notice-board";
import { getNotices } from "@/lib/data";

export default async function NoticesPage() {
  const notices = await getNotices();

  return <NoticeBoard type="notice" notices={notices} />;
}
