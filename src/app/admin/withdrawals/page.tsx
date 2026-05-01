import { notFound } from "next/navigation";

export default function AdminWithdrawalsPage() {
  // MVP 운영 방향에서 전문가 출금/지급 관리는 제거했다.
  // 관리자가 직접 접근해도 메뉴가 다시 살아나지 않도록 404로 막는다.
  notFound();
}
