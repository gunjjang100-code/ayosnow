import type {
  AdminAlert,
  AdminCategoryItem,
  ApprovalQueueItem,
  BannerItem,
  BookingPreview,
  Category,
  ChatPreview,
  DashboardStat,
  Locale,
  NoticeItem,
  OneOutCaseItem,
  PlatformFeeItem,
  QuoteOffer,
  QuoteRequestPreview,
  ServiceSummary,
  TradesmanProfileData,
} from "@/lib/types";

const localizedMockData: Record<
  Locale,
  {
    categories: Category[];
    featuredServices: ServiceSummary[];
    quoteRequests: QuoteRequestPreview[];
    quoteOffers: QuoteOffer[];
    bookings: BookingPreview[];
    tradesmenProfiles: TradesmanProfileData[];
    chatPreviews: ChatPreview[];
    customerDashboardStats: DashboardStat[];
    tradesmanDashboardStats: DashboardStat[];
    adminAlerts: AdminAlert[];
    adminCategories: AdminCategoryItem[];
    platformFees: PlatformFeeItem[];
    bannerItems: BannerItem[];
    noticeItems: NoticeItem[];
    approvalQueue: ApprovalQueueItem[];
    oneOutCases: OneOutCaseItem[];
  }
> = {
  ko: {
    categories: [
      {
        slug: "aircon-cleaning",
        name: "에어컨 청소",
        shortDescription: "가정용과 소형 상업용 에어컨 청소를 빠르게 연결합니다.",
        startingPrice: "PHP 900부터",
      },
      {
        slug: "plumbing",
        name: "배관",
        shortDescription: "누수, 배수, 수도꼭지 교체 같은 긴급 작업에 맞습니다.",
        startingPrice: "PHP 700부터",
      },
      {
        slug: "electrical",
        name: "전기",
        shortDescription: "조명 교체, 콘센트 수리, 소형 전기 공사를 다룹니다.",
        startingPrice: "PHP 850부터",
      },
      {
        slug: "cleaning",
        name: "청소",
        shortDescription: "집 청소, 입주 청소, 오피스 기본 청소까지 시작 가능합니다.",
        startingPrice: "PHP 650부터",
      },
      {
        slug: "furniture-assembly",
        name: "가구 조립",
        shortDescription: "침대, 책상, 옷장 조립처럼 바로 예약하기 좋은 카테고리입니다.",
        startingPrice: "PHP 500부터",
      },
      {
        slug: "painting",
        name: "페인트",
        shortDescription: "방 한 칸부터 부분 보수까지 견적 비교가 쉬운 작업입니다.",
        startingPrice: "PHP 1,500부터",
      },
      {
        slug: "moving",
        name: "이사",
        shortDescription: "소형 이사, 운반, 포장 도움 요청까지 묶어서 받을 수 있습니다.",
        startingPrice: "PHP 2,200부터",
      },
    ],
    featuredServices: [
      {
        id: "svc-1",
        slug: "same-day-aircon-cleaning",
        title: "당일 에어컨 분해 청소",
        categorySlug: "aircon-cleaning",
        providerName: "Jose Santos",
        providerSlug: "jose-santos",
        location: "Quezon City",
        priceLabel: "PHP 1,200 ~ 1,800",
        rating: 4.9,
        reviewCount: 184,
        arrival: "오늘 2시간 내 방문 가능",
        tags: ["즉시 예약", "필터 세척 포함", "현장 사진 공유"],
      },
      {
        id: "svc-2",
        slug: "plumbing-fix-leak",
        title: "싱크대 누수 긴급 수리",
        categorySlug: "plumbing",
        providerName: "Miguel Reyes",
        providerSlug: "miguel-reyes",
        location: "Makati",
        priceLabel: "PHP 900 ~ 1,500",
        rating: 4.8,
        reviewCount: 96,
        arrival: "오늘 저녁 방문 가능",
        tags: ["즉시 예약", "부품 구매 대행", "야간 대응"],
      },
      {
        id: "svc-3",
        slug: "furniture-assembly-ikea-style",
        title: "가구 조립 풀서비스",
        categorySlug: "furniture-assembly",
        providerName: "Carlo Dizon",
        providerSlug: "carlo-dizon",
        location: "Taguig",
        priceLabel: "PHP 500 ~ 1,100",
        rating: 4.7,
        reviewCount: 71,
        arrival: "내일 오전 예약 가능",
        tags: ["즉시 예약", "도구 지참", "포장재 정리"],
      },
    ],
    quoteRequests: [
      {
        id: "qr-1",
        serviceName: "거실 벽면 부분 페인트",
        location: "Pasig",
        budgetLabel: "PHP 3,000 ~ 5,000",
        targetDate: "2026-04-15",
        summary: "곰팡이 자국이 있는 부분을 샌딩 후 재도색하고 싶습니다.",
        bidsCount: 4,
        status: "open",
      },
      {
        id: "qr-2",
        serviceName: "2BR 콘도 이사 도움",
        location: "Mandaluyong → BGC",
        budgetLabel: "PHP 4,500 ~ 7,000",
        targetDate: "2026-04-18",
        summary: "엘리베이터 예약이 가능하고 포장 박스 18개 정도 있습니다.",
        bidsCount: 6,
        status: "matched",
      },
    ],
    quoteOffers: [
      {
        id: "qt-1",
        requestId: "qr-1",
        tradesmanName: "Ramon Velasco",
        tradesmanSlug: "ramon-velasco",
        amountLabel: "PHP 3,400",
        arrivalText: "4월 15일 오전 9시",
        message: "부분 보수 후 같은 톤으로 맞춰 드립니다. 자재 포함 가격입니다.",
        rating: 4.9,
        completedJobs: 132,
      },
      {
        id: "qt-2",
        requestId: "qr-1",
        tradesmanName: "Leo Navarro",
        tradesmanSlug: "leo-navarro",
        amountLabel: "PHP 3,950",
        arrivalText: "4월 15일 오후 1시",
        message: "페인트 샘플을 현장에서 먼저 비교한 뒤 작업을 시작합니다.",
        rating: 4.8,
        completedJobs: 88,
      },
      {
        id: "qt-3",
        requestId: "qr-2",
        tradesmanName: "MoveFast Crew",
        tradesmanSlug: "movefast-crew",
        amountLabel: "PHP 5,600",
        arrivalText: "4월 18일 오전 8시",
        message: "2인 기사와 소형 트럭 포함입니다. 박스 이동과 기본 보호포장 지원합니다.",
        rating: 4.7,
        completedJobs: 210,
      },
    ],
    bookings: [
      {
        id: "bk-1",
        title: "당일 에어컨 청소",
        customerName: "Maria Cruz",
        tradesmanName: "Jose Santos",
        dateLabel: "오늘 오후 3:00",
        location: "Quezon City",
        status: "accepted",
        mode: "instant-booking",
      },
      {
        id: "bk-2",
        title: "2BR 콘도 이사",
        customerName: "Anne Flores",
        tradesmanName: "MoveFast Crew",
        dateLabel: "4월 18일 오전 8:00",
        location: "Mandaluyong",
        status: "pending",
        mode: "quote-match",
      },
      {
        id: "bk-3",
        title: "거실 부분 페인트",
        customerName: "Paolo Ramos",
        tradesmanName: "Ramon Velasco",
        dateLabel: "4월 15일 오전 9:00",
        location: "Pasig",
        status: "in-progress",
        mode: "quote-match",
      },
    ],
    tradesmenProfiles: [
      {
        slug: "jose-santos",
        name: "Jose Santos",
        headline: "에어컨 청소와 기본 전기 점검을 함께 처리하는 현장형 전문가",
        bio: "콘도, 타운하우스, 소형 매장 중심으로 8년간 작업했습니다. 고객이 사진만 올려도 필요한 준비물을 먼저 정리해 주는 스타일입니다.",
        skills: ["에어컨 청소", "드레인 점검", "기본 전기 확인"],
        certificates: ["TESDA Refrigeration NC II", "현장 안전교육 수료"],
        portfolio: [
          "벽걸이형 에어컨 3대 분해 청소",
          "소형 카페 에어컨 필터 복원",
          "드레인 막힘 해결 후 시운전 완료",
        ],
        serviceAreas: ["Quezon City", "Makati", "Pasig"],
        rating: 4.9,
        reviewCount: 184,
        completedJobs: 312,
        responseTime: "평균 7분",
        startingPrice: "PHP 900부터",
        reviews: [
          {
            id: "rv-1",
            author: "Maria Cruz",
            rating: 5,
            comment: "사진으로 먼저 상태를 파악해서 현장에서 설명이 정말 쉬웠어요.",
          },
          {
            id: "rv-2",
            author: "Ben Torres",
            rating: 5,
            comment: "도착 시간도 정확했고 청소 전후 사진을 남겨줘서 신뢰가 갔습니다.",
          },
        ],
      },
      {
        slug: "ramon-velasco",
        name: "Ramon Velasco",
        headline: "부분 보수와 실내 페인트 견적 비교에 강한 전문가",
        bio: "작업 규모가 작아도 꼼꼼하게 대응합니다. 벽면 상태 확인 후 필요한 보수 범위를 알기 쉽게 설명하는 편입니다.",
        skills: ["페인트", "벽면 보수", "곰팡이 제거"],
        certificates: ["건축 도장 안전교육 수료"],
        portfolio: ["거실 한 면 재도색", "천장 누수 흔적 보수", "사무실 부분 터치업"],
        serviceAreas: ["Pasig", "Taguig", "Mandaluyong"],
        rating: 4.9,
        reviewCount: 103,
        completedJobs: 198,
        responseTime: "평균 12분",
        startingPrice: "PHP 1,500부터",
        reviews: [
          {
            id: "rv-3",
            author: "Paolo Ramos",
            rating: 5,
            comment: "견적서가 깔끔했고 어떤 비용이 들어가는지 이해하기 쉬웠습니다.",
          },
        ],
      },
    ],
    chatPreviews: [
      {
        id: "chat-1",
        participantName: "Jose Santos",
        jobTitle: "당일 에어컨 청소",
        lastMessage: "필터 상태 사진도 같이 보내주시면 준비물을 미리 챙길게요.",
        updatedAt: "방금 전",
        unreadCount: 2,
      },
      {
        id: "chat-2",
        participantName: "MoveFast Crew",
        jobTitle: "2BR 콘도 이사",
        lastMessage: "엘리베이터 예약 시간 확인 부탁드립니다.",
        updatedAt: "12분 전",
        unreadCount: 0,
      },
    ],
    customerDashboardStats: [
      {
        label: "진행 중 예약",
        value: "3건",
        helper: "즉시 예약과 견적 매칭 예약을 함께 보여줍니다.",
      },
      {
        label: "받은 견적",
        value: "10개",
        helper: "열린 요청서 기준으로 비교 가능한 견적 수입니다.",
      },
      {
        label: "평균 응답 시간",
        value: "9분",
        helper: "가까운 전문가에게 먼저 알림을 보내는 구조입니다.",
      },
    ],
    tradesmanDashboardStats: [
      {
        label: "새 견적 요청",
        value: "6건",
        helper: "내 서비스 지역과 카테고리에 맞는 요청만 도착합니다.",
      },
      {
        label: "이번 주 예약",
        value: "8건",
        helper: "즉시 예약과 수락된 견적 예약이 함께 집계됩니다.",
      },
      {
        label: "견적료 합계",
        value: "PHP 12,800",
        helper: "견적 최초 제출 시 차감된 40 PHP의 누적 금액입니다.",
      },
    ],
    adminAlerts: [
      {
        id: "ad-1",
        type: "approval",
        title: "전문가 승인 대기 12건",
        description: "신규 전문가의 자격증과 서비스 지역 검토가 필요합니다.",
        actionLabel: "승인 검토",
      },
      {
        id: "ad-2",
        type: "dispute",
        title: "분쟁 3건 진행 중",
        description: "신고 내용과 증빙 사진 확인이 필요한 건입니다.",
        actionLabel: "분쟁 보기",
      },
      {
        id: "ad-3",
        type: "risk",
        title: "원아웃 경고 후보 1명",
        description: "심각한 불만 접수로 즉시 정지 여부를 판단해야 합니다.",
        actionLabel: "위험 검토",
      },
    ],
    adminCategories: [
      {
        id: "cat-admin-1",
        slug: "aircon-cleaning",
        nameKo: "에어컨 청소",
        nameFil: "Aircon Cleaning",
        nameEn: "Aircon Cleaning",
        descriptionKo: "가정용과 소형 상업용 에어컨 청소를 빠르게 연결합니다.",
        descriptionFil:
          "Mabilis na koneksyon para sa residential at maliit na commercial aircon cleaning.",
        descriptionEn:
          "Quickly connects customers with residential and small commercial aircon cleaning.",
        serviceCount: 34,
        statusLabel: "노출 중",
        sortOrder: 1,
        featured: true,
        isActive: true,
      },
      {
        id: "cat-admin-2",
        slug: "plumbing",
        nameKo: "배관",
        nameFil: "Plumbing",
        nameEn: "Plumbing",
        descriptionKo: "누수, 배수, 수도꼭지 교체 같은 긴급 작업에 맞습니다.",
        descriptionFil:
          "Para ito sa mga urgent na trabaho gaya ng tagas, bara, at pagpapalit ng gripo.",
        descriptionEn:
          "Fits urgent jobs such as leaks, drain issues, and faucet replacement.",
        serviceCount: 22,
        statusLabel: "노출 중",
        sortOrder: 2,
        featured: false,
        isActive: true,
      },
      {
        id: "cat-admin-3",
        slug: "moving",
        nameKo: "이사",
        nameFil: "Moving",
        nameEn: "Moving",
        descriptionKo: "소형 이사, 운반, 포장 도움 요청까지 묶어서 받을 수 있습니다.",
        descriptionFil:
          "Para sa small moves, hauling, at dagdag na packing assistance.",
        descriptionEn:
          "Covers small moves, hauling, and extra packing assistance in one category.",
        serviceCount: 11,
        statusLabel: "검토 중",
        sortOrder: 7,
        featured: false,
        isActive: false,
      },
    ],
    platformFees: [
      {
        id: "fee-1",
        name: "즉시 예약 기본 수수료",
        targetLabel: "서비스 직접 예약",
        feeLabel: "12%",
        chargeRule: "견적 최초 제출 시 40 PHP 차감",
      },
      {
        id: "fee-2",
        name: "견적 매칭 수수료",
        targetLabel: "견적 선택 예약",
        feeLabel: "10%",
        chargeRule: "견적 수정 시 추가 차감 없음",
      },
    ],
    bannerItems: [
      {
        id: "banner-1",
        title: "우기 대비 에어컨 청소 프로모션",
        placement: "홈 상단",
        statusLabel: "게시 중",
        activePeriod: "2026-04-13 ~ 2026-04-30",
      },
      {
        id: "banner-2",
        title: "신규 전문가 모집 배너",
        placement: "카테고리 페이지",
        statusLabel: "예약됨",
        activePeriod: "2026-05-01 ~ 2026-05-15",
      },
    ],
    noticeItems: [
      {
        id: "notice-1",
        title: "크레딧 충전 점검 안내",
        audienceLabel: "전문가",
        statusLabel: "게시 중",
        publishedAt: "2026-04-12 09:00",
      },
      {
        id: "notice-2",
        title: "Holy Week 고객센터 운영 시간",
        audienceLabel: "전체 사용자",
        statusLabel: "임시저장",
        publishedAt: "발행 전",
      },
    ],
    approvalQueue: [
      {
        id: "approval-1",
        tradesmanName: "Kevin Mendoza",
        categoryLabel: "전기",
        submittedAt: "2026-04-12 14:20",
        verificationLabel: "자격증 확인 필요",
      },
      {
        id: "approval-2",
        tradesmanName: "Aira Lopez",
        categoryLabel: "청소",
        submittedAt: "2026-04-12 16:10",
        verificationLabel: "신분증 검토 완료",
      },
    ],
    oneOutCases: [
      {
        id: "risk-1",
        tradesmanName: "Rico Alonzo",
        issueSummary: "고객 폭언 및 무단 추가요금 신고",
        riskLevel: "높음",
        lastActionAt: "2026-04-12 18:40",
      },
      {
        id: "risk-2",
        tradesmanName: "Dan Cruz",
        issueSummary: "작업 미완료 후 연락 두절",
        riskLevel: "중간",
        lastActionAt: "2026-04-11 11:00",
      },
    ],
  },
  fil: {
    categories: [
      {
        slug: "aircon-cleaning",
        name: "Aircon Cleaning",
        shortDescription: "Mabilis na koneksyon para sa residential at maliit na commercial aircon cleaning.",
        startingPrice: "Mula PHP 900",
      },
      {
        slug: "plumbing",
        name: "Plumbing",
        shortDescription: "Para ito sa mga urgent na trabaho gaya ng tagas, bara, at pagpapalit ng gripo.",
        startingPrice: "Mula PHP 700",
      },
      {
        slug: "electrical",
        name: "Electrical",
        shortDescription: "Saklaw nito ang ilaw, saksakan, at maliliit na electrical repair.",
        startingPrice: "Mula PHP 850",
      },
      {
        slug: "cleaning",
        name: "Cleaning",
        shortDescription: "Puwede para sa home cleaning, move-in cleaning, at basic office cleaning.",
        startingPrice: "Mula PHP 650",
      },
      {
        slug: "furniture-assembly",
        name: "Furniture Assembly",
        shortDescription: "Mainam ito para sa kama, mesa, kabinet, at iba pang madaling i-book agad.",
        startingPrice: "Mula PHP 500",
      },
      {
        slug: "painting",
        name: "Painting",
        shortDescription: "Magandang i-quote compare para sa room repaint at partial wall repair.",
        startingPrice: "Mula PHP 1,500",
      },
      {
        slug: "moving",
        name: "Moving",
        shortDescription: "Para sa small moves, hauling, at dagdag na packing assistance.",
        startingPrice: "Mula PHP 2,200",
      },
    ],
    featuredServices: [
      {
        id: "svc-1",
        slug: "same-day-aircon-cleaning",
        title: "Same-day aircon deep cleaning",
        categorySlug: "aircon-cleaning",
        providerName: "Jose Santos",
        providerSlug: "jose-santos",
        location: "Quezon City",
        priceLabel: "PHP 1,200 ~ 1,800",
        rating: 4.9,
        reviewCount: 184,
        arrival: "Available within 2 hours today",
        tags: ["Instant booking", "Filter wash included", "On-site photo update"],
      },
      {
        id: "svc-2",
        slug: "plumbing-fix-leak",
        title: "Urgent sink leak repair",
        categorySlug: "plumbing",
        providerName: "Miguel Reyes",
        providerSlug: "miguel-reyes",
        location: "Makati",
        priceLabel: "PHP 900 ~ 1,500",
        rating: 4.8,
        reviewCount: 96,
        arrival: "Available tonight",
        tags: ["Instant booking", "Parts assistance", "Night support"],
      },
      {
        id: "svc-3",
        slug: "furniture-assembly-ikea-style",
        title: "Full furniture assembly service",
        categorySlug: "furniture-assembly",
        providerName: "Carlo Dizon",
        providerSlug: "carlo-dizon",
        location: "Taguig",
        priceLabel: "PHP 500 ~ 1,100",
        rating: 4.7,
        reviewCount: 71,
        arrival: "Available tomorrow morning",
        tags: ["Instant booking", "Tools included", "Packing cleanup"],
      },
    ],
    quoteRequests: [
      {
        id: "qr-1",
        serviceName: "Partial repaint for living room wall",
        location: "Pasig",
        budgetLabel: "PHP 3,000 ~ 5,000",
        targetDate: "2026-04-15",
        summary: "May mold marks sa bahagi ng pader at gusto ko itong liha-in at pinturahan ulit.",
        bidsCount: 4,
        status: "open",
      },
      {
        id: "qr-2",
        serviceName: "Help moving a 2BR condo",
        location: "Mandaluyong → BGC",
        budgetLabel: "PHP 4,500 ~ 7,000",
        targetDate: "2026-04-18",
        summary: "May elevator booking available at humigit-kumulang 18 boxes ang ililipat.",
        bidsCount: 6,
        status: "matched",
      },
    ],
    quoteOffers: [
      {
        id: "qt-1",
        requestId: "qr-1",
        tradesmanName: "Ramon Velasco",
        tradesmanSlug: "ramon-velasco",
        amountLabel: "PHP 3,400",
        arrivalText: "Apr 15, 9:00 AM",
        message: "Aayusin muna ang damaged area at itutugma ang kulay. Kasama na ang materials.",
        rating: 4.9,
        completedJobs: 132,
      },
      {
        id: "qt-2",
        requestId: "qr-1",
        tradesmanName: "Leo Navarro",
        tradesmanSlug: "leo-navarro",
        amountLabel: "PHP 3,950",
        arrivalText: "Apr 15, 1:00 PM",
        message: "Magdadala muna ako ng paint sample sa site bago simulan ang trabaho.",
        rating: 4.8,
        completedJobs: 88,
      },
      {
        id: "qt-3",
        requestId: "qr-2",
        tradesmanName: "MoveFast Crew",
        tradesmanSlug: "movefast-crew",
        amountLabel: "PHP 5,600",
        arrivalText: "Apr 18, 8:00 AM",
        message: "Kasama ang 2 movers at maliit na truck. May basic protective packing support.",
        rating: 4.7,
        completedJobs: 210,
      },
    ],
    bookings: [
      {
        id: "bk-1",
        title: "Same-day aircon cleaning",
        customerName: "Maria Cruz",
        tradesmanName: "Jose Santos",
        dateLabel: "Today, 3:00 PM",
        location: "Quezon City",
        status: "accepted",
        mode: "instant-booking",
      },
      {
        id: "bk-2",
        title: "2BR condo move",
        customerName: "Anne Flores",
        tradesmanName: "MoveFast Crew",
        dateLabel: "Apr 18, 8:00 AM",
        location: "Mandaluyong",
        status: "pending",
        mode: "quote-match",
      },
      {
        id: "bk-3",
        title: "Partial living room paint",
        customerName: "Paolo Ramos",
        tradesmanName: "Ramon Velasco",
        dateLabel: "Apr 15, 9:00 AM",
        location: "Pasig",
        status: "in-progress",
        mode: "quote-match",
      },
    ],
    tradesmenProfiles: [
      {
        slug: "jose-santos",
        name: "Jose Santos",
        headline: "Field expert for aircon cleaning and basic electrical checking",
        bio: "May 8 taon siyang experience sa condos, townhouses, at maliliit na shops. Kahit larawan lang ang ipadala ng customer, maaga niyang naaayos ang kailangang dalhin sa site.",
        skills: ["Aircon cleaning", "Drain inspection", "Basic electrical check"],
        certificates: ["TESDA Refrigeration NC II", "Site safety training"],
        portfolio: [
          "Deep cleaning for 3 wall-mounted aircon units",
          "Filter restoration for a small cafe aircon",
          "Drain blockage fix with final testing",
        ],
        serviceAreas: ["Quezon City", "Makati", "Pasig"],
        rating: 4.9,
        reviewCount: 184,
        completedJobs: 312,
        responseTime: "Average 7 min",
        startingPrice: "Mula PHP 900",
        reviews: [
          {
            id: "rv-1",
            author: "Maria Cruz",
            rating: 5,
            comment: "Madaling intindihin ang paliwanag niya dahil tiningnan muna ang kondisyon sa photos.",
          },
          {
            id: "rv-2",
            author: "Ben Torres",
            rating: 5,
            comment: "Sakto ang dating niya at nakatulong ang before-and-after photos para magtiwala kami.",
          },
        ],
      },
      {
        slug: "ramon-velasco",
        name: "Ramon Velasco",
        headline: "Malakas sa partial repair at interior painting quote comparison",
        bio: "Kahit maliit ang trabaho, maingat pa rin ang approach niya. Malinaw niyang ipinapaliwanag ang saklaw ng wall repair bago magsimula.",
        skills: ["Painting", "Wall repair", "Mold treatment"],
        certificates: ["Building paint safety training"],
        portfolio: ["Single wall repaint", "Ceiling leak mark repair", "Office touch-up painting"],
        serviceAreas: ["Pasig", "Taguig", "Mandaluyong"],
        rating: 4.9,
        reviewCount: 103,
        completedJobs: 198,
        responseTime: "Average 12 min",
        startingPrice: "Mula PHP 1,500",
        reviews: [
          {
            id: "rv-3",
            author: "Paolo Ramos",
            rating: 5,
            comment: "Malinis ang quote at madaling maintindihan kung saan napupunta ang gastos.",
          },
        ],
      },
    ],
    chatPreviews: [
      {
        id: "chat-1",
        participantName: "Jose Santos",
        jobTitle: "Same-day aircon cleaning",
        lastMessage: "Kung puwede, paki-send din ang photo ng filter para maihanda ko ang gamit.",
        updatedAt: "Just now",
        unreadCount: 2,
      },
      {
        id: "chat-2",
        participantName: "MoveFast Crew",
        jobTitle: "2BR condo move",
        lastMessage: "Pakikumpirma po ang elevator booking time.",
        updatedAt: "12 min ago",
        unreadCount: 0,
      },
    ],
    customerDashboardStats: [
      {
        label: "Active bookings",
        value: "3",
        helper: "Kasama rito ang instant booking at quote-matched bookings.",
      },
      {
        label: "Received quotes",
        value: "10",
        helper: "Bilang ito ng mga quote na puwedeng ikumpara sa open requests.",
      },
      {
        label: "Average response time",
        value: "9 min",
        helper: "Unang pinapadalhan ng alert ang mas malalapit na tradesman.",
      },
    ],
    tradesmanDashboardStats: [
      {
        label: "New quote requests",
        value: "6",
        helper: "Mga request lang na tugma sa service area at category mo ang dumarating.",
      },
      {
        label: "Bookings this week",
        value: "8",
        helper: "Kasama dito ang instant booking at accepted quote bookings.",
      },
      {
        label: "Total quote fees",
        value: "PHP 12,800",
        helper: "Kabuuang 40 PHP fee na nabawas sa unang quote submission.",
      },
    ],
    adminAlerts: [
      {
        id: "ad-1",
        type: "approval",
        title: "12 tradesman approvals pending",
        description: "Kailangang i-review ang certificates at service areas ng mga bagong tradesman.",
        actionLabel: "Review approvals",
      },
      {
        id: "ad-2",
        type: "dispute",
        title: "3 disputes in progress",
        description: "May mga kasong kailangang tingnan ang reports at proof photos.",
        actionLabel: "View disputes",
      },
      {
        id: "ad-3",
        type: "risk",
        title: "1 one-out warning candidate",
        description: "May seryosong reklamo na kailangang pagdesisyunan kung dapat bang i-suspend agad.",
        actionLabel: "Review risk",
      },
    ],
    adminCategories: [
      {
        id: "cat-admin-1",
        slug: "aircon-cleaning",
        nameKo: "에어컨 청소",
        nameFil: "Aircon Cleaning",
        nameEn: "Aircon Cleaning",
        descriptionKo: "가정용과 소형 상업용 에어컨 청소를 빠르게 연결합니다.",
        descriptionFil:
          "Mabilis na koneksyon para sa residential at maliit na commercial aircon cleaning.",
        descriptionEn:
          "Quickly connects customers with residential and small commercial aircon cleaning.",
        serviceCount: 34,
        statusLabel: "Live",
        sortOrder: 1,
        featured: true,
        isActive: true,
      },
      {
        id: "cat-admin-2",
        slug: "plumbing",
        nameKo: "배관",
        nameFil: "Plumbing",
        nameEn: "Plumbing",
        descriptionKo: "누수, 배수, 수도꼭지 교체 같은 긴급 작업에 맞습니다.",
        descriptionFil:
          "Para ito sa mga urgent na trabaho gaya ng tagas, bara, at pagpapalit ng gripo.",
        descriptionEn:
          "Fits urgent jobs such as leaks, drain issues, and faucet replacement.",
        serviceCount: 22,
        statusLabel: "Live",
        sortOrder: 2,
        featured: false,
        isActive: true,
      },
      {
        id: "cat-admin-3",
        slug: "moving",
        nameKo: "이사",
        nameFil: "Moving",
        nameEn: "Moving",
        descriptionKo: "소형 이사, 운반, 포장 도움 요청까지 묶어서 받을 수 있습니다.",
        descriptionFil:
          "Para sa small moves, hauling, at dagdag na packing assistance.",
        descriptionEn:
          "Covers small moves, hauling, and extra packing assistance in one category.",
        serviceCount: 11,
        statusLabel: "For review",
        sortOrder: 7,
        featured: false,
        isActive: false,
      },
    ],
    platformFees: [
      {
        id: "fee-1",
        name: "Default instant-book fee",
        targetLabel: "Direct service booking",
        feeLabel: "12%",
        chargeRule: "Charge 40 PHP on first quote",
      },
      {
        id: "fee-2",
        name: "Quote-match fee",
        targetLabel: "Quote-selected booking",
        feeLabel: "10%",
        chargeRule: "No extra charge when editing quote",
      },
    ],
    bannerItems: [
      {
        id: "banner-1",
        title: "Rainy season aircon cleaning promo",
        placement: "Home hero",
        statusLabel: "Published",
        activePeriod: "2026-04-13 ~ 2026-04-30",
      },
      {
        id: "banner-2",
        title: "New tradesman recruitment banner",
        placement: "Categories page",
        statusLabel: "Scheduled",
        activePeriod: "2026-05-01 ~ 2026-05-15",
      },
    ],
    noticeItems: [
      {
        id: "notice-1",
        title: "Credit top-up maintenance notice",
        audienceLabel: "Tradesmen",
        statusLabel: "Published",
        publishedAt: "2026-04-12 09:00",
      },
      {
        id: "notice-2",
        title: "Holy Week support hours",
        audienceLabel: "All users",
        statusLabel: "Draft",
        publishedAt: "Before publish",
      },
    ],
    approvalQueue: [
      {
        id: "approval-1",
        tradesmanName: "Kevin Mendoza",
        categoryLabel: "Electrical",
        submittedAt: "2026-04-12 14:20",
        verificationLabel: "Certificate check needed",
      },
      {
        id: "approval-2",
        tradesmanName: "Aira Lopez",
        categoryLabel: "Cleaning",
        submittedAt: "2026-04-12 16:10",
        verificationLabel: "ID review complete",
      },
    ],
    oneOutCases: [
      {
        id: "risk-1",
        tradesmanName: "Rico Alonzo",
        issueSummary: "Reported for abusive behavior and unauthorized extra charge",
        riskLevel: "High",
        lastActionAt: "2026-04-12 18:40",
      },
      {
        id: "risk-2",
        tradesmanName: "Dan Cruz",
        issueSummary: "Left work unfinished and stopped replying",
        riskLevel: "Medium",
        lastActionAt: "2026-04-11 11:00",
      },
    ],
  },
  en: {
    categories: [
      {
        slug: "aircon-cleaning",
        name: "Aircon Cleaning",
        shortDescription:
          "Quickly connects customers with residential and small commercial aircon cleaning.",
        startingPrice: "From PHP 900",
      },
      {
        slug: "plumbing",
        name: "Plumbing",
        shortDescription:
          "Best for urgent work like leaks, clogged drains, and faucet replacement.",
        startingPrice: "From PHP 700",
      },
      {
        slug: "electrical",
        name: "Electrical",
        shortDescription:
          "Covers lighting, outlets, and small electrical repair work.",
        startingPrice: "From PHP 850",
      },
      {
        slug: "cleaning",
        name: "Cleaning",
        shortDescription:
          "Works for home cleaning, move-in cleaning, and basic office cleaning.",
        startingPrice: "From PHP 650",
      },
      {
        slug: "furniture-assembly",
        name: "Furniture Assembly",
        shortDescription:
          "A good fit for beds, desks, cabinets, and other easy instant-book jobs.",
        startingPrice: "From PHP 500",
      },
      {
        slug: "painting",
        name: "Painting",
        shortDescription:
          "Great for quote comparison on room repainting and partial wall repair.",
        startingPrice: "From PHP 1,500",
      },
      {
        slug: "moving",
        name: "Moving",
        shortDescription: "For small moves, hauling, and extra packing assistance.",
        startingPrice: "From PHP 2,200",
      },
    ],
    featuredServices: [
      {
        id: "svc-1",
        slug: "same-day-aircon-cleaning",
        title: "Same-day aircon deep cleaning",
        categorySlug: "aircon-cleaning",
        providerName: "Jose Santos",
        providerSlug: "jose-santos",
        location: "Quezon City",
        priceLabel: "PHP 1,200 ~ 1,800",
        rating: 4.9,
        reviewCount: 184,
        arrival: "Available within 2 hours today",
        tags: ["Instant booking", "Filter wash included", "On-site photo update"],
      },
      {
        id: "svc-2",
        slug: "plumbing-fix-leak",
        title: "Urgent sink leak repair",
        categorySlug: "plumbing",
        providerName: "Miguel Reyes",
        providerSlug: "miguel-reyes",
        location: "Makati",
        priceLabel: "PHP 900 ~ 1,500",
        rating: 4.8,
        reviewCount: 96,
        arrival: "Available tonight",
        tags: ["Instant booking", "Parts assistance", "Night support"],
      },
      {
        id: "svc-3",
        slug: "furniture-assembly-ikea-style",
        title: "Full furniture assembly service",
        categorySlug: "furniture-assembly",
        providerName: "Carlo Dizon",
        providerSlug: "carlo-dizon",
        location: "Taguig",
        priceLabel: "PHP 500 ~ 1,100",
        rating: 4.7,
        reviewCount: 71,
        arrival: "Available tomorrow morning",
        tags: ["Instant booking", "Tools included", "Packing cleanup"],
      },
    ],
    quoteRequests: [
      {
        id: "qr-1",
        serviceName: "Partial repaint for living room wall",
        location: "Pasig",
        budgetLabel: "PHP 3,000 ~ 5,000",
        targetDate: "2026-04-15",
        summary:
          "There are mold marks on part of the wall, and I want it sanded and painted again.",
        bidsCount: 4,
        status: "open",
      },
      {
        id: "qr-2",
        serviceName: "Help moving a 2BR condo",
        location: "Mandaluyong → BGC",
        budgetLabel: "PHP 4,500 ~ 7,000",
        targetDate: "2026-04-18",
        summary:
          "An elevator booking is available, and there are around 18 boxes to move.",
        bidsCount: 6,
        status: "matched",
      },
    ],
    quoteOffers: [
      {
        id: "qt-1",
        requestId: "qr-1",
        tradesmanName: "Ramon Velasco",
        tradesmanSlug: "ramon-velasco",
        amountLabel: "PHP 3,400",
        arrivalText: "Apr 15, 9:00 AM",
        message:
          "I will repair the damaged area first and match the color. Materials are included.",
        rating: 4.9,
        completedJobs: 132,
      },
      {
        id: "qt-2",
        requestId: "qr-1",
        tradesmanName: "Leo Navarro",
        tradesmanSlug: "leo-navarro",
        amountLabel: "PHP 3,950",
        arrivalText: "Apr 15, 1:00 PM",
        message:
          "I will compare paint samples on-site before starting the work.",
        rating: 4.8,
        completedJobs: 88,
      },
      {
        id: "qt-3",
        requestId: "qr-2",
        tradesmanName: "MoveFast Crew",
        tradesmanSlug: "movefast-crew",
        amountLabel: "PHP 5,600",
        arrivalText: "Apr 18, 8:00 AM",
        message:
          "Includes 2 movers and a small truck, with basic protective packing support.",
        rating: 4.7,
        completedJobs: 210,
      },
    ],
    bookings: [
      {
        id: "bk-1",
        title: "Same-day aircon cleaning",
        customerName: "Maria Cruz",
        tradesmanName: "Jose Santos",
        dateLabel: "Today, 3:00 PM",
        location: "Quezon City",
        status: "accepted",
        mode: "instant-booking",
      },
      {
        id: "bk-2",
        title: "2BR condo move",
        customerName: "Anne Flores",
        tradesmanName: "MoveFast Crew",
        dateLabel: "Apr 18, 8:00 AM",
        location: "Mandaluyong",
        status: "pending",
        mode: "quote-match",
      },
      {
        id: "bk-3",
        title: "Partial living room paint",
        customerName: "Paolo Ramos",
        tradesmanName: "Ramon Velasco",
        dateLabel: "Apr 15, 9:00 AM",
        location: "Pasig",
        status: "in-progress",
        mode: "quote-match",
      },
    ],
    tradesmenProfiles: [
      {
        slug: "jose-santos",
        name: "Jose Santos",
        headline:
          "Field expert for aircon cleaning and basic electrical checking",
        bio:
          "He has 8 years of experience working in condos, townhouses, and small shops. Even when the customer shares only photos, he prepares the needed tools and parts ahead of time.",
        skills: ["Aircon cleaning", "Drain inspection", "Basic electrical check"],
        certificates: ["TESDA Refrigeration NC II", "Site safety training"],
        portfolio: [
          "Deep cleaning for 3 wall-mounted aircon units",
          "Filter restoration for a small cafe aircon",
          "Drain blockage fix with final testing",
        ],
        serviceAreas: ["Quezon City", "Makati", "Pasig"],
        rating: 4.9,
        reviewCount: 184,
        completedJobs: 312,
        responseTime: "Average 7 min",
        startingPrice: "From PHP 900",
        reviews: [
          {
            id: "rv-1",
            author: "Maria Cruz",
            rating: 5,
            comment:
              "His explanation was easy to understand because he reviewed the photos before arriving.",
          },
          {
            id: "rv-2",
            author: "Ben Torres",
            rating: 5,
            comment:
              "He arrived on time, and the before-and-after photos made the work feel trustworthy.",
          },
        ],
      },
      {
        slug: "ramon-velasco",
        name: "Ramon Velasco",
        headline:
          "Strong at partial repair work and interior painting quote comparison",
        bio:
          "Even for small jobs, he works carefully. He explains the repair scope clearly before starting.",
        skills: ["Painting", "Wall repair", "Mold treatment"],
        certificates: ["Building paint safety training"],
        portfolio: [
          "Single wall repaint",
          "Ceiling leak mark repair",
          "Office touch-up painting",
        ],
        serviceAreas: ["Pasig", "Taguig", "Mandaluyong"],
        rating: 4.9,
        reviewCount: 103,
        completedJobs: 198,
        responseTime: "Average 12 min",
        startingPrice: "From PHP 1,500",
        reviews: [
          {
            id: "rv-3",
            author: "Paolo Ramos",
            rating: 5,
            comment:
              "The quote was clean and easy to understand, especially the cost breakdown.",
          },
        ],
      },
    ],
    chatPreviews: [
      {
        id: "chat-1",
        participantName: "Jose Santos",
        jobTitle: "Same-day aircon cleaning",
        lastMessage:
          "If possible, please send a photo of the filter too so I can prepare the tools.",
        updatedAt: "Just now",
        unreadCount: 2,
      },
      {
        id: "chat-2",
        participantName: "MoveFast Crew",
        jobTitle: "2BR condo move",
        lastMessage: "Please confirm the elevator booking time.",
        updatedAt: "12 min ago",
        unreadCount: 0,
      },
    ],
    customerDashboardStats: [
      {
        label: "Active bookings",
        value: "3",
        helper:
          "This includes both instant bookings and quote-matched bookings.",
      },
      {
        label: "Received quotes",
        value: "10",
        helper:
          "This is the number of quotes available for comparison on open requests.",
      },
      {
        label: "Average response time",
        value: "9 min",
        helper:
          "Nearby tradesmen are notified first so replies can come in faster.",
      },
    ],
    tradesmanDashboardStats: [
      {
        label: "New quote requests",
        value: "6",
        helper:
          "Only requests matching your service area and category are sent to you.",
      },
      {
        label: "Bookings this week",
        value: "8",
        helper:
          "This count includes instant bookings and accepted quote bookings.",
      },
      {
        label: "Total quote fees",
        value: "PHP 12,800",
        helper:
          "This is the total 40 PHP fee deducted on first quote submissions.",
      },
    ],
    adminAlerts: [
      {
        id: "ad-1",
        type: "approval",
        title: "12 tradesman approvals pending",
        description:
          "New tradesmen need their certificates and service areas reviewed.",
        actionLabel: "Review approvals",
      },
      {
        id: "ad-2",
        type: "dispute",
        title: "3 disputes in progress",
        description:
          "These cases need report and proof-photo review.",
        actionLabel: "View disputes",
      },
      {
        id: "ad-3",
        type: "risk",
        title: "1 one-out warning candidate",
        description:
          "A serious complaint was filed, and the admin needs to decide whether to suspend immediately.",
        actionLabel: "Review risk",
      },
    ],
    adminCategories: [
      {
        id: "cat-admin-1",
        slug: "aircon-cleaning",
        nameKo: "에어컨 청소",
        nameFil: "Aircon Cleaning",
        nameEn: "Aircon Cleaning",
        descriptionKo: "가정용과 소형 상업용 에어컨 청소를 빠르게 연결합니다.",
        descriptionFil:
          "Mabilis na koneksyon para sa residential at maliit na commercial aircon cleaning.",
        descriptionEn:
          "Quickly connects customers with residential and small commercial aircon cleaning.",
        serviceCount: 34,
        statusLabel: "Live",
        sortOrder: 1,
        featured: true,
        isActive: true,
      },
      {
        id: "cat-admin-2",
        slug: "plumbing",
        nameKo: "배관",
        nameFil: "Plumbing",
        nameEn: "Plumbing",
        descriptionKo: "누수, 배수, 수도꼭지 교체 같은 긴급 작업에 맞습니다.",
        descriptionFil:
          "Para ito sa mga urgent na trabaho gaya ng tagas, bara, at pagpapalit ng gripo.",
        descriptionEn:
          "Fits urgent jobs such as leaks, drain issues, and faucet replacement.",
        serviceCount: 22,
        statusLabel: "Live",
        sortOrder: 2,
        featured: false,
        isActive: true,
      },
      {
        id: "cat-admin-3",
        slug: "moving",
        nameKo: "이사",
        nameFil: "Moving",
        nameEn: "Moving",
        descriptionKo: "소형 이사, 운반, 포장 도움 요청까지 묶어서 받을 수 있습니다.",
        descriptionFil:
          "Para sa small moves, hauling, at dagdag na packing assistance.",
        descriptionEn:
          "Covers small moves, hauling, and extra packing assistance in one category.",
        serviceCount: 11,
        statusLabel: "For review",
        sortOrder: 7,
        featured: false,
        isActive: false,
      },
    ],
    platformFees: [
      {
        id: "fee-1",
        name: "Default instant-book fee",
        targetLabel: "Direct service booking",
        feeLabel: "12%",
        chargeRule: "Charge 40 PHP on first quote",
      },
      {
        id: "fee-2",
        name: "Quote-match fee",
        targetLabel: "Quote-selected booking",
        feeLabel: "10%",
        chargeRule: "No extra charge when editing quote",
      },
    ],
    bannerItems: [
      {
        id: "banner-1",
        title: "Rainy season aircon cleaning promo",
        placement: "Home hero",
        statusLabel: "Published",
        activePeriod: "2026-04-13 ~ 2026-04-30",
      },
      {
        id: "banner-2",
        title: "New tradesman recruitment banner",
        placement: "Categories page",
        statusLabel: "Scheduled",
        activePeriod: "2026-05-01 ~ 2026-05-15",
      },
    ],
    noticeItems: [
      {
        id: "notice-1",
        title: "Credit top-up maintenance notice",
        audienceLabel: "Tradesmen",
        statusLabel: "Published",
        publishedAt: "2026-04-12 09:00",
      },
      {
        id: "notice-2",
        title: "Holy Week support hours",
        audienceLabel: "All users",
        statusLabel: "Draft",
        publishedAt: "Before publish",
      },
    ],
    approvalQueue: [
      {
        id: "approval-1",
        tradesmanName: "Kevin Mendoza",
        categoryLabel: "Electrical",
        submittedAt: "2026-04-12 14:20",
        verificationLabel: "Certificate check needed",
      },
      {
        id: "approval-2",
        tradesmanName: "Aira Lopez",
        categoryLabel: "Cleaning",
        submittedAt: "2026-04-12 16:10",
        verificationLabel: "ID review complete",
      },
    ],
    oneOutCases: [
      {
        id: "risk-1",
        tradesmanName: "Rico Alonzo",
        issueSummary:
          "Reported for abusive behavior and unauthorized extra charges",
        riskLevel: "High",
        lastActionAt: "2026-04-12 18:40",
      },
      {
        id: "risk-2",
        tradesmanName: "Dan Cruz",
        issueSummary:
          "Left work unfinished and stopped replying to the customer",
        riskLevel: "Medium",
        lastActionAt: "2026-04-11 11:00",
      },
    ],
  },
};

export function getCategories(locale: Locale): Category[] {
  return localizedMockData[locale].categories;
}

export function getFeaturedServices(locale: Locale): ServiceSummary[] {
  return localizedMockData[locale].featuredServices;
}

export function getQuoteRequests(locale: Locale): QuoteRequestPreview[] {
  return localizedMockData[locale].quoteRequests;
}

export function getQuoteOffers(locale: Locale): QuoteOffer[] {
  return localizedMockData[locale].quoteOffers;
}

export function getBookings(locale: Locale): BookingPreview[] {
  return localizedMockData[locale].bookings;
}

export function getTradesmenProfiles(locale: Locale): TradesmanProfileData[] {
  return localizedMockData[locale].tradesmenProfiles;
}

export function getChatPreviews(locale: Locale): ChatPreview[] {
  return localizedMockData[locale].chatPreviews;
}

export function getCustomerDashboardStats(locale: Locale): DashboardStat[] {
  return localizedMockData[locale].customerDashboardStats;
}

export function getTradesmanDashboardStats(locale: Locale): DashboardStat[] {
  return localizedMockData[locale].tradesmanDashboardStats;
}

export function getAdminAlerts(locale: Locale): AdminAlert[] {
  return localizedMockData[locale].adminAlerts;
}

export function getAdminCategories(locale: Locale): AdminCategoryItem[] {
  return localizedMockData[locale].adminCategories;
}

export function getPlatformFees(locale: Locale): PlatformFeeItem[] {
  return localizedMockData[locale].platformFees;
}

export function getBannerItems(locale: Locale): BannerItem[] {
  return localizedMockData[locale].bannerItems;
}

export function getNoticeItems(locale: Locale): NoticeItem[] {
  return localizedMockData[locale].noticeItems;
}

export function getApprovalQueue(locale: Locale): ApprovalQueueItem[] {
  return localizedMockData[locale].approvalQueue;
}

export function getOneOutCases(locale: Locale): OneOutCaseItem[] {
  return localizedMockData[locale].oneOutCases;
}
