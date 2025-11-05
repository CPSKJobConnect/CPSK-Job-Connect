import { prisma } from "@/lib/db";

/**
 * Notify all admin users with a message
 * @param message - The notification message to send
 * @param senderId - Optional sender account ID (null for system notifications)
 * @returns Promise<number> - Number of admins notified
 */
export async function notifyAdmins(
  message: string,
  senderId: number | null = null
): Promise<number> {
  try {
    // Get admin role
    const adminRole = await prisma.accountRole.findFirst({
      where: { name: { equals: "admin", mode: "insensitive" } }
    });

    if (!adminRole) {
      console.error("❌ Admin role not found in database");
      return 0;
    }

    // Get all admin accounts
    const admins = await prisma.account.findMany({
      where: { role: adminRole.id },
      select: { id: true, email: true }
    });

    if (admins.length === 0) {
      console.warn("⚠️ No admin accounts found");
      return 0;
    }

    // Create notifications for all admins
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        account_id: admin.id,
        sender_id: senderId,
        message,
        is_read: false
      }))
    });

    console.log(`✅ Notified ${admins.length} admin(s): "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
    return admins.length;

  } catch (error) {
    console.error("❌ Error notifying admins:", error);
    return 0;
  }
}

/**
 * Notify all admins about a new alumni registration
 */
export async function notifyAdminsNewAlumni(
  studentName: string,
  studentId: string,
  accountId: number
): Promise<void> {
  await notifyAdmins(
    `🎓 New alumni "${studentName}" (ID: ${studentId}) has registered and needs verification.`,
    accountId
  );
}

/**
 * Notify all admins about an alumni re-application
 */
export async function notifyAdminsAlumniReapplication(
  studentName: string,
  studentId: string,
  accountId: number
): Promise<void> {
  await notifyAdmins(
    `📄 Alumni "${studentName}" (ID: ${studentId}) has re-uploaded their transcript for review.`,
    accountId
  );
}

/**
 * Notify all admins about a new company registration
 */
export async function notifyAdminsNewCompany(
  companyName: string,
  accountId: number
): Promise<void> {
  await notifyAdmins(
    `🏢 New company "${companyName}" has registered and needs approval.`,
    accountId
  );
}
