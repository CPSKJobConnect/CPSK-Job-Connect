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
        async "db:createJob"(opts: { title?: string; requiredDocuments?: string[] } = {}) {
          try {
            const { prisma } = await import("./src/lib/db");

            const ts = Date.now();
            const title = opts.title || `E2E Job ${ts}`;
            const requiredDocuments = opts.requiredDocuments || ["Resume", "CV"];

            // Create a company account
            const email = `e2e.company.${ts}@example.test`;
            const account = await prisma.account.create({
              data: {
                email,
                created_at: new Date(),
                updated_at: new Date(),
              },
            });

            // Create company record and mark as APPROVED
            const company = await prisma.company.create({
              data: {
                account_id: account.id,
                name: `E2E Company ${ts}`,
                address: "",
                phone: "0000000000",
                description: "E2E test company",
                register_day: new Date(),
                registration_status: "APPROVED",
                created_at: new Date(),
                updated_at: new Date(),
              },
            });

            // Ensure jobType and jobArrangement exist (use first or create defaults)
            let jobType = await prisma.jobType.findFirst();
            if (!jobType) {
              jobType = await prisma.jobType.create({ data: { name: "fulltime" } });
            }
            let jobArrangement = await prisma.jobArrangement.findFirst();
            if (!jobArrangement) {
              jobArrangement = await prisma.jobArrangement.create({ data: { name: "onsite" } });
            }

            // Ensure a job category exists
            let category = await prisma.jobCategory.findFirst();
            if (!category) {
              category = await prisma.jobCategory.create({ data: { name: "General" } });
            }

            // Map required document names to documentType ids if they exist
            const allDocTypes = await prisma.documentType.findMany();
            const docTypeIds = allDocTypes
              .filter((d) => requiredDocuments.map((s) => s.toLowerCase()).includes(d.name.toLowerCase()))
              .map((d) => ({ id: d.id }));

            const job = await prisma.jobPost.create({
              data: {
                company_id: company.id,
                jobName: title,
                location: "Remote",
                aboutRole: "E2E test role",
                responsibilities: "",
                requirements: ["Requirement 1"],
                qualifications: ["Qualification 1"],
                min_salary: 0,
                max_salary: 0,
                deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                is_Published: true,
                updated_at: new Date(),
                job_type_id: jobType.id,
                job_arrangement_id: jobArrangement.id,
                job_category_id: category.id,
                tags: {},
                documents: docTypeIds.length ? { connect: docTypeIds } : undefined,
              },
            });

            return { success: true, jobId: job.id };
          } catch (error) {
            console.error("db:createJob task error:", error);
            return { error: String(error) };
          }
        },
      });

      return config;
    },
  },
});
