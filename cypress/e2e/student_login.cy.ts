describe('Student Login E2E', () => {
  beforeEach(() => {
    cy.visit('https://localhost:3000')
    cy.get('[data-testid="student-card"]').click()
    // Wait for the login form to load and be interactable
    cy.get('#email', { timeout: 20000 }).should('be.visible')
  })

  it('should login successfully and redirect to dashboard', function() {
  cy.get('#email').click();
  cy.get('#email').type('student_test@ku.th');
  cy.get('#password').click();
  cy.get('#password').type('test1234{enter}');
  cy.get('[data-testid="auth-submit"]').as('submit').should('be.visible').click();
  cy.location('pathname', { timeout: 10000 }).should('include', '/student/dashboard');
    });

    it('should show error message when email is invalid', function() {
    cy.get('#email').click();
    cy.get('#email').type('student_wrong@ku.th');
    cy.get('#password').click();
    cy.get('#password').type('test1234{enter}');
    cy.get('[data-testid="auth-submit"]').as('submit').should('be.visible').click();
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 15000 }).should('be.visible').within(() => {
      cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible')
    });
    });

    it('should show error message when password is incorrect', function() {
    cy.get('#email').click();
    cy.get('#email').type('student_test@ku.th');
    cy.get('#password').click();
    cy.get('#password').type('wrong1234{enter}');
    cy.get('button.text-primary-foreground').click();
    // allow extra time for server validation and error UI animation
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 15000 }).should('be.visible');
    });
})
