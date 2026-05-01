import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  AccountStatus,
  Prisma,
  PrismaClient,
  QuoteRequestStatus,
  QuoteStatus,
  UserRole,
} from "@prisma/client";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL 환경 변수가 비어 있습니다.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });
}

async function main() {
  const prisma = createPrisma();

  try {
    // 이 스크립트는 "실제 흐름 검수용 최소 데이터"만 넣는다.
    // 너무 많은 샘플을 넣기보다, /quotes에서 바로 견적 비교가 보이도록
    // 필요한 고객/전문가/요청/견적만 작게 채우는 것이 목적이다.
    const categories = [
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
    ];

    for (const category of categories) {
      await prisma.serviceCategory.upsert({
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
      });
    }

    const airconCategory = await prisma.serviceCategory.findUniqueOrThrow({
      where: { slug: "aircon-cleaning" },
    });

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
        passwordHash: "demo-password-hash",
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
        passwordHash: "demo-password-hash",
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
        passwordHash: "demo-password-hash",
        fullName: "Miguel Reyes",
        role: UserRole.TRADESMAN,
        status: AccountStatus.ACTIVE,
        city: "Makati",
        barangay: "Poblacion",
      },
    });

    await Promise.all(
      [jose, miguel].map((user) =>
        prisma.wallet.upsert({
          where: { userId: user.id },
          update: {
            balance: 200,
          },
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
        headline: "Urgent plumbing and repair specialist",
        bio: "Fast response for repair and inspection visits.",
        experienceYears: 7,
        serviceRadiusKm: 12,
        isVerified: true,
        averageRating: 4.8,
        completedJobs: 204,
        responseRate: 96,
      },
      create: {
        userId: miguel.id,
        headline: "Urgent plumbing and repair specialist",
        bio: "Fast response for repair and inspection visits.",
        experienceYears: 7,
        serviceRadiusKm: 12,
        isVerified: true,
        averageRating: 4.8,
        completedJobs: 204,
        responseRate: 96,
      },
    });

    const quoteRequest = await prisma.quoteRequest.upsert({
      where: {
        id: "demo-quote-request-aircon",
      },
      update: {
        customerId: maria.id,
        categoryId: airconCategory.id,
        title: "거실 벽걸이 에어컨 청소 견적 요청",
        description:
          "거실 벽걸이 에어컨 1대를 이번 주 안에 청소하고 싶습니다. 필터 상태 확인과 기본 점검도 부탁드립니다.",
        city: "Makati",
        addressLine: "Legazpi Village",
        budgetMin: new Prisma.Decimal(900),
        budgetMax: new Prisma.Decimal(1800),
        targetDate: new Date("2026-04-16T09:00:00.000Z"),
        status: QuoteRequestStatus.OPEN,
        selectedQuoteId: null,
      },
      create: {
        id: "demo-quote-request-aircon",
        customerId: maria.id,
        categoryId: airconCategory.id,
        title: "거실 벽걸이 에어컨 청소 견적 요청",
        description:
          "거실 벽걸이 에어컨 1대를 이번 주 안에 청소하고 싶습니다. 필터 상태 확인과 기본 점검도 부탁드립니다.",
        city: "Makati",
        addressLine: "Legazpi Village",
        budgetMin: new Prisma.Decimal(900),
        budgetMax: new Prisma.Decimal(1800),
        targetDate: new Date("2026-04-16T09:00:00.000Z"),
        status: QuoteRequestStatus.OPEN,
      },
    });

    await prisma.quote.upsert({
      where: {
        quoteRequestId_tradesmanId: {
          quoteRequestId: quoteRequest.id,
          tradesmanId: jose.id,
        },
      },
      update: {
        amount: new Prisma.Decimal(1200),
        visitDate: new Date("2026-04-16T09:00:00.000Z"),
        message:
          "필터 상태와 실외기 기본 점검까지 포함해서 방문 가능합니다. 사진을 먼저 보내주시면 준비물을 맞춰가겠습니다.",
        status: QuoteStatus.PENDING,
      },
      create: {
        quoteRequestId: quoteRequest.id,
        tradesmanId: jose.id,
        amount: new Prisma.Decimal(1200),
        visitDate: new Date("2026-04-16T09:00:00.000Z"),
        message:
          "필터 상태와 실외기 기본 점검까지 포함해서 방문 가능합니다. 사진을 먼저 보내주시면 준비물을 맞춰가겠습니다.",
        status: QuoteStatus.PENDING,
      },
    });

    await prisma.quote.upsert({
      where: {
        quoteRequestId_tradesmanId: {
          quoteRequestId: quoteRequest.id,
          tradesmanId: miguel.id,
        },
      },
      update: {
        amount: new Prisma.Decimal(1350),
        visitDate: new Date("2026-04-16T13:00:00.000Z"),
        message:
          "오후 일정으로 방문 가능합니다. 에어컨 모델 사진을 보내주시면 세척 범위를 더 정확히 안내드릴 수 있습니다.",
        status: QuoteStatus.PENDING,
      },
      create: {
        quoteRequestId: quoteRequest.id,
        tradesmanId: miguel.id,
        amount: new Prisma.Decimal(1350),
        visitDate: new Date("2026-04-16T13:00:00.000Z"),
        message:
          "오후 일정으로 방문 가능합니다. 에어컨 모델 사진을 보내주시면 세척 범위를 더 정확히 안내드릴 수 있습니다.",
        status: QuoteStatus.PENDING,
      },
    });

    console.log("AyosNow demo DB seed completed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
