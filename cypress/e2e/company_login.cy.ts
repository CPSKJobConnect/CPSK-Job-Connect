it('should login successfully and redirect to dashboard', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.bg-green-100').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_test@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.location('pathname', { timeout: 10000 }).should('include', '/company/dashboard');
});

it('should show error message when email is invalid', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_wrong@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
});

it('should show error message when password is incorrect', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.bg-green-100').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_test@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('wrong1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
});