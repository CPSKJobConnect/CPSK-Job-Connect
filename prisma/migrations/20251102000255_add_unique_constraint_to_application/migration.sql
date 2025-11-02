-- Remove duplicate applications, keeping only the earliest one (lowest id)
DELETE FROM "Application" a
USING "Application" b
WHERE a.student_id = b.student_id
  AND a.job_post_id = b.job_post_id
  AND a.id > b.id;

-- CreateIndex
CREATE UNIQUE INDEX "Application_student_id_job_post_id_key" ON "Application"("student_id", "job_post_id");

-- CreateIndex
CREATE INDEX "Application_student_id_idx" ON "Application"("student_id");

-- CreateIndex
CREATE INDEX "Application_job_post_id_idx" ON "Application"("job_post_id");
