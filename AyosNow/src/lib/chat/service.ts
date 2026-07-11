import {
  MessageSenderRole,
  MessageType,
  Prisma,
  UploadAccess,
  UploadFolder,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVisibleProfessionalBadgesForProfiles } from "@/lib/professional-badges/professional-badge-service";
import {
  CHAT_FILE_MIME_TYPES,
  CHAT_IMAGE_MIME_TYPES,
  CHAT_UPLOAD_MAX_BYTES,
  deleteR2Object,
  uploadDataUrlToR2,
} from "@/lib/storage/r2-storage";
import {
  assertVerifiedTradesmanForCustomerWorkflow,
  getTradesmanVerificationState,
} from "@/lib/tradesmen/verification-service";
import type { BookingStatus, Locale, ProfessionalBadgeSummary } from "@/lib/types";

type ConversationRecord = Prisma.ConversationGetPayload<{
  include: {
    customer: true;
    tradesman: {
      include: {
        tradesmanProfile: true;
      };
    };
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
        tradesman: {
          include: {
            tradesmanProfile: true;
          };
        };
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
  tradesman: {
    include: {
      tradesmanProfile: true,
    },
  },
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
      tradesman: {
        include: {
          tradesmanProfile: true,
        },
      },
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
  partnerBadges: ProfessionalBadgeSummary[];
  partnerLastSeenAt: string | null;
  isPartnerOnline: boolean;
  jobTitle: string;
  scheduleLabel: string | null;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageType: "text" | "image" | "file" | "system";
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

export interface ConversationDetail {
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
  bookingStatus: BookingStatus | null;
  requestId: string | null;
  messages: ConversationMessageItem[];
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function isRecentlyOnline(date: Date | null | undefined) {
  if (!date) {
    return false;
  }

  return Date.now() - date.getTime() < 2 * 60 * 1000;
}

async function markUserSeen(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  }).catch(() => null);
}

async function assertChatAccessForActor(userId: string) {
  if (!(await hasChatAccessForActor(userId))) {
    await assertVerifiedTradesmanForCustomerWorkflow(userId);
  }
}

async function hasChatAccessForActor(userId: string) {
  const verification = await getTradesmanVerificationState(userId);

  if (!verification.isTradesman) {
    return true;
  }

  return verification.isActive && verification.isVerified;
}

async function isConversationTradesmanVerified(tradesmanId: string) {
  const verification = await getTradesmanVerificationState(tradesmanId);
  return verification.isTradesman && verification.isActive && verification.isVerified;
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
      userId: conversation.tradesmanId,
      lastSeenAt: conversation.tradesman.lastSeenAt,
      profileId: conversation.tradesman.tradesmanProfile?.id ?? null,
    };
  }

  return {
    name: conversation.customer.fullName,
    avatarUrl: conversation.customer.avatarUrl,
    role: "customer" as const,
    userId: conversation.customerId,
    lastSeenAt: conversation.customer.lastSeenAt,
    profileId: null,
  };
}

function getMessagePreview(message: ConversationRecord["messages"][number] | undefined) {
  if (!message) {
    return "";
  }

  if (message.messageType === MessageType.IMAGE) {
    return message.content.trim() || "Image";
  }

  if (message.messageType === MessageType.FILE) {
    return message.content.trim() || message.fileName || "File";
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
          : message.messageType === MessageType.FILE
            ? "file"
            : "system",
    content: message.content,
    imageUrl: message.imageUrl,
    fileUrl: message.fileUrl,
    fileName: message.fileName,
    fileMimeType: message.fileMimeType,
    fileSizeBytes: message.fileSizeBytes,
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
    throw new Error("Could not find the booking to connect.");
  }

  if (
    params.actorUserId !== booking.customerId &&
    params.actorUserId !== booking.tradesmanId
  ) {
    throw new Error("You do not have permission to access this booking chat.");
  }

  await assertVerifiedTradesmanForCustomerWorkflow(booking.tradesmanId);

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
    content: "Booking created.",
  });
}

export async function addQuoteSelectedSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  return appendSystemMessageToBookingConversation({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
    content: "The customer selected this quote.",
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
    content: "Visit time updated.",
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
    content: "The professional accepted the booking.",
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
    content: "Work started.",
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
    content: "Work marked complete.",
  });
}

export async function addBookingCancelledSystemMessage(params: {
  bookingId: string;
  actorUserId: string;
}) {
  const conversation = await getOrCreateConversationForBooking({
    bookingId: params.bookingId,
    actorUserId: params.actorUserId,
  });

  return appendSystemMessageToConversation({
    conversationId: conversation.id,
    content: "Booking cancelled.",
  });
}

export async function listConversationsForUser(userId: string) {
  try {
    await markUserSeen(userId);
    await assertChatAccessForActor(userId);

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ customerId: userId }, { tradesmanId: userId }],
      },
      include: {
        customer: true,
        tradesman: {
          include: {
            tradesmanProfile: true,
          },
        },
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
            tradesman: {
              include: {
                tradesmanProfile: true,
              },
            },
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

    const accessibleConversations: typeof conversations = [];
    for (const conversation of conversations) {
      if (await isConversationTradesmanVerified(conversation.tradesmanId)) {
        accessibleConversations.push(conversation);
      }
    }

    const unreadCounts = await Promise.all(
      accessibleConversations.map((conversation) =>
        prisma.message.count({
          where: {
            conversationId: conversation.id,
            readAt: null,
            OR: [{ senderId: null }, { senderId: { not: userId } }],
          },
        }),
      ),
    );
    const partnerProfileIds = accessibleConversations
      .map((conversation) => getPartnerForUser(conversation as ConversationRecord, userId).profileId)
      .filter((value): value is string => Boolean(value));
    const badgeMap = await getVisibleProfessionalBadgesForProfiles(partnerProfileIds);

    return accessibleConversations.map((conversation, index) => {
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
        partnerBadges: partner.profileId ? badgeMap.get(partner.profileId) ?? [] : [],
        partnerLastSeenAt: toIso(partner.lastSeenAt),
        isPartnerOnline: isRecentlyOnline(partner.lastSeenAt),
        jobTitle: getConversationJobTitle(conversation as ConversationRecord),
        scheduleLabel: getConversationScheduleLabel(conversation as ConversationRecord),
        unreadCount: unreadCounts[index],
        lastMessagePreview: getMessagePreview(lastMessage as ConversationRecord["messages"][number]),
        lastMessageType:
          lastMessage?.messageType === MessageType.IMAGE
            ? "image"
            : lastMessage?.messageType === MessageType.FILE
              ? "file"
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
    await markUserSeen(userId);
    if (!(await hasChatAccessForActor(userId))) {
      return "forbidden" as const;
    }

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

    if (!(await isConversationTradesmanVerified(conversation.tradesmanId))) {
      return "forbidden" as const;
    }

    const partner = getPartnerForUser(conversation, userId);
    const badgeMap = await getVisibleProfessionalBadgesForProfiles(
      partner.profileId ? [partner.profileId] : [],
    );
    const typingCutoff = new Date(Date.now() - 8 * 1000);
    const partnerTyping = await prisma.typingIndicator.findFirst({
      where: {
        conversationId: conversation.id,
        userId: partner.userId,
        isTyping: true,
        updatedAt: { gte: typingCutoff },
      },
      select: { id: true },
    });

    return {
      id: conversation.id,
      partnerName: partner.name,
      partnerAvatarUrl: partner.avatarUrl,
      partnerBadges: partner.profileId ? badgeMap.get(partner.profileId) ?? [] : [],
      partnerLastSeenAt: toIso(partner.lastSeenAt),
      isPartnerOnline: isRecentlyOnline(partner.lastSeenAt),
      isPartnerTyping: Boolean(partnerTyping),
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
  await markUserSeen(userId);
  if (!(await hasChatAccessForActor(userId))) {
    return "forbidden" as const;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    return null;
  }

  if (!isConversationParticipant(conversation, userId)) {
    return "forbidden" as const;
  }

  if (!(await isConversationTradesmanVerified(conversation.tradesmanId))) {
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
  imageFileName?: string;
  fileDataUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
}) {
  await markUserSeen(params.userId);
  if (!(await hasChatAccessForActor(params.userId))) {
    return "forbidden" as const;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
  });

  if (!conversation) {
    return null;
  }

  if (!isConversationParticipant(conversation, params.userId)) {
    return "forbidden" as const;
  }

  if (!(await isConversationTradesmanVerified(conversation.tradesmanId))) {
    return "forbidden" as const;
  }

  const content = params.content.trim();
  const imageDataUrl = params.imageDataUrl?.trim();
  const fileDataUrl = params.fileDataUrl?.trim();

  if (!content && !imageDataUrl && !fileDataUrl) {
    throw new Error("Message content is empty.");
  }

  const now = new Date();
  const senderRole = getSenderRoleForConversation(conversation, params.userId);
  const uploadedImage = imageDataUrl
    ? await uploadDataUrlToR2({
        dataUrl: imageDataUrl,
        folder: UploadFolder.CHAT,
        access: UploadAccess.PRIVATE,
        uploaderId: params.userId,
        originalFileName: params.imageFileName ?? "chat-image",
        allowedMimeTypes: CHAT_IMAGE_MIME_TYPES,
        maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
      })
    : null;
  const uploadedFile = fileDataUrl
    ? await uploadDataUrlToR2({
        dataUrl: fileDataUrl,
        folder: UploadFolder.CHAT,
        access: UploadAccess.PRIVATE,
        uploaderId: params.userId,
        originalFileName: params.fileName ?? "chat-file",
        allowedMimeTypes: CHAT_FILE_MIME_TYPES,
        maxSizeBytes: CHAT_UPLOAD_MAX_BYTES,
      })
    : null;

  try {
    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: params.userId,
          senderRole,
          messageType: uploadedFile
            ? MessageType.FILE
            : uploadedImage
              ? MessageType.IMAGE
              : MessageType.TEXT,
          content,
          imageUrl: uploadedImage?.publicUrl,
          imageUploadId: uploadedImage?.id,
          fileUrl: uploadedFile?.publicUrl,
          fileUploadId: uploadedFile?.id,
          fileName: uploadedFile?.originalFileName,
          fileMimeType: uploadedFile?.mimeType,
          fileSizeBytes: uploadedFile?.sizeBytes,
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
  } catch (error) {
    if (uploadedImage) {
      await deleteR2Object(uploadedImage.objectKey);
      await prisma.uploadedFile.deleteMany({ where: { id: uploadedImage.id } }).catch(() => null);
    }

    if (uploadedFile) {
      await deleteR2Object(uploadedFile.objectKey);
      await prisma.uploadedFile.deleteMany({ where: { id: uploadedFile.id } }).catch(() => null);
    }

    throw error;
  }
}

export async function updateTypingIndicatorForUser(params: {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}) {
  await markUserSeen(params.userId);
  if (!(await hasChatAccessForActor(params.userId))) {
    return "forbidden" as const;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.conversationId },
  });

  if (!conversation) {
    return null;
  }

  if (!isConversationParticipant(conversation, params.userId)) {
    return "forbidden" as const;
  }

  if (!(await isConversationTradesmanVerified(conversation.tradesmanId))) {
    return "forbidden" as const;
  }

  await prisma.typingIndicator.upsert({
    where: {
      conversationId_userId: {
        conversationId: params.conversationId,
        userId: params.userId,
      },
    },
    create: {
      conversationId: params.conversationId,
      userId: params.userId,
      isTyping: params.isTyping,
    },
    update: {
      isTyping: params.isTyping,
    },
  });

  return true;
}
