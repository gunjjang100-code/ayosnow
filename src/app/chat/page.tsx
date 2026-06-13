import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { PageShell } from "@/components/shared/page-shell";
import { getSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  const sessionUser = await getSessionUser();
  const params = await searchParams;

  return (
    <PageShell
      eyebrow={text.chatEyebrow}
      title={text.chatTitle}
      description={text.chatDescription}
    >
      <ChatWorkspace
        locale={locale}
        initialConversationId={params.conversationId}
        enabled={Boolean(sessionUser)}
        text={{
          chatListTitle: text.chatListTitle,
          chatNewMessage: text.chatNewMessage,
          chatInputPlaceholder: text.chatInputPlaceholder,
          chatSendButton: text.chatSendButton,
          chatSending: text.chatSending,
          chatImageButton: text.chatImageButton,
          chatEmptyTitle: text.chatEmptyTitle,
          chatEmptyDescription: text.chatEmptyDescription,
          chatLoading: text.chatLoading,
          chatLoadError: text.chatLoadError,
          chatImagePreview: text.chatImagePreview,
          chatRemoveImage: text.chatRemoveImage,
          chatReadLabel: text.chatReadLabel,
          chatSentLabel: text.chatSentLabel,
          chatNoMessages: text.chatNoMessages,
          chatJobInfoLabel: text.chatJobInfoLabel,
          chatNoConversationSelected: text.chatNoConversationSelected,
          chatBookingStatusLabel: text.chatBookingStatusLabel,
          chatOpenBookingDetail: text.chatOpenBookingDetail,
          chatSourceLiveTitle: locale === "ko" ? "내 대화 목록" : locale === "fil" ? "Aking mga usapan" : "My conversations",
          chatSourceLiveDescription:
            locale === "ko"
              ? "견적 선택이나 예약이 연결되면 작업별 대화가 이곳에 표시됩니다."
              : locale === "fil"
                ? "Kapag may quote o booking na nakakabit, lalabas dito ang usapan para sa bawat trabaho."
                : "Conversations for selected quotes and bookings will appear here.",
        }}
      />
    </PageShell>
  );
}
