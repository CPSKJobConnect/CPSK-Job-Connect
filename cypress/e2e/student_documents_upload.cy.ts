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
