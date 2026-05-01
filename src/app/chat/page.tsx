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
  await getSessionUser();
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
          chatSourceLiveTitle: locale === "ko" ? "실제 채팅 목록을 보여주고 있습니다." : locale === "fil" ? "Ipinapakita ang totoong chat list." : "Real chat conversations are shown.",
          chatSourceLiveDescription:
            locale === "ko"
              ? "현재 계정으로 저장된 실제 대화만 읽습니다. 아직 대화가 없으면 빈 상태를 보여줍니다."
              : locale === "fil"
                ? "Totoong conversations lang ng kasalukuyang account ang binabasa. Kapag wala pa, empty state ang makikita."
                : "Only saved conversations for the current account are loaded. If there are none yet, the page shows an empty state.",
        }}
      />
    </PageShell>
  );
}
