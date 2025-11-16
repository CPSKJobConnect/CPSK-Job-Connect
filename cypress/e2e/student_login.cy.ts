describe('Student Login E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
    cy.get('[data-testid="student-card"]').click()
  })

  it('should login successfully and redirect to dashboard', function() {
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_test@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.location('pathname', { timeout: 10000 }).should('include', '/student/dashboard');
    });

    it('should show error message when email is invalid', function() {
    cy.get('[name="email"]').click();
    cy.get('[name="email"]').type('student_wrong@ku.th');
    cy.get('[name="password"]').click();
    cy.get('[name="password"]').type('test1234{enter}');
    cy.get('button.text-primary-foreground').click();
    cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
    cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
    });

    it('should show error message when password is incorrect', function() {
    cy.get('[name="email"]').click();
    cy.get('[name="email"]').type('student_test@ku.th');
    cy.get('[name="password"]').click();
    cy.get('[name="password"]').type('wrong1234{enter}');
    cy.get('button.text-primary-foreground').click();
    cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
    });
})
