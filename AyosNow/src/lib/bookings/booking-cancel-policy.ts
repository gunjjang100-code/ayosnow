import { BookingStatus } from "@prisma/client";

type ActorRole = "customer" | "tradesman" | "admin";

export function canCancelBooking(params: {
  status: BookingStatus;
  actorRole: ActorRole;
}) {
  if (
    params.status === BookingStatus.COMPLETED ||
    params.status === BookingStatus.CANCELLED
  ) {
    return false;
  }

  if (params.status === BookingStatus.IN_PROGRESS) {
    return params.actorRole === "admin";
  }

  return (
    params.status === BookingStatus.PENDING ||
    params.status === BookingStatus.ACCEPTED
  );
}
