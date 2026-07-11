import { NextResponse, type NextRequest } from "next/server";

import { getRequestSessionUser } from "@/lib/auth/session";
import { toErrorResponseStatus } from "@/lib/errors/app-error";
import { createBookingReview } from "@/lib/reviews/review-service";
import { bookingReviewSchema } from "@/lib/validations/review";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const rawBody = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = bookingReviewSchema.safeParse({
    rating: rawBody?.rating,
    comment: rawBody?.comment,
    photoUrl: rawBody?.photoUrl,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { id } = await params;
    const review = await createBookingReview({
      bookingId: id,
      authorId: sessionUser.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      photoUrl: parsed.data.photoUrl,
    });

    return NextResponse.json({
      ok: true,
      reviewId: review.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save the review.",
      },
      { status: toErrorResponseStatus(error, 400) },
    );
  }
}
