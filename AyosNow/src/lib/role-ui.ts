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

  return values.en;
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
    fil: "Profile ko",
    en: "My profile",
  });

  if (role === "tradesman") {
    return {
      roleBadgeLabel: getLocalizedValue(locale, {
        fil: "Tradesman",
        en: "Tradesman",
      }),
      items: getLocalizedValue(locale, {
        fil: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "Paano gumagana", href: "/how-it-works" },
          { label: "Mga Promotional Video", href: "/promotional-videos" },
          { label: "Incoming requests", href: "/requests" },
          { label: "Bookings at trabaho", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Aking serbisyo", href: "/my-services" },
          { label: "Availability", href: "/availability" },
          { label: "Credits", href: "/settlements" },
        ],
        en: [
          { label: "Dashboard", href: "/dashboard" },
          { label: "How it works", href: "/how-it-works" },
          { label: "Promotional Videos", href: "/promotional-videos" },
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
        fil: "Admin",
        en: "Admin",
      }),
      items: getLocalizedValue(locale, {
        fil: [
          { label: "Admin center", href: "/admin" },
          { label: "Paano gumagana", href: "/how-it-works" },
          { label: "Mga Promotional Video", href: "/promotional-videos" },
          { label: "Pamahalaan ang videos", href: "/admin/promotional-videos" },
          { label: "Professional badges", href: "/admin#professional-badges" },
          { label: "Credit management", href: "/admin/wallets" },
          { label: "Booking monitor", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Dashboard", href: "/dashboard" },
        ],
        en: [
          { label: "Admin center", href: "/admin" },
          { label: "How it works", href: "/how-it-works" },
          { label: "Promotional Videos", href: "/promotional-videos" },
          { label: "Manage videos", href: "/admin/promotional-videos" },
          { label: "Professional badges", href: "/admin#professional-badges" },
          { label: "Credit management", href: "/admin/wallets" },
          { label: "Booking monitor", href: "/bookings" },
          { label: "Chat", href: "/chat" },
          { label: "Dashboard", href: "/dashboard" },
        ],
      }),
      primaryAction: {
        href: "/admin",
        label: getLocalizedValue(locale, {
          fil: "Admin center",
          en: "Admin center",
        }),
      },
      profileLabel,
    };
  }

  return {
    roleBadgeLabel: getLocalizedValue(locale, {
      fil: "Customer",
      en: "Customer",
    }),
    items: getLocalizedValue(locale, {
      fil: [
        { label: "Home", href: "/" },
        { label: "Paano gumagana", href: "/how-it-works" },
        { label: "Mga Promotional Video", href: "/promotional-videos" },
        { label: "Mga Kategorya", href: "/categories" },
        { label: "Mga Serbisyo", href: "/services" },
        { label: "Quote request", href: "/quote-request" },
        { label: "Quotes", href: "/quotes" },
        { label: "Chat", href: "/chat" },
        { label: "Bookings", href: "/bookings" },
      ],
      en: [
        { label: "Home", href: "/" },
        { label: "How it works", href: "/how-it-works" },
        { label: "Promotional Videos", href: "/promotional-videos" },
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
