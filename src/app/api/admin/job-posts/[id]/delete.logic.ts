import { prisma } from "@/lib/db";

export async function deleteJobPost(params: { id: string }) {
    const trimmedId = params.id.trim();
    const jobPostId = parseInt(trimmedId, 10);

    if (isNaN(jobPostId) || jobPostId <= 0) {
        throw new Error("Invalid job post ID");
    }

    try {
        await prisma.jobPost.delete({
            where: {id: jobPostId},
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const prismaError = error as { code?: string };
            if (prismaError.code === "P2025") {
                throw new Error("Job post not found");
            }
            throw error;
        }
        throw new Error("Unexpected error");
    }
}