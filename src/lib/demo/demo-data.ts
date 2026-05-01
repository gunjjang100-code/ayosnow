import {
  AccountStatus,
  MessageSenderRole,
  MessageType,
  Prisma,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface DemoSessionDefinition {
  token: string;
  email: string;
  fullName: string;
  role: "customer" | "tradesman" | "admin";
}

const placeholderPasswordHash = "demo-password-hash";

export const demoSessions: DemoSessionDefinition[] = [
  {
    token: "demo-customer",
    email: "maria@example.com",
    fullName: "Maria Cruz",
    role: "customer",
  },
  {
    token: "demo-tradesman-jose",
    email: "jose@example.com",
    fullName: "Jose Santos",
    role: "tradesman",
  },
  {
    token: "demo-tradesman-miguel",
    email: "miguel@example.com",
    fullName: "Miguel Reyes",
    role: "tradesman",
  },
  {
    token: "demo-admin",
    email: "admin@example.com",
    fullName: "Admin Rivera",
    role: "admin",
  },
  {
    token: "demo-tradesman-carlo",
    email: "carlo@example.com",
    fullName: "Carlo Dizon",
    role: "tradesman",
  },
];

const demoCategories = [
  {
    slug: "aircon-cleaning",
    name: "Aircon Cleaning",
    description: "For residential and small commercial aircon cleaning jobs.",
    featured: true,
    displayOrder: 1,
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    description: "For leak repair, drain issues, and faucet replacement jobs.",
    featured: true,
    displayOrder: 2,
  },
  {
    slug: "electrical",
    name: "Electrical",
    description: "For lighting, outlet, and small electrical repair jobs.",
    featured: false,
    displayOrder: 3,
  },
  {
    slug: "painting",
    name: "Painting",
    description: "For repainting, touch-up, and surface repair jobs.",
    featured: false,
    displayOrder: 4,
  },
  {
    slug: "furniture-assembly",
    name: "Furniture Assembly",
    description: "For bed, desk, cabinet, and other assembly jobs.",
    featured: true,
    displayOrder: 5,
  },
  {
    slug: "cleaning",
    name: "Cleaning",
    description: "For home cleaning, move-in cleaning, and basic office cleaning jobs.",
    featured: false,
    displayOrder: 6,
  },
  {
    slug: "moving",
    name: "Moving",
    description: "For moving, hauling, and packing support jobs.",
    featured: false,
    displayOrder: 7,
  },
];

let demoDataReady = false;

export async function ensureDemoData() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_DATA !== "true") {
    return;
  }

  if (demoDataReady) {
    return;
  }

  try {
    // 이 함수는 "알림 데모를 위한 최소 데이터 창고"를 채우는 역할이다.
    // 실제 서비스에서는 seed나 운영 데이터가 이 자리를 대신한다.
    await Promise.all(
      demoCategories.map((category) =>
        prisma.serviceCategory.upsert({
          where: { slug: category.slug },
          update: {
            name: category.name,
            description: category.description,
            featured: category.featured,
            displayOrder: category.displayOrder,
            isActive: true,
          },
          create: {
            slug: category.slug,
            name: category.name,
            description: category.description,
            featured: category.featured,
            displayOrder: category.displayOrder,
            isActive: true,
          },
        }),
      ),
    );

  const categoryBySlugEntries = await prisma.serviceCategory.findMany({
    where: {
      slug: {
        in: demoCategories.map((category) => category.slug),
      },
    },
  });

  const categoryBySlug = new Map(
    categoryBySlugEntries.map((category) => [category.slug, category]),
  );

  const maria = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {
      fullName: "Maria Cruz",
      role: UserRole.CUSTOMER,
      status: AccountStatus.ACTIVE,
      city: "Makati",
      barangay: "Legazpi Village",
    },
    create: {
      email: "maria@example.com",
      passwordHash: placeholderPasswordHash,
      fullName: "Maria Cruz",
      role: UserRole.CUSTOMER,
      status: AccountStatus.ACTIVE,
      city: "Makati",
      barangay: "Legazpi Village",
    },
  });

  const jose = await prisma.user.upsert({
    where: { email: "jose@example.com" },
    update: {
      fullName: "Jose Santos",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Quezon City",
      barangay: "South Triangle",
    },
    create: {
      email: "jose@example.com",
      passwordHash: placeholderPasswordHash,
      fullName: "Jose Santos",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Quezon City",
      barangay: "South Triangle",
    },
  });

  const miguel = await prisma.user.upsert({
    where: { email: "miguel@example.com" },
    update: {
      fullName: "Miguel Reyes",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Makati",
      barangay: "Poblacion",
    },
    create: {
      email: "miguel@example.com",
      passwordHash: placeholderPasswordHash,
      fullName: "Miguel Reyes",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Makati",
      barangay: "Poblacion",
    },
  });

  const carlo = await prisma.user.upsert({
    where: { email: "carlo@example.com" },
    update: {
      fullName: "Carlo Dizon",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Taguig",
      barangay: "Fort Bonifacio",
    },
    create: {
      email: "carlo@example.com",
      passwordHash: placeholderPasswordHash,
      fullName: "Carlo Dizon",
      role: UserRole.TRADESMAN,
      status: AccountStatus.ACTIVE,
      city: "Taguig",
      barangay: "Fort Bonifacio",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      fullName: "Admin Rivera",
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      city: "Pasig",
      barangay: "Kapitolyo",
    },
    create: {
      email: "admin@example.com",
      passwordHash: placeholderPasswordHash,
      fullName: "Admin Rivera",
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      city: "Pasig",
      barangay: "Kapitolyo",
    },
  });

  // 데모 전문가는 바로 견적 제출 흐름을 시험해 볼 수 있어야 하므로
  // 시작 크레딧을 200 PHP로 미리 채워 둔다.
  await Promise.all(
    [jose, miguel, carlo].map((user) =>
      prisma.wallet.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          balance: 200,
        },
      }),
    ),
  );

  await prisma.tradesmanProfile.upsert({
    where: { userId: jose.id },
    update: {
      headline: "Aircon cleaning and basic electrical expert",
      bio: "Handles same-day aircon cleaning and small electrical checks.",
      experienceYears: 8,
      serviceRadiusKm: 10,
      isVerified: true,
      averageRating: 4.9,
      completedJobs: 312,
      responseRate: 98,
    },
    create: {
      userId: jose.id,
      headline: "Aircon cleaning and basic electrical expert",
      bio: "Handles same-day aircon cleaning and small electrical checks.",
      experienceYears: 8,
      serviceRadiusKm: 10,
      isVerified: true,
      averageRating: 4.9,
      completedJobs: 312,
      responseRate: 98,
    },
  });

  await prisma.tradesmanProfile.upsert({
    where: { userId: miguel.id },
    update: {
      headline: "Urgent plumbing repair specialist",
      bio: "Focuses on leaks, faucet replacement, and drain issues.",
      experienceYears: 7,
      serviceRadiusKm: 12,
      isVerified: true,
      averageRating: 4.8,
      completedJobs: 204,
      responseRate: 96,
    },
    create: {
      userId: miguel.id,
      headline: "Urgent plumbing repair specialist",
      bio: "Focuses on leaks, faucet replacement, and drain issues.",
      experienceYears: 7,
      serviceRadiusKm: 12,
      isVerified: true,
      averageRating: 4.8,
      completedJobs: 204,
      responseRate: 96,
    },
  });

  await prisma.tradesmanProfile.upsert({
    where: { userId: carlo.id },
    update: {
      headline: "Furniture assembly and indoor setup specialist",
      bio: "Focuses on fast furniture assembly and simple home setup tasks.",
      experienceYears: 6,
      serviceRadiusKm: 9,
      isVerified: true,
      averageRating: 4.7,
      completedJobs: 126,
      responseRate: 95,
    },
    create: {
      userId: carlo.id,
      headline: "Furniture assembly and indoor setup specialist",
      bio: "Focuses on fast furniture assembly and simple home setup tasks.",
      experienceYears: 6,
      serviceRadiusKm: 9,
      isVerified: true,
      averageRating: 4.7,
      completedJobs: 126,
      responseRate: 95,
    },
  });

  const joseProfile = await prisma.tradesmanProfile.findUniqueOrThrow({
    where: { userId: jose.id },
  });
  const miguelProfile = await prisma.tradesmanProfile.findUniqueOrThrow({
    where: { userId: miguel.id },
  });
  const carloProfile = await prisma.tradesmanProfile.findUniqueOrThrow({
    where: { userId: carlo.id },
  });

  await prisma.tradesmanSkill.upsert({
    where: {
      profileId_categoryId: {
        profileId: joseProfile.id,
        categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      },
    },
    update: {
      years: 8,
      isPrimary: true,
    },
    create: {
      profileId: joseProfile.id,
      categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      years: 8,
      isPrimary: true,
    },
  });

  await prisma.tradesmanSkill.upsert({
    where: {
      profileId_categoryId: {
        profileId: joseProfile.id,
        categoryId: categoryBySlug.get("electrical")!.id,
      },
    },
    update: {
      years: 5,
      isPrimary: false,
    },
    create: {
      profileId: joseProfile.id,
      categoryId: categoryBySlug.get("electrical")!.id,
      years: 5,
      isPrimary: false,
    },
  });

  await prisma.tradesmanSkill.upsert({
    where: {
      profileId_categoryId: {
        profileId: miguelProfile.id,
        categoryId: categoryBySlug.get("plumbing")!.id,
      },
    },
    update: {
      years: 7,
      isPrimary: true,
    },
    create: {
      profileId: miguelProfile.id,
      categoryId: categoryBySlug.get("plumbing")!.id,
      years: 7,
      isPrimary: true,
    },
  });

  await prisma.tradesmanSkill.upsert({
    where: {
      profileId_categoryId: {
        profileId: miguelProfile.id,
        categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      },
    },
    update: {
      years: 3,
      isPrimary: false,
    },
    create: {
      profileId: miguelProfile.id,
      categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      years: 3,
      isPrimary: false,
    },
  });

  await prisma.tradesmanSkill.upsert({
    where: {
      profileId_categoryId: {
        profileId: carloProfile.id,
        categoryId: categoryBySlug.get("furniture-assembly")!.id,
      },
    },
    update: {
      years: 6,
      isPrimary: true,
    },
    create: {
      profileId: carloProfile.id,
      categoryId: categoryBySlug.get("furniture-assembly")!.id,
      years: 6,
      isPrimary: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "same-day-aircon-cleaning" },
    update: {
      ownerId: jose.id,
      categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      title: "Same-day aircon deep cleaning",
      shortDescription: "Fast aircon cleaning for homes and small offices.",
      basePriceMin: new Prisma.Decimal(1200),
      basePriceMax: new Prisma.Decimal(1800),
      durationMinutes: 120,
      isPublished: true,
    },
    create: {
      ownerId: jose.id,
      categoryId: categoryBySlug.get("aircon-cleaning")!.id,
      slug: "same-day-aircon-cleaning",
      title: "Same-day aircon deep cleaning",
      shortDescription: "Fast aircon cleaning for homes and small offices.",
      basePriceMin: new Prisma.Decimal(1200),
      basePriceMax: new Prisma.Decimal(1800),
      durationMinutes: 120,
      isPublished: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "plumbing-fix-leak" },
    update: {
      ownerId: miguel.id,
      categoryId: categoryBySlug.get("plumbing")!.id,
      title: "Urgent sink leak repair",
      shortDescription: "Quick response for leak and faucet issues.",
      basePriceMin: new Prisma.Decimal(900),
      basePriceMax: new Prisma.Decimal(1500),
      durationMinutes: 90,
      isPublished: true,
    },
    create: {
      ownerId: miguel.id,
      categoryId: categoryBySlug.get("plumbing")!.id,
      slug: "plumbing-fix-leak",
      title: "Urgent sink leak repair",
      shortDescription: "Quick response for leak and faucet issues.",
      basePriceMin: new Prisma.Decimal(900),
      basePriceMax: new Prisma.Decimal(1500),
      durationMinutes: 90,
      isPublished: true,
    },
  });

  await prisma.service.upsert({
    where: { slug: "furniture-assembly-ikea-style" },
    update: {
      ownerId: carlo.id,
      categoryId: categoryBySlug.get("furniture-assembly")!.id,
      title: "Furniture assembly full service",
      shortDescription: "Fast assembly for beds, desks, and cabinets.",
      basePriceMin: new Prisma.Decimal(500),
      basePriceMax: new Prisma.Decimal(1100),
      durationMinutes: 120,
      isPublished: true,
    },
    create: {
      ownerId: carlo.id,
      categoryId: categoryBySlug.get("furniture-assembly")!.id,
      slug: "furniture-assembly-ikea-style",
      title: "Furniture assembly full service",
      shortDescription: "Fast assembly for beds, desks, and cabinets.",
      basePriceMin: new Prisma.Decimal(500),
      basePriceMax: new Prisma.Decimal(1100),
      durationMinutes: 120,
      isPublished: true,
    },
  });

  const existingQuoteRequest = await prisma.quoteRequest.findFirst({
    where: {
      customerId: maria.id,
      title: "거실 벽걸이 에어컨 청소 견적 요청",
    },
  });

  const demoQuoteRequest = existingQuoteRequest
    ? await prisma.quoteRequest.update({
        where: { id: existingQuoteRequest.id },
        data: {
          categoryId: categoryBySlug.get("aircon-cleaning")!.id,
          description:
            "거실 벽걸이 에어컨 1대를 이번 주 안에 청소하고 싶습니다. 필터 상태 확인과 기본 점검도 부탁드립니다.",
          city: "Makati",
          addressLine: "Legazpi Village",
          budgetMin: new Prisma.Decimal(900),
          budgetMax: new Prisma.Decimal(1800),
          targetDate: new Date("2026-04-16T09:00:00.000Z"),
          status: "OPEN",
          selectedQuoteId: null,
        },
      })
    : await prisma.quoteRequest.create({
        data: {
          customerId: maria.id,
          categoryId: categoryBySlug.get("aircon-cleaning")!.id,
          title: "거실 벽걸이 에어컨 청소 견적 요청",
          description:
            "거실 벽걸이 에어컨 1대를 이번 주 안에 청소하고 싶습니다. 필터 상태 확인과 기본 점검도 부탁드립니다.",
          city: "Makati",
          addressLine: "Legazpi Village",
          budgetMin: new Prisma.Decimal(900),
          budgetMax: new Prisma.Decimal(1800),
          targetDate: new Date("2026-04-16T09:00:00.000Z"),
          status: "OPEN",
        },
      });

  const joseQuote = await prisma.quote.upsert({
    where: {
      quoteRequestId_tradesmanId: {
        quoteRequestId: demoQuoteRequest.id,
        tradesmanId: jose.id,
      },
    },
    update: {
      amount: new Prisma.Decimal(1200),
      visitDate: new Date("2026-04-16T09:00:00.000Z"),
      message:
        "필터 상태와 실외기 기본 점검까지 포함해서 방문 가능합니다. 사진을 먼저 보내주시면 준비물을 맞춰가겠습니다.",
      status: "PENDING",
    },
    create: {
      quoteRequestId: demoQuoteRequest.id,
      tradesmanId: jose.id,
      amount: new Prisma.Decimal(1200),
      visitDate: new Date("2026-04-16T09:00:00.000Z"),
      message:
        "필터 상태와 실외기 기본 점검까지 포함해서 방문 가능합니다. 사진을 먼저 보내주시면 준비물을 맞춰가겠습니다.",
      status: "PENDING",
    },
  });

  await prisma.quote.upsert({
    where: {
      quoteRequestId_tradesmanId: {
        quoteRequestId: demoQuoteRequest.id,
        tradesmanId: miguel.id,
      },
    },
    update: {
      amount: new Prisma.Decimal(1350),
      visitDate: new Date("2026-04-16T13:00:00.000Z"),
      message:
        "오후 일정으로 방문 가능합니다. 에어컨 모델 사진을 보내주시면 세척 범위를 더 정확히 안내드릴 수 있습니다.",
      status: "PENDING",
    },
    create: {
      quoteRequestId: demoQuoteRequest.id,
      tradesmanId: miguel.id,
      amount: new Prisma.Decimal(1350),
      visitDate: new Date("2026-04-16T13:00:00.000Z"),
      message:
        "오후 일정으로 방문 가능합니다. 에어컨 모델 사진을 보내주시면 세척 범위를 더 정확히 안내드릴 수 있습니다.",
      status: "PENDING",
    },
  });

  const demoConversation = await prisma.conversation.upsert({
    where: {
      quoteId: joseQuote.id,
    },
    update: {
      customerId: maria.id,
      tradesmanId: jose.id,
      requestId: demoQuoteRequest.id,
    },
    create: {
      customerId: maria.id,
      tradesmanId: jose.id,
      quoteId: joseQuote.id,
      requestId: demoQuoteRequest.id,
    },
  });

  const existingConversationMessages = await prisma.message.count({
    where: {
      conversationId: demoConversation.id,
    },
  });

  if (existingConversationMessages === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: demoConversation.id,
          senderRole: MessageSenderRole.SYSTEM,
          messageType: MessageType.SYSTEM,
          content: "고객이 이 견적 대화를 시작했습니다.",
        },
        {
          conversationId: demoConversation.id,
          senderId: jose.id,
          senderRole: MessageSenderRole.TRADESMAN,
          messageType: MessageType.TEXT,
          content: "방문 전에 모델 사진 한 장만 더 보내주실 수 있을까요?",
        },
        {
          conversationId: demoConversation.id,
          senderId: maria.id,
          senderRole: MessageSenderRole.CUSTOMER,
          messageType: MessageType.TEXT,
          content: "네, 필터 쪽 사진이랑 같이 보내드릴게요.",
          readAt: new Date(),
        },
      ],
    });

    await prisma.conversation.update({
      where: { id: demoConversation.id },
      data: {
        updatedAt: new Date(),
      },
    });
  }

    demoDataReady = true;

    void maria;
  } catch {
    // DB가 꺼져 있으면 데모 시드 주입은 건너뛰고, 화면과 세션만 먼저 살린다.
    demoDataReady = true;
  }
}

export async function findDemoSessionByToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  await ensureDemoData();

  const matchedSession = demoSessions.find((session) => session.token === token);
  if (!matchedSession) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: matchedSession.email },
  });

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.fullName,
    role:
      dbUser.role === UserRole.TRADESMAN
        ? "tradesman"
        : dbUser.role === UserRole.ADMIN
          ? "admin"
          : "customer",
    token: matchedSession.token,
  } as const;
}
