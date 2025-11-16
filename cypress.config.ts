import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    async setupNodeEvents(on, config) {
      // implement node event listeners here
      // Provide a task to seed an application into the database for E2E tests
      on("task", {
        async "db:createApplication"(opts: { jobId: number }) {
          try {
            const { prisma } = await import("./src/lib/db");

            const jobId = Number(opts.jobId);
            if (!jobId) return { error: "jobId is required" };

            const job = await prisma.jobPost.findUnique({ where: { id: jobId } });
            if (!job) return { error: `Job ${jobId} not found` };

            const ts = Date.now();
            const email = `e2e.student.${ts}@example.test`;

            // Create an account
            const account = await prisma.account.create({
              data: {
                email,
                created_at: new Date(),
                updated_at: new Date(),
              },
            });

            // Create student record
            const student = await prisma.student.create({
              data: {
                account_id: account.id,
                student_id: `S${ts}`,
                name: `E2E Student ${ts}`,
                faculty: "Test Faculty",
                year: "4",
                phone: "0000000000",
                email_verified: true,
                verification_status: "APPROVED",
                created_at: new Date(),
                updated_at: new Date(),
              },
            });

            // Ensure a document type exists
            const docType = await prisma.documentType.findFirst();
            const docTypeId = docType ? docType.id : 1;

            // Create a resume document placeholder
            const resume = await prisma.document.create({
              data: {
                account_id: account.id,
                doc_type_id: docTypeId,
                file_path: `e2e/resume-${ts}.pdf`,
                file_name: `resume-${ts}.pdf`,
                created_at: new Date(),
              },
            });

            // Create the application
            const application = await prisma.application.create({
              data: {
                student_id: student.id,
                job_post_id: jobId,
                status: 1,
                resume_id: resume.id,
                updated_at: new Date(),
              },
              include: {
                jobPost: true,
                student: true,
                resumeDocument: true,
              },
            });

            return { success: true, application };
          } catch (error) {
            console.error("db:createApplication task error:", error);
            return { error: String(error) };
          }
        },
      });

      return config;
    },
  },
});
