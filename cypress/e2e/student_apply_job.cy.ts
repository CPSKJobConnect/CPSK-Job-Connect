describe('template spec', () => {
  beforeEach(function() {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    cy.wait(1000);
    cy.get('a[href="/jobs"]', { timeout: 10000 }).click();
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).first().click();
    cy.get('[data-testid="quick-apply-button"]', { timeout: 10000 }).click();
    cy.location('pathname', { timeout: 10000 }).should('include', '/student/job-apply');
    cy.wait(2000);
  });

  it('should not apply job if not upload document', function() {
    cy.get('[data-testid="submit-application-button"]', { timeout: 10000 }).click();
    cy.get('[data-testid="confirm-submit-application-button"]', { timeout: 10000 }).click();
    cy.contains('Resume Missing', { timeout: 5000 }).should('be.visible');
  });
});