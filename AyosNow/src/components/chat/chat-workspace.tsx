"use client";

import Image from "next/image";
import Link from "next/link";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { ProfessionalBadges } from "@/components/shared/professional-badges";
import { getBookingStatusLabel } from "@/lib/constants/site";
import type { Locale, ProfessionalBadgeSummary } from "@/lib/types";

interface ConversationListItem {
  id: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  partnerRole: "customer" | "tradesman";
  partnerBadges: ProfessionalBadgeSummary[];
  partnerLastSeenAt: string | null;
  isPartnerOnline: boolean;
  jobTitle: string;
  scheduleLabel: string | null;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageType: "text" | "image" | "file" | "system";
  lastMessageAt: string;
}

interface ConversationMessageItem {
  id: string;
  senderId: string | null;
  senderName: string;
  senderAvatarUrl: string | null;
  senderRole: "customer" | "tradesman" | "system";
  messageType: "text" | "image" | "file" | "system";
  content: string;
  imageUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

interface ConversationDetail {
  id: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  partnerBadges: ProfessionalBadgeSummary[];
  partnerLastSeenAt: string | null;
  isPartnerOnline: boolean;
  isPartnerTyping: boolean;
  jobTitle: string;
  scheduleLabel: string | null;
  headerMeta: string | null;
  bookingId: string | null;
  bookingStatus: "pending" | "accepted" | "in-progress" | "completed" | "cancelled" | null;
  requestId: string | null;
  messages: ConversationMessageItem[];
}

interface ChatWorkspaceText {
  chatListTitle: string;
  chatNewMessage: string;
  chatInputPlaceholder: string;
  chatSendButton: string;
  chatSending: string;
  chatImageButton: string;
  chatEmptyTitle: string;
  chatEmptyDescription: string;
  chatLoading: string;
  chatLoadError: string;
  chatImagePreview: string;
  chatRemoveImage: string;
  chatReadLabel: string;
  chatSentLabel: string;
  chatNoMessages: string;
  chatJobInfoLabel: string;
  chatNoConversationSelected: string;
  chatBookingStatusLabel: string;
  chatOpenBookingDetail: string;
  chatSourceLiveTitle: string;
  chatSourceLiveDescription: string;
}

interface ChatWorkspaceProps {
  locale: Locale;
  text: ChatWorkspaceText;
  initialConversationId?: string;
  enabled: boolean;
}

function formatDateTime(value: string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === "fil" ? "fil-PH" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(new Date(value));
}

function Avatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={40}
        height={40}
        unoptimized
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-700">
      {name.slice(0, 1)}
    </div>
  );
}

function getBookingStatusTone(status: ConversationDetail["bookingStatus"]) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "in-progress":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "completed":
      return "border-slate-200 bg-slate-100 text-slate-800";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPresenceLabel(params: {
  locale: Locale;
  isOnline: boolean;
  lastSeenAt: string | null;
}) {
  if (params.isOnline) {
    return "Online";
  }

  if (!params.lastSeenAt) {
    return "Offline";
  }

  const label = formatDateTime(params.lastSeenAt, params.locale);
  return `Last seen ${label}`;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function hasSameSnapshot<T>(current: T, next: T) {
  return JSON.stringify(current) === JSON.stringify(next);
}

export function ChatWorkspace({
  locale,
  text,
  initialConversationId,
  enabled,
}: ChatWorkspaceProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(enabled);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [imageAttachment, setImageAttachment] = useState<{
    dataUrl: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [fileAttachment, setFileAttachment] = useState<{
    dataUrl: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [isSending, startSendingTransition] = useTransition();
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const conversationListRequestSeqRef = useRef(0);
  const conversationRequestSeqRef = useRef(0);

  const activeConversationSummary = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  async function refreshConversations(options: { showLoading?: boolean } = {}) {
    if (!enabled) {
      setIsLoadingList(false);
      return;
    }

    const requestSeq = conversationListRequestSeqRef.current + 1;
    conversationListRequestSeqRef.current = requestSeq;
    const shouldShowLoading = options.showLoading ?? conversations.length === 0;

    if (shouldShowLoading) {
      setIsLoadingList(true);
    }

    try {
      const response = await fetch(`/api/conversations?locale=${locale}`, { cache: "no-store" });
      const result = (await response.json().catch(() => null)) as
        | {
            conversations?: ConversationListItem[];
            source?: "database";
            error?: string;
          }
        | null;

      // A slower, older polling response must not overwrite newer conversation data.
      if (requestSeq !== conversationListRequestSeqRef.current) {
        return;
      }

      if (!response.ok || !result?.conversations) {
        setErrorMessage(result?.error ?? text.chatLoadError);
        if (shouldShowLoading) {
          setIsLoadingList(false);
        }
        return;
      }

      const nextConversations = result.conversations;
      setConversations((current) =>
        hasSameSnapshot(current, nextConversations) ? current : nextConversations,
      );
      setErrorMessage(null);
      setIsLoadingList(false);

      if (!activeConversationId && result.conversations[0]) {
        setActiveConversationId(result.conversations[0].id);
      }
    } catch {
      if (requestSeq !== conversationListRequestSeqRef.current) {
        return;
      }

      setErrorMessage(text.chatLoadError);
      if (shouldShowLoading) {
        setIsLoadingList(false);
      }
    }
  }

  async function refreshConversation(
    conversationId: string,
    options: { showLoading?: boolean } = {},
  ) {
    if (!enabled) {
      return;
    }

    const requestSeq = conversationRequestSeqRef.current + 1;
    conversationRequestSeqRef.current = requestSeq;
    const shouldShowLoading =
      options.showLoading ?? activeConversation?.id !== conversationId;

    if (shouldShowLoading) {
      setIsLoadingConversation(true);
    }

    const response = await fetch(`/api/conversations/${conversationId}?locale=${locale}`, {
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as
      | { conversation?: ConversationDetail; error?: string }
      | null;

    if (requestSeq !== conversationRequestSeqRef.current) {
      return;
    }

    if (!response.ok || !result?.conversation) {
      setErrorMessage(result?.error ?? text.chatLoadError);
      if (shouldShowLoading) {
        setIsLoadingConversation(false);
      }
      return;
    }

    const nextConversation = result.conversation;
    setActiveConversation((current) =>
      hasSameSnapshot(current, nextConversation) ? current : nextConversation,
    );
    setErrorMessage(null);
    setIsLoadingConversation(false);

    const hasUnreadIncomingMessage = nextConversation.messages.some(
      (message) => !message.isMine && message.senderRole !== "system" && !message.readAt,
    );

    if (hasUnreadIncomingMessage) {
      void fetch(`/api/conversations/${conversationId}/read`, {
        method: "PATCH",
      }).then(() => refreshConversations({ showLoading: false }));
    }
  }

  const loadConversationsInEffect = useEffectEvent((showLoading: boolean) => {
    if (!enabled) {
      return;
    }

    void refreshConversations({ showLoading });
  });

  const loadConversationInEffect = useEffectEvent((conversationId: string) => {
    if (!enabled) {
      return;
    }

    void refreshConversation(conversationId, {
      showLoading: activeConversation?.id !== conversationId,
    });
  });

  const refreshActiveConversationSilentlyInEffect = useEffectEvent((conversationId: string) => {
    if (!enabled) {
      return;
    }

    void refreshConversation(conversationId, { showLoading: false });
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    loadConversationsInEffect(true);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !activeConversationId) {
      return;
    }

    loadConversationInEffect(activeConversationId);
  }, [activeConversationId, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = window.setInterval(() => {
      loadConversationsInEffect(false);

      if (activeConversationId) {
        refreshActiveConversationSilentlyInEffect(activeConversationId);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeConversationId, enabled]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages.length]);

  useEffect(() => {
    if (!enabled || !activeConversationId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void fetch(`/api/conversations/${activeConversationId}/typing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTyping: draft.trim().length > 0 }),
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeConversationId, draft, enabled]);

  useEffect(() => {
    return () => {
      if (!activeConversationId) {
        return;
      }

      void fetch(`/api/conversations/${activeConversationId}/typing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTyping: false }),
      });
    };
  }, [activeConversationId]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();

    // This preview URL is only for the local screen before sending.
    // The server API validates and stores the real upload when the message is sent.
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        return;
      }

      setImageAttachment({
        dataUrl: result,
        name: file.name || "chat-image",
        mimeType: file.type || "image/jpeg",
        size: file.size,
      });
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 2_500_000) {
      setErrorMessage(
        locale === "en"
          ? "Files must be 2.5MB or smaller."
          : locale === "fil"
            ? "Hanggang 2.5MB lang ang file."
            : "Files must be 2.5MB or smaller.",
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        return;
      }

      setFileAttachment({
        dataUrl: result,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });
      setErrorMessage(null);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleSend() {
    if (!enabled || !activeConversationId) {
      return;
    }

    startSendingTransition(async () => {
      const response = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: draft,
          imageDataUrl: imageAttachment?.dataUrl,
          imageFileName: imageAttachment?.name,
          fileDataUrl: fileAttachment?.dataUrl,
          fileName: fileAttachment?.name,
          fileMimeType: fileAttachment?.mimeType,
          fileSizeBytes: fileAttachment?.size,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(result?.error ?? text.chatLoadError);
        return;
      }

      setDraft("");
      setImageAttachment(null);
      setFileAttachment(null);
      await fetch(`/api/conversations/${activeConversationId}/typing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTyping: false }),
      });
      setErrorMessage(null);
      await refreshConversation(activeConversationId);
      await refreshConversations({ showLoading: false });
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[0.38fr_0.62fr]">
      <aside className="soft-card flex min-h-[640px] flex-col overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">{text.chatListTitle}</h2>
        </div>

        <div className="border-b border-teal-100 bg-teal-50 px-5 py-4 text-slate-800">
          <p className="text-sm font-bold text-teal-800">{text.chatSourceLiveTitle}</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {text.chatSourceLiveDescription}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingList ? (
            <p className="px-5 py-6 text-sm text-slate-500">{text.chatLoading}</p>
          ) : conversations.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-base font-bold text-slate-950">{text.chatEmptyTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text.chatEmptyDescription}</p>
            </div>
          ) : (
            <div className="grid">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`border-b border-slate-100 px-5 py-4 text-left transition ${
                    activeConversationId === conversation.id ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={conversation.partnerName} imageUrl={conversation.partnerAvatarUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-950">
                            {conversation.partnerName}
                          </p>
                          <div className="mt-1">
                            <ProfessionalBadges badges={conversation.partnerBadges} compact />
                          </div>
                          <p className="mt-1 truncate text-xs font-semibold text-teal-700">
                            {conversation.jobTitle}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatDateTime(conversation.lastMessageAt, locale, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-600">
                        {conversation.lastMessageType === "image" && !conversation.lastMessagePreview
                          ? text.chatImagePreview
                          : conversation.lastMessageType === "file" && !conversation.lastMessagePreview
                            ? "File"
                          : conversation.lastMessagePreview || text.chatNoMessages}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {getPresenceLabel({
                          locale,
                          isOnline: conversation.isPartnerOnline,
                          lastSeenAt: conversation.partnerLastSeenAt,
                        })}
                      </p>
                      {conversation.unreadCount > 0 ? (
                        <span className="mt-3 inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                          {text.chatNewMessage} {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <section className="soft-card flex min-h-[640px] flex-col overflow-hidden p-0">
        {activeConversation ? (
          <>
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    name={activeConversation.partnerName}
                    imageUrl={activeConversation.partnerAvatarUrl}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {text.chatJobInfoLabel}
                    </p>
                    <p className="text-lg font-bold text-slate-950">{activeConversation.jobTitle}</p>
                    <p className="mt-1 text-sm font-semibold text-teal-700">
                      {activeConversation.partnerName}
                    </p>
                    <div className="mt-2">
                      <ProfessionalBadges badges={activeConversation.partnerBadges} compact />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {getPresenceLabel({
                        locale,
                        isOnline: activeConversation.isPartnerOnline,
                        lastSeenAt: activeConversation.partnerLastSeenAt,
                      })}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeConversation.bookingStatus ? (
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getBookingStatusTone(
                            activeConversation.bookingStatus,
                          )}`}
                        >
                          {text.chatBookingStatusLabel}:{" "}
                          {getBookingStatusLabel(locale, activeConversation.bookingStatus)}
                        </span>
                      ) : null}
                      {activeConversation.scheduleLabel ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          {formatDateTime(activeConversation.scheduleLabel, locale)}
                        </span>
                      ) : null}
                      {activeConversation.headerMeta ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          {activeConversation.headerMeta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {activeConversation.bookingId ? (
                  <Link
                    href={`/bookings/${activeConversation.bookingId}`}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                  >
                    {text.chatOpenBookingDetail}
                  </Link>
                ) : null}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {isLoadingConversation ? (
                <p className="text-sm text-slate-500">{text.chatLoading}</p>
              ) : (
                <div className="grid gap-4">
                  {activeConversation.messages.map((message) =>
                    message.senderRole === "system" ? (
                      <div key={message.id} className="flex flex-col items-center gap-2">
                        <div className="mx-auto rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600">
                          {message.content}
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">
                          {formatDateTime(message.createdAt, locale)}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!message.isMine ? (
                          <Avatar name={message.senderName} imageUrl={message.senderAvatarUrl} />
                        ) : null}

                        <div className={`max-w-[78%] ${message.isMine ? "items-end" : "items-start"} flex flex-col`}>
                          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">{message.senderName}</span>
                            <span>{formatDateTime(message.createdAt, locale)}</span>
                            {message.isMine ? (
                              <span className="font-semibold text-teal-700">
                                {message.readAt ? text.chatReadLabel : text.chatSentLabel}
                              </span>
                            ) : null}
                          </div>

                          <div
                            className={`rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                              message.isMine
                                ? "bg-slate-950 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {message.imageUrl ? (
                              <Image
                                src={message.imageUrl}
                                alt={text.chatImagePreview}
                                width={480}
                                height={320}
                                unoptimized
                                className="mb-3 max-h-64 rounded-2xl object-cover"
                              />
                            ) : null}
                            {message.fileUrl ? (
                              <a
                                href={message.fileUrl}
                                download={message.fileName ?? true}
                                className={`mb-3 block rounded-2xl border px-4 py-3 font-bold ${
                                  message.isMine
                                    ? "border-white/20 bg-white/10 text-white"
                                    : "border-slate-200 bg-white text-slate-800"
                                }`}
                              >
                                {message.fileName ?? "File"}
                                <span className="ml-2 text-xs font-semibold opacity-70">
                                  {formatFileSize(message.fileSizeBytes)}
                                </span>
                              </a>
                            ) : null}
                            {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
                          </div>
                        </div>

                        {message.isMine ? (
                          <Avatar name={message.senderName} imageUrl={message.senderAvatarUrl} />
                        ) : null}
                      </div>
                    ),
                  )}
                  {activeConversation.isPartnerTyping ? (
                    <div className="flex justify-start">
                      <div className="rounded-full bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700">
                        {locale === "en"
                          ? `${activeConversation.partnerName} is typing...`
                          : locale === "fil"
                            ? `Nagta-type si ${activeConversation.partnerName}...`
                            : `${activeConversation.partnerName} is typing...`}
                      </div>
                    </div>
                  ) : null}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              {imageAttachment ? (
                <div className="mb-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{text.chatImagePreview}</p>
                  <Image
                    src={imageAttachment.dataUrl}
                    alt={text.chatImagePreview}
                    width={480}
                    height={320}
                    unoptimized
                    className="mt-2 max-h-52 rounded-2xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageAttachment(null)}
                    className="mt-3 text-xs font-bold text-rose-600"
                  >
                    {text.chatRemoveImage}
                  </button>
                </div>
              ) : null}

              {fileAttachment ? (
                <div className="mb-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">
                    File preview
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
                    <div>
                      <p className="font-bold text-slate-950">{fileAttachment.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {fileAttachment.mimeType} · {formatFileSize(fileAttachment.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFileAttachment(null)}
                      className="text-xs font-bold text-rose-600"
                    >
                      {text.chatRemoveImage}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-3xl border border-slate-200 bg-white p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={text.chatInputPlaceholder}
                  rows={3}
                  className="min-h-24 w-full resize-none bg-transparent text-sm text-slate-700 outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span>{text.chatImageButton}</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span>Attach file</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending || (!draft.trim() && !imageAttachment && !fileAttachment)}
                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSending ? text.chatSending : text.chatSendButton}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-lg font-bold text-slate-950">{text.chatNoConversationSelected}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeConversationSummary?.jobTitle ?? text.chatEmptyDescription}
              </p>
            </div>
          </div>
        )}
      </section>

      {errorMessage ? (
        <p className="text-sm font-medium text-rose-600 lg:col-span-2">{errorMessage}</p>
      ) : null}
    </section>
  );
}
