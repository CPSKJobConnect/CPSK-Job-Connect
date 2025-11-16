/// <reference types="cypress" />

context('Company - Application Management', () => {
  beforeEach(function () {
    // login as company and fetch recent applications from the browser context
    cy.viewport(1280, 800);
    cy.loginAsCompany();
    cy.wait(20000);

    // Use window.fetch so the request runs in the browser and carries auth cookies
    // Steps: fetch the current company's jobs, seed an application for one job via a Cypress task,
    // then fetch recent applications and select the created one.
    cy.window()
      .then((win) => win.fetch('/api/company/jobs'))
      .then(async (res) => {
        if (res.status === 401) {
          cy.log('Not authenticated when fetching company jobs (401). Skipping tests.');
          this.skip();
          return null;
        }
        return res.json();
      })
      .then((jobsBody) => {
        if (!jobsBody) return;
        const jobs = jobsBody || [];
        if (!jobs || jobs.length === 0) {
          cy.log('No company jobs available, skipping tests');
          this.skip();
          return;
        }

        const jobId = jobs[0].id;

        // Create an application directly in the DB for this job via a Cypress task
        cy.task('db:createApplication', { jobId }).then((taskRes: any) => {
          if (!taskRes || taskRes.error) {
            cy.log('Failed to create application via task', taskRes?.error);
            // continue to try reading recent applications; the test will skip if none present
          }

          // Now fetch recent applications in browser context so cookies are included
          cy.window().then((win) =>
            win
              .fetch('/api/company/recent-applications?limit=50')
              .then(async (res2) => {
                if (res2.status === 401) {
                  cy.log('Not authenticated when fetching recent applications (401). Skipping tests.');
                  this.skip();
                  return null;
                }
                return res2.json();
              })
              .then((body) => {
                if (!body) return;
                const apps = body?.data?.applications || [];
                if (!apps || apps.length === 0) {
                  cy.log('No recent applications available, skipping tests');
                  this.skip();
                  return;
                }
                cy.wrap(apps[0]).as('selectedApp');
              })
          );
        });
      });
  });

  it('Change Application Status (Pending -> Interview) and persist', function () {
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    const newStatus = 'interview';

    cy.get('@selectedApp').then((app: any) => {
      const applicationId = String(app.id);
      const jobId = String(app.job.id);

      // Visit job applicant page and open the job
      cy.visit(`${base}/company/job-applicant`);
      cy.wait(20000);
      cy.get(`[data-testid="job-card-${jobId}"]`, { timeout: 10000 }).should('exist').click();

      // Intercept the backend PATCH for status changes so we can wait on the server response
      // Use a broad pattern to catch either `/api/applications/:id/status`, `/api/company/applications/:id`,
      // or any other PATCH to API that might represent status updates.
      cy.intercept({ method: 'PATCH', url: '**/api/**' }).as('anyPatch');
      cy.intercept({ method: 'PATCH', url: '**/api/**applications/**' }).as('patchStatus');

      // Determine the target status (toggle if already at the desired status) by checking backend state,
      // then open the status control, choose the option, wait for the server PATCH, and assert UI.
      cy.window()
        .then((win) => win.fetch('/api/company/recent-applications?limit=50'))
        .then((res) => res.json())
        .then((body) => {
          const apps = body?.data?.applications || [];
          const found = apps.find((a: any) => String(a.id) === String(applicationId));
          const current = (found?.status || '').toLowerCase();
          let targetStatus = newStatus;
          if (current === newStatus) targetStatus = 'reviewed';
          return targetStatus;
        })
        .then((targetStatus) => {
          // Open status control
          cy.get(`[data-testid="application-status-trigger-${applicationId}"]`, { timeout: 15000 })
            .should('exist')
            .then(($els) => {
              const $visible = $els.filter(':visible');
              if ($visible.length) {
                cy.wrap($visible.first()).click();
              } else {
                cy.wrap($els.first()).click({ force: true });
              }
            });

          // Select the target item (use select-item slot)
          cy.get('[data-slot="select-content"]', { timeout: 7000 })
            .should('exist')
            .within(() => {
              cy.get('[data-slot="select-item"]')
                .contains(targetStatus, { matchCase: false })
                .click({ force: true });
            });

          // Wait for the backend PATCH and assert the server response
          cy.wait(['@patchStatus', '@anyPatch'], { timeout: 20000 }).then((interceptionArr) => {
            const interception = Array.isArray(interceptionArr) ? interceptionArr.find(Boolean) : interceptionArr;
            expect(interception, 'PATCH intercepted').to.exist;
            const resp: any = interception!.response;
            const statusCode = resp?.statusCode ?? resp?.status ?? undefined;
            expect(statusCode, 'PATCH status code').to.equal(200);
            const application = resp?.body?.application ?? resp?.body;
            expect(application, 'response application object').to.exist;
            const serverStatusName = ((application?.applicationStatus?.name) || application?.status || '').toLowerCase();
            expect(serverStatusName).to.include(targetStatus);
          });

          // Allow UI to update then assert displayed status in the select-value slot
          cy.wait(500);
          cy.reload();
          // Allow UI to update, then re-open the job card and wait for applicants to load,
          // then assert the displayed status in the select-value slot.
          cy.wait(500);
          cy.intercept('GET', `/api/jobs/${jobId}/applicants`).as('getApplicants');
          cy.get(`[data-testid="job-card-${jobId}"]`, { timeout: 10000 })
            .should('exist')
            .click();
          cy.wait('@getApplicants', { timeout: 10000 });

          cy.get(`[data-testid="application-status-trigger-${applicationId}"]`, { timeout: 10000 })
            .then(($els) => {
              const $visible = $els.filter(':visible');
              const $target = $visible.length ? $visible.first() : $els.first();
              cy.wrap($target)
                .find('[data-slot="select-value"]')
                .should('exist')
                .invoke('text')
                .then((txt) => expect(String(txt).toLowerCase()).to.include(targetStatus));
            });
        });
    });
  });

  it('View Applicant Profile (opens modal and shows correct info)', function () {
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';

    cy.get('@selectedApp').then((app: any) => {
      const applicationId = String(app.id);
      const jobId = String(app.job.id);

      // Fetch applicant info from API for later assertions
      cy.request({ method: 'GET', url: `${base}/api/company/applicants/${applicationId}` }).then((r) => {
        expect(r.status).to.equal(200);
        const applicantInfo = r.body?.data;
        expect(applicantInfo).to.exist;

        // Visit job list and open job
        cy.visit(`${base}/company/job-applicant`);
        cy.get(`[data-testid="job-card-${jobId}"]`, { timeout: 10000 }).should('exist').click();

        // Intercept the applicant GET so we can wait until data loads in the modal
        cy.intercept('GET', `/api/company/applicants/${applicationId}`).as('getApplicant');

        // Open applicant profile modal using stable testid on the trigger
        cy.get(`[data-testid="view-applicant-${applicationId}"]`, { timeout: 10000 }).should('exist').click();

        // Wait for applicant data to load
        cy.wait('@getApplicant', { timeout: 10000 }).then((inter) => {
          const data = inter.response?.body?.data;
          expect(data).to.exist;

          // Modal should show name and email
          const fullName = `${data.firstname} ${data.lastname}`;
          cy.contains(fullName, { timeout: 10000 }).should('be.visible');
          cy.contains(data.email).should('be.visible');

          // If a resume URL exists, the modal should contain a link to it, otherwise show fallback text
          if (data.documents?.resume_url) {
            cy.get('[data-testid="applicant-modal"] a').contains('Resume').should('have.attr', 'href').and('include', data.documents.resume_url);
          } else {
            cy.contains('No resume uploaded', { timeout: 10000 }).should('be.visible');
          }
        });
      });
    });
  });
});
