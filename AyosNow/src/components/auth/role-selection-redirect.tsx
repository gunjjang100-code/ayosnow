"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleSelectionRedirectProps {
  enabled: boolean;
}

export function RoleSelectionRedirect({ enabled }: RoleSelectionRedirectProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || pathname === "/choose-role") {
      return;
    }

    const callbackUrl = encodeURIComponent(pathname || "/");
    router.replace(`/choose-role?callbackUrl=${callbackUrl}`);
  }, [enabled, pathname, router]);

  return null;
}
