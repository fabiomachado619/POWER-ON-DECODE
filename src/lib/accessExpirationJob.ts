import {
  EMAIL_TEMPLATE_SLUGS,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/lib/constants";
import {
  sendAccessExpirationWarningEmail,
  sendAccessExpiredEmail,
} from "@/lib/emailService";
import { isUserModuleActive } from "@/lib/accessControl";
import { prisma } from "@/lib/prisma";

function daysUntil(date: Date): number {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function resolveNotificationType(days: number): NotificationType | null {
  if (days <= 0) return "expired";
  if (days <= 1) return "expires_1d";
  if (days <= 7) return "expires_7d";
  if (days <= 30) return "expires_30d";
  return null;
}

const TEMPLATE_BY_TYPE: Record<NotificationType, string> = {
  expires_30d: EMAIL_TEMPLATE_SLUGS.EXPIRES_30D,
  expires_7d: EMAIL_TEMPLATE_SLUGS.EXPIRES_7D,
  expires_1d: EMAIL_TEMPLATE_SLUGS.EXPIRES_1D,
  expired: EMAIL_TEMPLATE_SLUGS.EXPIRED,
};

export async function processAccessExpirationNotifications(): Promise<{
  processed: number;
  sent: number;
  expiredMarked: number;
}> {
  const accesses = await prisma.userModule.findMany({
    where: {
      accessStatus: "active",
      expiresAt: { not: null },
    },
    include: {
      user: true,
      module: true,
      accessNotifications: true,
    },
  });

  let sent = 0;
  let expiredMarked = 0;

  for (const access of accesses) {
    if (!access.expiresAt) continue;

    const days = daysUntil(access.expiresAt);
    const notificationType = resolveNotificationType(days);
    if (!notificationType) continue;

    if (days <= 0 && isUserModuleActive(access)) {
      await prisma.userModule.update({
        where: { id: access.id },
        data: { accessStatus: "expired", status: "expired" },
      });
      expiredMarked += 1;
    }

    const alreadySent = access.accessNotifications.some(
      (item) => item.type === notificationType
    );
    if (alreadySent) continue;

    const emailSent =
      notificationType === "expired"
        ? await sendAccessExpiredEmail({
            name: access.user.name,
            email: access.user.email,
            toolName: access.module.name,
          })
        : await sendAccessExpirationWarningEmail({
            name: access.user.name,
            email: access.user.email,
            toolName: access.module.name,
            expiresAt: access.expiresAt,
            templateSlug: TEMPLATE_BY_TYPE[notificationType],
          });

    if (emailSent) {
      await prisma.accessNotification.create({
        data: {
          userModuleId: access.id,
          type: notificationType,
        },
      });
      sent += 1;
    }
  }

  return { processed: accesses.length, sent, expiredMarked };
}
