import { isAccessExpired } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export async function getAdminDashboardStats() {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const [
    totalUsers,
    activeAccesses,
    expiredAccesses,
    expiringSoon,
    totalTools,
    totalDecodeLogs,
    recentUsers,
    recentWebhooks,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "customer" } }),
    prisma.userModule.count({
      where: { accessStatus: "active", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    }),
    prisma.userModule.count({
      where: {
        OR: [
          { accessStatus: "expired" },
          { expiresAt: { lt: now } },
        ],
      },
    }),
    prisma.userModule.count({
      where: {
        accessStatus: "active",
        expiresAt: { gt: now, lte: in30Days },
      },
    }),
    prisma.tool.count(),
    prisma.decodeLog.count(),
    prisma.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.paymentEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    totalUsers,
    activeAccesses,
    expiredAccesses,
    expiringSoon,
    totalTools,
    totalDecodeLogs,
    recentUsers,
    recentWebhooks,
  };
}

export async function markExpiredAccesses() {
  const now = new Date();
  const result = await prisma.userModule.updateMany({
    where: {
      accessStatus: "active",
      expiresAt: { lt: now },
    },
    data: {
      accessStatus: "expired",
      status: "expired",
    },
  });
  return result.count;
}
