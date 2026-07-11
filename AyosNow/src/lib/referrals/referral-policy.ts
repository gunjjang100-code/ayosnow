import { UserRole } from "@prisma/client";

export function canGrantProfessionalReferralReward(params: {
  referrerRole: UserRole | null | undefined;
  referredRole: UserRole;
}) {
  return (
    params.referrerRole === UserRole.TRADESMAN &&
    params.referredRole === UserRole.TRADESMAN
  );
}
