describe('Student Documents Upload', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    // Allow extra time for session and header/menu to render
    cy.wait(8000);
    const base = Cypress.config('baseUrl') || 'http://localhost:3000';
    // Navigate directly to profile to avoid flaky popover/menu
    cy.visit(`${base}/student/profile`);
    cy.get('[data-testid="document-tab"]', { timeout: 15000 }).should('be.visible').click();
    cy.wait(1000);
  });


  it('uploads resume, cv, portfolio and transcript and shows document cards', () => {
    cy.uploadStudentDocument('Resume', 'resume.pdf', 'resume');
    cy.uploadStudentDocument('CV', 'cv.pdf', 'cv');
    cy.uploadStudentDocument('Portfolio', 'portfolio.pdf', 'portfolio');
    cy.uploadStudentDocument('Transcript', 'transcript.pdf', 'transcript');

    cy.get('[data-testid^="document-card-"]', { timeout: 10000 }).should('have.length.at.least', 4);

    cy.contains(/resume-\d+\.pdf/i).should('be.visible');
    cy.contains(/cv-\d+\.pdf/i).should('be.visible');
    cy.contains(/portfolio-\d+\.pdf/i).should('be.visible');
    cy.contains(/transcript-\d+\.pdf/i).should('be.visible');
  });
});
