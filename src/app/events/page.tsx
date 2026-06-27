import { NoticeBoard } from "@/components/notice-board";
import { getNotices } from "@/lib/data";

export default async function EventsPage() {
  const notices = await getNotices();

  return <NoticeBoard type="event" notices={notices} />;
}
