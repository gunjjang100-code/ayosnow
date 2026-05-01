import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { PageShell } from "@/components/shared/page-shell";
import { getDemoSessionUser } from "@/lib/auth/session";
import { copy } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/i18n-server";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const locale = await getCurrentLocale();
  const text = copy[locale];
  await getDemoSessionUser();
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
        initialConversationSource="database"
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
          chatSourceLiveTitle: locale === "ko" ? "실제 채팅 목록을 먼저 보여주고 있습니다." : locale === "fil" ? "Ipinapakita muna ang totoong chat list." : "Real chat conversations are shown first.",
          chatSourceLiveDescription:
            locale === "ko"
              ? "현재 계정으로 실제 대화를 먼저 읽었습니다. 실제 대화가 있으면 예시 채팅보다 그 목록을 우선 보여줍니다."
              : locale === "fil"
                ? "Binasa muna ang totoong conversations ng kasalukuyang account. Kapag may totoong usapan, iyon ang inuuna bago ang demo previews."
                : "The page checked real conversations for the current account first. When real chats exist, they are shown before any demo previews.",
          chatSourceDemoTitle:
            locale === "ko"
              ? "데모 채팅 목록을 보여주고 있습니다."
              : locale === "fil"
                ? "Demo chat list ang ipinapakita ngayon."
                : "Demo chat previews are currently shown.",
          chatSourceDemoDescription:
            locale === "ko"
              ? "아직 실제 대화가 없거나 데이터 연결이 되지 않아, 대화 목록이 비어 있을 수 있습니다."
              : locale === "fil"
                ? "Kapag wala pang totoong usapan o hindi makakonekta sa DB, sample work chats muna ang ipinapakita para makita ang flow."
                : "When real conversations are not available yet or the DB cannot be reached, sample work chats are shown so the flow can still be reviewed.",
          chatDemoReadonlyHint:
            locale === "ko"
              ? "이 대화는 데모 미리보기라서 메시지 전송은 막혀 있습니다."
              : locale === "fil"
                ? "Demo preview lang ito kaya naka-block ang pagpapadala ng mensahe."
                : "This conversation is a demo preview, so sending messages is disabled.",
        }}
      />
    </PageShell>
  );
}
