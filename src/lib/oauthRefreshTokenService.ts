import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GOOGLE_OAUTH_PROVIDER, getRefreshTokenPepper } from "@/lib/securityConstants";

function createRefreshTokenHash(refreshToken: string) {
  const pepper = getRefreshTokenPepper();
  return crypto.createHash("sha256").update(`${refreshToken}:${pepper}`).digest("hex");
}

export async function rotateGoogleRefreshToken(accountId: number, refreshToken: string) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = createRefreshTokenHash(refreshToken);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.oAuthRefreshToken.updateMany({
        where: {
          account_id: accountId,
          provider: GOOGLE_OAUTH_PROVIDER,
          revoked_at: null,
        },
        data: {
          revoked_at: new Date(),
          rotated_at: new Date(),
        },
      });

      await tx.oAuthRefreshToken.create({
        data: {
          account_id: accountId,
          provider: GOOGLE_OAUTH_PROVIDER,
          token_hash: tokenHash,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await prisma.oAuthRefreshToken.update({
        where: { token_hash: tokenHash },
        data: {
          replay_detected_at: new Date(),
          revoked_at: new Date(),
        },
      });
      throw new Error("REFRESH_TOKEN_REPLAY_DETECTED");
    }
    throw error;
  }
}
