import type { Locale, NavigationItem, UserRole } from "@/lib/types";

type RoleWorkspace = "customer-marketplace" | "tradesman-workspace" | "admin-workspace";

interface RoleNavigationConfig {
  items: NavigationItem[];
  primaryAction: {
    href: string;
    label: string;
  };
  profileLabel: string;
  roleBadgeLabel: string;
}

interface RoleAccessNoticeCopy {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

function getLocalizedValue<T>(
  locale: Locale,
  values: {
    ko: T;
    fil: T;
    en: T;
  },
) {
  if (locale === "fil") {
    return values.fil;
  }

  if (locale === "en") {
    return values.en;
  }

  return values.ko;
}

export function getRoleHomePath(role: UserRole) {
  if (role === "tradesman") {
    return "/dashboard";
  }

  if (role === "admin") {
    return "/admin";
  }

  return "/";
}

export function canAccessCustomerMarketplace(role: UserRole) {
  return role === "customer";
}

export function canAccessTradesmanWorkspace(role: UserRole) {
  return role === "tradesman" || role === "admin";
}

export function canAccessAdminWorkspace(role: UserRole) {
  return role === "admin";
}

export function getRoleNavigationConfig(
  locale: Locale,
  role: UserRole,
): RoleNavigationConfig {
  const profileLabel = getLocalizedValue(locale, {
    ko: "내 프로필",
    fil: "Profile ko",
    en: "My profile",
  });

  if (role === "tradesman") {
    return {
      roleBadgeLabel: getLocalizedValue(locale, {
        ko: "전문가",
        fil: "Tradesman",
        en: "Tradesman",
      }),
      items: getLocalizedValue(locale, {
        ko: [
          { label: "대시보드", href: "/dashboard" },
          { label: "받은 요청", href: "/requests" },
          { label: "예약/작업 관리", href: "/bookings" },
          { label: "채팅", href: "/chat" },
          { label: "내 서비스", href: "/my-services" },
          { label: "가능 시간 관리", href: "/availability" },
          { label: "크레딧", href: "/settlements" },
        ],
        fil: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mga natanggap na request", href: "/requests" },
          { label: "Bookings at trabaho", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Aking serbisyo", href: "/my-services" },
          { label: "Available hours", href: "/availability" },
          { label: "Credits", href: "/settlements" },
        ],
        en: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Incoming requests", href: "/requests" },
          { label: "Bookings & jobs", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "My services", href: "/my-services" },
          { label: "Availability", href: "/availability" },
          { label: "Credits", href: "/settlements" },
        ],
      }),
      primaryAction: {
        href: "/requests",
        label: getLocalizedValue(locale, {
          ko: "받은 요청 보기",
          fil: "Tingnan ang requests",
          en: "View requests",
        }),
      },
      profileLabel,
    };
  }

  if (role === "admin") {
    return {
      roleBadgeLabel: getLocalizedValue(locale, {
        ko: "관리자",
        fil: "Admin",
        en: "Admin",
      }),
      items: getLocalizedValue(locale, {
        ko: [
          { label: "운영 센터", href: "/admin" },
          { label: "크레딧 관리", href: "/admin/wallets" },
          { label: "예약 모니터링", href: "/bookings" },
          { label: "채팅", href: "/chat" },
          { label: "대시보드", href: "/dashboard" },
        ],
        fil: [
          { label: "Admin center", href: "/admin" },
          { label: "Credit management", href: "/admin/wallets" },
          { label: "Booking monitor", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Dashboard", href: "/dashboard" },
        ],
        en: [
          { label: "Admin center", href: "/admin" },
          { label: "Credit management", href: "/admin/wallets" },
          { label: "Booking monitor", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Dashboard", href: "/dashboard" },
        ],
      }),
      primaryAction: {
        href: "/admin",
        label: getLocalizedValue(locale, {
          ko: "운영 센터",
          fil: "Admin center",
          en: "Admin center",
        }),
      },
      profileLabel,
    };
  }

  return {
    roleBadgeLabel: getLocalizedValue(locale, {
      ko: "고객",
      fil: "Customer",
      en: "Customer",
    }),
    items: getLocalizedValue(locale, {
      ko: [
        { label: "홈", href: "/" },
        { label: "카테고리", href: "/categories" },
        { label: "서비스", href: "/services" },
        { label: "견적요청", href: "/quote-request" },
        { label: "견적목록", href: "/quotes" },
        { label: "채팅", href: "/chat" },
        { label: "예약", href: "/bookings" },
      ],
      fil: [
        { label: "Home", href: "/" },
        { label: "Mga Kategorya", href: "/categories" },
        { label: "Mga Serbisyo", href: "/services" },
        { label: "Humiling ng quote", href: "/quote-request" },
        { label: "Mga quote", href: "/quotes" },
        { label: "Chat", href: "/chat" },
        { label: "Mga booking", href: "/bookings" },
      ],
      en: [
        { label: "Home", href: "/" },
        { label: "Categories", href: "/categories" },
        { label: "Services", href: "/services" },
        { label: "Quote request", href: "/quote-request" },
        { label: "Quotes", href: "/quotes" },
        { label: "Chat", href: "/chat" },
        { label: "Bookings", href: "/bookings" },
      ],
    }),
    primaryAction: {
      href: "/quote-request",
      label: getLocalizedValue(locale, {
        ko: "요청 시작",
        fil: "Humiling ngayon",
        en: "Start request",
      }),
    },
    profileLabel,
  };
}

export function getRoleAccessNoticeCopy(params: {
  locale: Locale;
  currentRole: UserRole;
  targetWorkspace: RoleWorkspace;
}): RoleAccessNoticeCopy {
  if (params.targetWorkspace === "customer-marketplace") {
    if (params.currentRole === "tradesman") {
      return getLocalizedValue(params.locale, {
        ko: {
          title: "전문가 계정에서는 고객용 예약 화면이 메인처럼 보이지 않게 막았습니다.",
          description:
            "전문가 모드에서는 서비스 쇼핑보다 받은 요청, 작업 일정, 크레딧 관리가 중심이어야 합니다. 아래 버튼으로 전문가 작업 화면으로 이동해 주세요.",
          actionHref: "/dashboard",
          actionLabel: "전문가 대시보드로 이동",
        },
        fil: {
          title: "Hindi ito ang pangunahing screen para sa tradesman account.",
          description:
            "Sa tradesman mode, mas mahalaga ang incoming requests, jobs, at credits kaysa sa customer booking flow. Gamitin ang button sa ibaba.",
          actionHref: "/dashboard",
          actionLabel: "Pumunta sa tradesman dashboard",
        },
        en: {
          title: "This customer booking screen is not the main workspace for a tradesman account.",
          description:
            "In tradesman mode, incoming requests, jobs, and credits should come first. Use the button below to move into the tradesman workspace.",
          actionHref: "/dashboard",
          actionLabel: "Open tradesman dashboard",
        },
      });
    }

    return getLocalizedValue(params.locale, {
      ko: {
        title: "관리자 계정에서는 운영 화면이 먼저 보이도록 분리했습니다.",
        description:
          "관리자 모드에서는 고객용 예약 흐름보다 승인, 분쟁, 거래 모니터링이 더 중요합니다. 아래 버튼으로 운영 화면으로 이동해 주세요.",
        actionHref: "/admin",
        actionLabel: "관리자 화면으로 이동",
      },
      fil: {
        title: "Admin mode ito kaya hiwalay ang customer booking screen.",
        description:
          "Mas mahalaga rito ang approvals, disputes, at monitoring kaysa sa customer marketplace flow.",
        actionHref: "/admin",
        actionLabel: "Pumunta sa admin page",
      },
      en: {
        title: "This account is in admin mode, so the customer booking workspace is separated.",
        description:
          "Approvals, disputes, and monitoring are more important here than the customer marketplace flow.",
        actionHref: "/admin",
        actionLabel: "Go to admin page",
      },
    });
  }

  if (params.targetWorkspace === "tradesman-workspace") {
    return getLocalizedValue(params.locale, {
      ko: {
        title: "고객 계정에서는 전문가 전용 작업 화면을 사용할 수 없습니다.",
        description:
          "이 화면은 받은 요청, 서비스 관리, 크레딧처럼 전문가 업무를 다루는 공간입니다. 고객 계정에서는 서비스 탐색과 예약 흐름으로 돌아가는 것이 자연스럽습니다.",
        actionHref: "/services",
        actionLabel: "고객 서비스 화면으로 이동",
      },
      fil: {
        title: "Hindi puwedeng gamitin ng customer account ang tradesman workspace.",
        description:
          "Para ito sa incoming requests, service management, at credits ng tradesman.",
        actionHref: "/services",
        actionLabel: "Bumalik sa customer services",
      },
      en: {
        title: "Customer accounts cannot use the tradesman workspace.",
        description:
          "This area is for incoming requests, service management, and credit work for tradesmen.",
        actionHref: "/services",
        actionLabel: "Back to customer services",
      },
    });
  }

  return getLocalizedValue(params.locale, {
    ko: {
      title: "관리자만 이 화면에 들어올 수 있습니다.",
      description:
        "승인, 제재, 운영 설정은 관리자 전용으로 분리하는 것이 안전합니다. 권한에 맞는 화면으로 이동해 주세요.",
      actionHref: getRoleHomePath(params.currentRole),
      actionLabel: "권한에 맞는 화면으로 이동",
    },
    fil: {
      title: "Admin lang ang puwedeng pumasok sa screen na ito.",
      description:
        "Mas ligtas na hiwalay ang approvals, sanctions, at operational settings para sa admin lang.",
      actionHref: getRoleHomePath(params.currentRole),
      actionLabel: "Pumunta sa tamang workspace",
    },
    en: {
      title: "Only admins can open this screen.",
      description:
        "Approvals, sanctions, and operational settings are safer when they stay inside the admin workspace only.",
      actionHref: getRoleHomePath(params.currentRole),
      actionLabel: "Go to the correct workspace",
    },
  });
}
