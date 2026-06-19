import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/auditLog";
import {
  assertUserCanBeManagedByAdmin,
  requireAdminUser,
  SuperAdminProtectedError,
} from "@/lib/adminAuth";
import { resetUserPasswordToDefault } from "@/lib/accessControl";
import { DEFAULT_USER_PASSWORD } from "@/lib/constants";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminUser();
    await assertUserCanBeManagedByAdmin(params.id, admin);
    await resetUserPasswordToDefault(params.id);

    await logAdminAction({
      adminUserId: admin.id,
      action: "user.reset_password",
      targetType: "user",
      targetId: params.id,
    });

    return NextResponse.json({
      success: true,
      message: `Senha redefinida para ${DEFAULT_USER_PASSWORD}.`,
    });
  } catch (error) {
    if (error instanceof SuperAdminProtectedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
}
