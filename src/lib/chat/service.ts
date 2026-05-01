import {
  MessageSenderRole,
  MessageType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BookingStatus, Locale } from "@/lib/types";

type ConversationRecord = Prisma.ConversationGetPayload<{
  include: {
    customer: true;
    tradesman: true;
    request: {
      include: {
        category: true;
      };
    };
    quote: {
      include: {
        quoteRequest: {
          include: {
            category: true;
          };
        };
        tradesman: true;
      };
    };
    booking: {
      include: {
        service: true;
        quoteRequest: {
          include: {
            category: true;
          };
        };
        tradesman: true;
      };
    };
    messages: {
      include: {
        sender: true;
      };
      orderBy: {
        createdAt: "asc";
      };
    };
  };
}>;

const conversationInclude = {
  customer: true,
  tradesman: true,
  request: {
    include: {
      category: true,
    },
  },
  quote: {
    include: {
      quoteRequest: {
        include: {
          category: true,
        },
      },
      tradesman: true,
    },
  },
  booking: {
    include: {
      service: true,
      quoteRequest: {
        include: {
          category: true,
        },
      },
      tradesman: true,
    },
  },
  messages: {
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
} satisfies Prisma.ConversationInclude;

export interface ConversationListItem {
  id: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  partnerRole: "customer" | "tradesman";
  jobTitle: string;
  scheduleLabel: string | null;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageType: "text" | "image" | "system";
  lastMessageAt: string;
  bookingId: string | null;
  requestId: string | null;
}

export interface ConversationMessageItem {
  id: string;
  senderId: string | null;
  senderName: string;
  senderAvatarUrl: string | null;
  senderRole: "customer" | "tradesman" | "system";
  messageType: "text" | "image" | "system";
  content: string;
  imageUrl: string | null;
  createdAt: string;
  readAt: string | null;
  isMine: boolean;
}

export interface ConversationDetail {
  id: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  jobTitle: string;
  scheduleLabel: string | null;
  headerMeta: string | null;
  bookingId: string | null;
  bookingStatus: BookingStatus | null;
  requestId: string | null;
  messages: ConversationMessageItem[];
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function getConversationJobTitle(conversation: ConversationRecord) {
  return (
    conversation.booking?.service?.title ??
    conversation.booking?.quoteRequest?.title ??
    conversation.quote?.quoteRequest.title ??
    conversation.request?.title ??
    "Job conversation"
  );
}

function getConversationScheduleLabel(conversation: ConversationRecord) {
  const candidateDate =
    conversation.booking?.scheduledAt ??
    conversation.quote?.visitDate ??
    conversation.request?.targetDate;

  return candidateDate ? candidateDate.toISOString() : null;
}

function getConversationHeaderMeta(conversation: ConversationRecord) {
  if (conversation.booking) {
    return conversation.booking.workAddress;
  }

  if (conversation.request) {
    return `${conversation.request.city} · ${conversation.request.category.name}`;
  }

  if (conversation.quote?.quoteRequest) {
    return `${conversation.quote.quoteRequest.city} · ${conversation.quote.quoteRequest.category.name}`;
  }

  return null;
}

function toUiBookingStatus(status: string | null | undefined) {
  if (!status) {
    return null;
  }

  // 채팅 화면은 Prisma의 대문자 enum을 그대로 보여주기보다,
  // 다른 화면과 같은 소문자 상태값으로 맞춰야 한눈에 이해하기 쉽다.
  switch (status) {
    case "PENDING":
      return "pending";
    case "ACCEPTED":
      return "accepted";
    case "IN_PROGRESS":
      return "in-progress";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return null;
  }
}

function isConversationParticipant(
  conversation: {
    customerId: string;
    tradesmanId: string;
  },
  userId: string,
) {
  return conversation.customerId === userId || conversation.tradesmanId === userId;
}

function getSenderRoleForConversation(
  conversation: {
    customerId: string;
    tradesmanId: string;
  },
  userId: string,
): MessageSenderRole {
  return conversation.customerId === userId
    ? MessageSenderRole.CUSTOMER
    : MessageSenderRole.TRADESMAN;
}

function getPartnerForUser(conversation: ConversationRecord, userId: string) {
  if (conversation.customerId === userId) {
    return {
      name: conversation.tradesman.fullName,
      avatarUrl: conversation.tradesman.avatarUrl,
      role: "tradesman" as const,
    };
  }

  return {
    name: conversation.customer.fullName,
    avatarUrl: conversation.customer.avatarUrl,
    role: "customer" as const,
  };
}

function getMessagePreview(message: ConversationRecord["messages"][number] | undefined) {
  if (!message) {
    return "";
  }

  if (message.messageType === MessageType.IMAGE) {
    return message.content.trim() || "Image";
  }

  return message.content;
}

function mapConversationMessage(
  message: ConversationRecord["messages"][number],
  currentUserId: string,
): ConversationMessageItem {
  return {
    id: message.id,
    senderId: message.senderId,
    senderName:
      message.senderRole === MessageSenderRole.SYSTEM
        ? "System"
        : message.sender?.fullName ?? "Unknown",
    senderAvatarUrl:
      message.senderRole === MessageSenderRole.SYSTEM ? null : message.sender?.avatarUrl ?? null,
    senderRole:
      message.senderRole === MessageSenderRole.CUSTOMER
        ? "customer"
        : message.senderRole === MessageSenderRole.TRADESMAN
          ? "tradesman"
          : "system",
    messageType:
      message.messageType === MessageType.TEXT
        ? "text"
        : message.messageType === MessageType.IMAGE
          ? "image"
          : "system",
    content: message.content,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
    readAt: toIso(message.readAt),
    isMine: message.senderId === currentUserId,
  };
}

export async function getOrCreateConversationForBooking(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
  });

  if (!booking) {
    throw new Error("연결할 예약을 찾지 못했습니다.");
  }

  if (
    params.actorUserId !== booking.customerId &&
    params.actorUserId !== booking.tradesmanId
  ) {
    throw new Error("이 예약 채팅에 접근할 권한이 없습니다.");
  }

  const existing = await prisma.conversation.findUnique({
    where: { bookingId: booking.id },
  });

  if (existing) {
    return existing;
  }

  return prisma.conversation.create({
    data: {
      customerId: booking.customerId,
      tradesmanId: booking.tradesmanId,
      bookingId: booking.id,
      quoteId: booking.quoteId,
      requestId: booking.quoteRequestId,
    },
  });
}

export async function appendSystemMessageToConversation(params: {
  conversationId: string;
  content: string;
}) {
  const now = new Date();

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: params.conversationId,
        senderRole: MessageSenderRole.SYSTEM,
        messageType: MessageType.SYSTEM,
        content: params.content,
      },
    }),
    prisma.conversation.update({
      where: { id: params.conversationId },
      data: {
        updatedAt: now,
      },
    }),
  ]);

  return message;
}

export async function appendSystemMessageToBookingConversation(params: {
  bookingId: string;
  actorUserId: string;
  content: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: params.content,
  });
}

export async function addBookingCreatedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  return appendSystemMessageToBookingConversation({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
    content: "예약이 생성되었습니다.",
  });
}

export async function addQuoteSelectedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  return appendSystemMessageToBookingConversation({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
    content: "고객이 이 견적을 선택했습니다.",
  });
}

export async function addBookingScheduleChangedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: "방문 시간이 변경되었습니다.",
  });
}

export async function addBookingAcceptedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: "전문가가 예약을 수락했습니다.",
  });
}

export async function addBookingStartedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: "작업이 시작되었습니다.",
  });
}

export async function addBookingCompletedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: "작업이 완료 처리되었습니다.",
  });
}

export async function listConversationsForUser(userId: string) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ customerId: userId }, { tradesmanId: userId }],
      },
      include: {
        customer: true,
        tradesman: true,
        request: {
          include: {
            category: true,
          },
        },
        quote: {
          include: {
            quoteRequest: {
              include: {
                category: true,
              },
            },
            tradesman: true,
          },
        },
        booking: {
          include: {
            service: true,
            quoteRequest: {
              include: {
                category: true,
              },
            },
            tradesman: true,
          },
        },
        messages: {
          include: {
            sender: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const unreadCounts = await Promise.all(
      conversations.map((conversation) =>
        prisma.message.count({
          where: {
            conversationId: conversation.id,
            readAt: null,
            OR: [{ senderId: null }, { senderId: { not: userId } }],
          },
        }),
      ),
    );

    return conversations.map((conversation, index) => {
      const partner = getPartnerForUser(
        conversation as ConversationRecord,
        userId,
      );
      const lastMessage = conversation.messages[0];

      return {
        id: conversation.id,
        partnerName: partner.name,
        partnerAvatarUrl: partner.avatarUrl,
        partnerRole: partner.role,
        jobTitle: getConversationJobTitle(conversation as ConversationRecord),
        scheduleLabel: getConversationScheduleLabel(conversation as ConversationRecord),
        unreadCount: unreadCounts[index],
        lastMessagePreview: getMessagePreview(lastMessage as ConversationRecord["messages"][number]),
        lastMessageType:
          lastMessage?.messageType === MessageType.IMAGE
            ? "image"
            : lastMessage?.messageType === MessageType.SYSTEM
              ? "system"
              : "text",
        lastMessageAt: (lastMessage?.createdAt ?? conversation.updatedAt).toISOString(),
        bookingId: conversation.bookingId,
        requestId: conversation.requestId,
      } satisfies ConversationListItem;
    });
  } catch {
    // 로컬 DB가 잠시 꺼져 있어도 채팅 화면이 빨간 오류로 깨지지 않게,
    // 목록은 비어 있는 상태로 먼저 보여 준다.
    return [];
  }
}

export async function listConversationFeedForUser(params: {
  userId: string;
  locale: Locale;
}) {
  const conversations = await listConversationsForUser(params.userId);

  if (conversations.length > 0) {
    return {
      source: "database" as const,
      conversations,
    };
  }

  return {
    source: "database" as const,
    conversations: [],
  };
}

export async function getConversationDetailForUser(
  conversationId: string,
  userId: string,
) {
  try {
    const conversation = (await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    })) as ConversationRecord | null;

    if (!conversation) {
      return null;
    }

    if (!isConversationParticipant(conversation, userId)) {
      return "forbidden" as const;
    }

    const partner = getPartnerForUser(conversation, userId);

    return {
      id: conversation.id,
      partnerName: partner.name,
      partnerAvatarUrl: partner.avatarUrl,
      jobTitle: getConversationJobTitle(conversation),
      scheduleLabel: getConversationScheduleLabel(conversation),
      headerMeta: getConversationHeaderMeta(conversation),
      bookingId: conversation.bookingId,
      bookingStatus: toUiBookingStatus(conversation.booking?.status),
      requestId: conversation.requestId,
      messages: conversation.messages.map((message) =>
        mapConversationMessage(message, userId),
      ),
    } satisfies ConversationDetail;
  } catch {
    // 채팅 상세도 DB가 잠시 없으면 빈 결과로 넘겨서,
    // 페이지 전체가 죽지 않고 사용자가 다시 시도할 수 있게 만든다.
    return null;
  }
}

export async function markConversationAsReadForUser(
  conversationId: string,
  userId: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return null;
  }

  if (!isConversationParticipant(conversation, userId)) {
    return "forbidden" as const;
  }

  const now = new Date();

  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      readAt: null,
      OR: [{ senderId: null }, { senderId: { not: userId } }],
    },
    data: {
      readAt: now,
    },
  });

  return result.count;
}

export async function sendMessageToConversation(params: {
  conversationId: string;
  userId: string;
  content: string;
  imageDataUrl?: string;
}) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
  });

  if (!conversation) {
    return null;
  }

  if (!isConversationParticipant(conversation, params.userId)) {
    return "forbidden" as const;
  }

  const content = params.content.trim();
  const imageUrl = params.imageDataUrl?.trim();

  if (!content && !imageUrl) {
    throw new Error("보낼 메시지 내용이 비어 있습니다.");
  }

  const now = new Date();
  const senderRole = getSenderRoleForConversation(conversation, params.userId);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: params.userId,
        senderRole,
        messageType: imageUrl ? MessageType.IMAGE : MessageType.TEXT,
        content,
        imageUrl,
      },
      include: {
        sender: true,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        updatedAt: now,
      },
    }),
  ]);

  return mapConversationMessage(message as ConversationRecord["messages"][number], params.userId);
}
