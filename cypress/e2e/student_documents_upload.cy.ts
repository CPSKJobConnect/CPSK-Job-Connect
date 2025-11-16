describe('Student Documents Upload', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    cy.wait(5000);
    cy.get('[data-testid="profile-menu-popover"]').click(); 
    cy.get('[data-testid="profile-menu-profile-btn"]').click();
    cy.get('[data-testid="document-tab"]').click();
    cy.wait(1000);
  });

  function attachFileInSection(title: string, fixtureName: string, filenameOverride?: string) {
    const ts = Date.now();
    const uniqueName = filenameOverride ? `${filenameOverride}-${ts}.pdf` : `${fixtureName.replace('.pdf','')}-${ts}.pdf`;

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

    cy.wait('@uploadDoc', { timeout: 10000 });
  }

  it('uploads resume, cv, portfolio and transcript and shows document cards', () => {
    attachFileInSection('Resume', 'resume.pdf', 'resume');
    attachFileInSection('CV', 'cv.pdf', 'cv');
    attachFileInSection('Portfolio', 'portfolio.pdf', 'portfolio');
    attachFileInSection('Transcript', 'transcript.pdf', 'transcript');

    cy.get('[data-testid^="document-card-"]', { timeout: 10000 }).should('have.length.at.least', 4);

    cy.contains(/resume-\d+\.pdf/i).should('be.visible');
    cy.contains(/cv-\d+\.pdf/i).should('be.visible');
    cy.contains(/portfolio-\d+\.pdf/i).should('be.visible');
    cy.contains(/transcript-\d+\.pdf/i).should('be.visible');
  });
});
