import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestSessionUser } from "@/lib/auth/session";
import { AppError, toErrorResponseStatus } from "@/lib/errors/app-error";
import {
  createManagedService,
  setManagedServicePublished,
  updateManagedService,
} from "@/lib/services/my-services-service";

const managedServiceInputSchema = z.object({
  title: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  priceLabel: z.string().trim().min(3).max(80),
  arrival: z.string().trim().min(3).max(300),
  tags: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
});

const updateManagedServiceSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    serviceId: z.string().cuid(),
    service: managedServiceInputSchema,
  }),
  z.object({
    action: z.literal("set-published"),
    serviceId: z.string().cuid(),
    isPublished: z.boolean(),
  }),
]);

export async function POST(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = managedServiceInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const service = await createManagedService({
      userId: sessionUser.id,
      role: sessionUser.role,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, service });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서비스를 저장하지 못했습니다." },
      { status: toErrorResponseStatus(error, 500) },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const sessionUser = await getRequestSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = updateManagedServiceSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const service =
      parsed.data.action === "update"
        ? await updateManagedService({
            serviceId: parsed.data.serviceId,
            userId: sessionUser.id,
            role: sessionUser.role,
            input: parsed.data.service,
          })
        : await setManagedServicePublished({
            serviceId: parsed.data.serviceId,
            userId: sessionUser.id,
            role: sessionUser.role,
            isPublished: parsed.data.isPublished,
          });

    return NextResponse.json({ ok: true, service });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "서비스를 수정하지 못했습니다." },
      { status: 500 },
    );
  }
}
