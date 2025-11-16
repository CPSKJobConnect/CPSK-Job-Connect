describe("Student Apply Job", () => {
  before(() => {
    Cypress.on("uncaught:exception", (err) => {
      const msg = err?.message || "";
      if (msg.includes("ResizeObserver loop limit exceeded") || msg.includes("Failed to execute 'removeChild'")) {
        return false;
      }
      return false;
    });
  });

  beforeEach(function (this: Mocha.Context) {
    cy.intercept('POST', '/api/students/documents').as('uploadDoc');
    cy.loginAsStudent();
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    const pollSession = (attempts = 0): Cypress.Chainable<any> => {
      const maxAttempts = 30;
      return cy.request({ method: 'GET', url: `${base}/api/auth/session`, failOnStatusCode: false }).then((resp) => {
        if (resp && resp.body && resp.body.user) {
          return cy.wrap(resp.body.user);
        }

        if (attempts >= maxAttempts) {
          throw new Error('session not ready after polling');
        }

        return cy.wait(1000).then(() => pollSession(attempts + 1));
      });
    };

    pollSession();
    cy.visit(`${base}/student/profile`);
  });

  function uploadDocuments() {
    const docs = [
      { title: 'Resume', fileName: 'resume.pdf' },
      { title: 'CV', fileName: 'cv.pdf' },
      { title: 'Portfolio', fileName: 'portfolio.pdf' },
      { title: 'Transcript', fileName: 'transcript.pdf' },
    ];

    cy.get('[data-testid="document-tab"]').click();

    docs.forEach((d) => {
      cy.contains(d.title, { timeout: 5000 })
        .closest('div')
        .within(() => {
          const filePath = `cypress/fixtures/${d.fileName}`;
          cy.get('input[data-testid="file-upload-input"]', { timeout: 10000 }).selectFile(filePath, { force: true });
        });
      cy.wait('@uploadDoc');
      cy.wait(200);
    });
  }

  it('Happy path - select existing documents and apply', function (this: Mocha.Context) {
    cy.intercept('POST', '/api/jobs/apply').as('applyRequest');

    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    cy.createJobViaAPI({ title: `E2E Job ${Date.now()}`, requiredDocuments: ['Resume', 'CV', 'Portfolio', 'Transcript'] })
      .then((res: any) => {
        if (res && (res.jobId || res.job?.id || res.id)) {
          const id = res.jobId || res.job?.id || res.id;
          cy.visit(`${base}/student/job-apply/${id}`);
          cy.url({ timeout: 10000 }).should('include', `/student/job-apply/${id}`);
        } else {
          throw new Error('db:createJob failed: ' + JSON.stringify(res));
        }
      });

    const requiredDocs = [
      { title: 'Resume', fileName: 'resume.pdf' },
      { title: 'CV', fileName: 'cv.pdf' },
      { title: 'Portfolio', fileName: 'portfolio.pdf' },
      { title: 'Transcript', fileName: 'transcript.pdf' },
    ];

    requiredDocs.forEach((d) => {
      cy.get(`[data-testid="select-existing-${d.title.toLowerCase()}"]`, { timeout: 5000 }).click({ force: true });
      cy.get('body').within(() => {
        cy.contains(d.fileName, { timeout: 5000 }).click({ force: true });
      });

      cy.get('body').type('{esc}');
      cy.get('body', { timeout: 5000 }).should('not.have.css', 'pointer-events', 'none');
      cy.get(`[data-testid="selected-${d.title.toLowerCase()}"]`, { timeout: 5000 }).should('contain.text', d.fileName);
    });

    cy.contains('button', 'Submit').click();
    cy.contains('button', 'Apply').click();
    cy.wait('@applyRequest').its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 10000 }).should('include', '/student/my-application');
  });

  it('Failure path - missing required documents shows error and does not call apply API', function (this: Mocha.Context) {
    cy.intercept('POST', '/api/jobs/apply').as('applyRequest');

    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    cy.createJobViaAPI({ title: `E2E Job ${Date.now()}`, requiredDocuments: ['Resume', 'CV', 'Portfolio', 'Transcript'] })
      .then((res: any) => {
        if (res && (res.jobId || res.job?.id || res.id)) {
          const id = res.jobId || res.job?.id || res.id;
          cy.visit(`${base}/student/job-apply/${id}`);
          cy.url({ timeout: 10000 }).should('include', `/student/job-apply/${id}`);
        } else {
          throw new Error('db:createJob failed: ' + JSON.stringify(res));
        }
      });

    cy.contains('button', 'Submit', { timeout: 5000 }).as('submitBtn');
    cy.get('@submitBtn').click({ force: true });
    cy.contains('button', 'Apply', { timeout: 5000 }).as('applyBtn');
    cy.get('@applyBtn').click({ force: true });
    cy.wait(200);

    cy.contains('You must upload all required documents', { timeout: 5000 }).should('exist');
    cy.get('@applyRequest.all').should('have.length', 0);
  });
});
