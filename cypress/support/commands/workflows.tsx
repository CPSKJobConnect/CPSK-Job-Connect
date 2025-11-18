/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      createJobViaAPI(opts?: any): Chainable<any>
      createApplicationViaAPI(jobId: string | number): Chainable<any>
      uploadStudentDocument(title: string, fixtureName: string, filenameOverride?: string): Chainable<any>
      applyJob(requiredDocs: Array<{ title: string; fileName: string }>): Chainable<any>
    }
  }
}

// Create a job via the project's Cypress task if available (keeps current behavior)
Cypress.Commands.add('createJobViaAPI', (opts: any = {}) => {
  // Prefer the DB task used by existing tests; this mirrors previous behaviour.
  try {
    // @ts-ignore
    return cy.task('db:createJob', opts as any)
  } catch (err) {
    const base = Cypress.config('baseUrl') || 'http://localhost:3000'
    const body = Object.assign({ title: `E2E Job ${Date.now()}` }, opts)
    return cy.request({ method: 'POST', url: `${base}/api/company/jobs/create`, body }).then((r) => r.body)
  }
})

// Create an application via DB task (used by company tests)
Cypress.Commands.add('createApplicationViaAPI', (jobId: string | number) => {
  // Keep behavior identical to previous direct task call
  // @ts-ignore
  return cy.task('db:createApplication', { jobId })
})

// Upload a student document using the same DOM/file approach present in tests
Cypress.Commands.add('uploadStudentDocument', (title: string, fixtureName: string, filenameOverride?: string) => {
  const ts = Date.now();
  const uniqueName = filenameOverride ? `${filenameOverride}-${ts}.pdf` : `${fixtureName.replace('.pdf', '')}-${ts}.pdf`;

  cy.intercept('POST', '/api/students/documents').as('uploadDoc');

  cy.contains('h3', title)
    .parent()
    .within(() => {
      cy.get('input[data-testid="file-upload-input"]', { timeout: 10000 }).then($input => {
        cy.fixture(fixtureName, 'binary').then((fileContent) => {
          const blob = Cypress.Blob.binaryStringToBlob(fileContent, 'application/pdf');
          const testFile = new File([blob], uniqueName, { type: 'application/pdf' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(testFile);
          const inputEl = $input[0] as HTMLInputElement;
          inputEl.files = dataTransfer.files;
          cy.wrap($input).trigger('change', { force: true });
        });
      });
    });

  return cy.wait('@uploadDoc', { timeout: 10000 });
})

// Select existing documents and perform the Submit->Apply flow used in student apply tests
Cypress.Commands.add('applyJob', (requiredDocs: Array<{ title: string; fileName: string }>) => {
  requiredDocs.forEach((d) => {
    cy.get(`[data-testid="select-existing-${d.title.toLowerCase()}"]`, { timeout: 5000 }).click({ force: true });

    cy.get('body').within(() => {
      cy.contains(d.fileName, { timeout: 5000 }).click({ force: true });
    });

    cy.get('body').type('{esc}');
    cy.get('body', { timeout: 5000 }).should('not.have.css', 'pointer-events', 'none');
    cy.get(`[data-testid="selected-${d.title.toLowerCase()}"]`, { timeout: 5000 }).should('contain.text', d.fileName);
  });

  // Submit and confirm (buttons are labelled 'Submit' and 'Apply' in UI)
  cy.contains('button', 'Submit').click();
  cy.contains('button', 'Apply').click();
})

export {}
