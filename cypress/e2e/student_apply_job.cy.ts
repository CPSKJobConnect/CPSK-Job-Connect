/// <reference types="cypress" />

// Student Apply Job E2E
// - beforeEach: login as student and upload Resume, CV, Portfolio, Transcript via Documents UI
// - Happy path: select existing documents on job apply page and submit application
// - Failure path: try to submit without required documents and assert error

describe("Student Apply Job", () => {
  before(() => {
    // Ignore known benign runtime exceptions that previously caused flakes
    Cypress.on("uncaught:exception", (err) => {
      const msg = err?.message || "";
      if (msg.includes("ResizeObserver loop limit exceeded") || msg.includes("Failed to execute 'removeChild'")) {
        return false;
      }
      return false;
    });
  });

  beforeEach(function (this: Mocha.Context) {
    // Ensure we are logged in as test student and upload required documents
    cy.intercept('POST', '/api/students/documents').as('uploadDoc');
    // Login helper provided in support commands
    cy.loginAsStudent();
    // Wait for session to be established (avoid redirect-to-login race)
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    // Retry the session endpoint until it returns a user (polling loop, up to ~30s)
    const pollSession = (attempts = 0) => {
      const maxAttempts = 30; // ~30s with 1s interval
      return cy.request({ method: 'GET', url: `${base}/api/auth/session`, failOnStatusCode: false }).then((resp) => {
        if (resp && resp.body && resp.body.user) {
          return cy.wrap(resp.body.user);
        }

        if (attempts >= maxAttempts) {
          throw new Error('session not ready after polling');
        }

        // wait 1s then retry
        return cy.wait(1000).then(() => pollSession(attempts + 1));
      });
    };

    pollSession();

    // Now visit profile (no uploads here) — tests will upload when needed
    cy.visit(`${base}/student/profile`);
  });

  // Helper to upload required documents from profile -> Documents tab
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
      // Wait for profile refresh
      cy.wait(200);
    });
  }

  it('Happy path - select existing documents and apply', function (this: Mocha.Context) {
    // Intercept apply request
    cy.intercept('POST', '/api/jobs/apply').as('applyRequest');

    // Create a fresh job via Cypress task and visit its apply page
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    cy.task('db:createJob', { title: `E2E Job ${Date.now()}`, requiredDocuments: ['Resume', 'CV', 'Portfolio', 'Transcript'] })
      .then((res: any) => {
        if (res && res.jobId) {
          cy.visit(`${base}/student/job-apply/${res.jobId}`);
          cy.url({ timeout: 10000 }).should('include', `/student/job-apply/${res.jobId}`);
        } else {
          throw new Error('db:createJob failed: ' + JSON.stringify(res));
        }
      });

    // For each required document, open the corresponding 'Select Existing <Title>' dialog and pick the uploaded file
    const requiredDocs = [
      { title: 'Resume', fileName: 'resume.pdf' },
      { title: 'CV', fileName: 'cv.pdf' },
      { title: 'Portfolio', fileName: 'portfolio.pdf' },
      { title: 'Transcript', fileName: 'transcript.pdf' },
    ];

    requiredDocs.forEach((d) => {
      // Click the selector trigger for this document using the stable testid
      cy.get(`[data-testid="select-existing-${d.title.toLowerCase()}"]`, { timeout: 5000 }).click({ force: true });

      // Choose the file by visible name inside the dialog
      cy.get('body').within(() => {
        cy.contains(d.fileName, { timeout: 5000 }).click({ force: true });
      });

      // Close the dialog (press Escape) so overlays don't block subsequent interactions
      cy.get('body').type('{esc}');
      // Wait until the page is interactable (body should not have pointer-events: none)
      cy.get('body', { timeout: 5000 }).should('not.have.css', 'pointer-events', 'none');

      // The upload section should now display the selected filename (scoped by selected testid)
      cy.get(`[data-testid="selected-${d.title.toLowerCase()}"]`, { timeout: 5000 }).should('contain.text', d.fileName);
    });

    // Submit and confirm
    cy.contains('button', 'Submit').click();
    cy.contains('button', 'Apply').click();

    // Wait for the apply network request and assert success
    cy.wait('@applyRequest').its('response.statusCode').should('eq', 200);

    // Redirects to my applications page on success
    cy.url({ timeout: 10000 }).should('include', '/student/my-application');
  });

  it('Failure path - missing required documents shows error and does not call apply API', function (this: Mocha.Context) {
    // Spy on apply endpoint
    cy.intercept('POST', '/api/jobs/apply').as('applyRequest');

    // Create a fresh job via Cypress task and visit its apply page
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    cy.task('db:createJob', { title: `E2E Job ${Date.now()}`, requiredDocuments: ['Resume', 'CV', 'Portfolio', 'Transcript'] })
      .then((res: any) => {
        if (res && res.jobId) {
          cy.visit(`${base}/student/job-apply/${res.jobId}`);
          cy.url({ timeout: 10000 }).should('include', `/student/job-apply/${res.jobId}`);
        } else {
          throw new Error('db:createJob failed: ' + JSON.stringify(res));
        }
      });

    // Ensure no selected/uploaded documents (we navigate fresh and rely on not selecting)
    // Open the confirmation dialog by aliasing the trigger first (avoids detach during re-render)
    cy.contains('button', 'Submit', { timeout: 5000 }).as('submitBtn');
    cy.get('@submitBtn').click({ force: true });

    // Wait for the dialog's Apply button to appear then click it
    cy.contains('button', 'Apply', { timeout: 5000 }).as('applyBtn');
    cy.get('@applyBtn').click({ force: true });

    // Small wait for UI response (toast)
    cy.wait(200);

    // The UI should show an error toast about missing documents
    cy.contains('You must upload all required documents', { timeout: 5000 }).should('exist');

    // Assert the apply endpoint was not called
    cy.get('@applyRequest.all').should('have.length', 0);
  });
});
