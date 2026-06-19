import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/auditLog";
import {
  AdminAccessDeniedError,
  assertUserCanBeManagedByAdmin,
  requireAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import { grantToolsAccessToUser } from "@/lib/accessControl";
import { DEFAULT_ACCESS_DAYS } from "@/lib/constants";
import { sendAccessGrantedEmail } from "@/lib/emailService";
import { prisma } from "@/lib/prisma";

const grantSchema = z.object({
  toolSlugs: z.array(z.string().min(1)).min(1),
  validityDays: z.coerce.number().min(1).default(DEFAULT_ACCESS_DAYS),
  sendEmail: z.boolean().default(false),
});

function handleAdminError(error: unknown) {
  if (error instanceof SuperAdminProtectedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AdminAccessDeniedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const message = error instanceof Error ? error.message : "Erro interno.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    await assertUserCanBeManagedByAdmin(params.id, admin);

    const parsed = grantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const result = await grantToolsAccessToUser({
      userId: params.id,
      toolSlugs: parsed.data.toolSlugs,
      validityDays: parsed.data.validityDays,
      source: "admin",
      notes: `Liberado por ${admin.email}`,
    });

    let emailSent = false;
    if (parsed.data.sendEmail && result.toolNames.length > 0) {
      emailSent = await sendAccessGrantedEmail({
        name: user.name,
        email: user.email,
        toolName: result.toolNames.join(", "),
        isNewUser: false,
        expiresAt: result.latestExpiresAt,
      });
    }

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.grant_access",
      targetType: "user",
      targetId: params.id,
      metadata: {
        toolSlugs: parsed.data.toolSlugs,
        grantedModules: result.grantedModules,
        validityDays: parsed.data.validityDays,
        sendEmail: parsed.data.sendEmail,
        emailSent,
      },
    });

    return NextResponse.json({
      success: true,
      grantedModules: result.grantedModules,
      toolNames: result.toolNames,
      expiresAt: result.latestExpiresAt?.toISOString() ?? null,
      emailSent,
    });
  } catch (error) {
    return handleAdminError(error);
  }
}
