it('should login successfully and redirect to dashboard', function() {
  cy.intercept('POST', '/api/login', (req) => {
      req.reply({ statusCode: 200, body: { redirectTo: '/student/dashboard' } })
  }).as('login')
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.bg-green-100').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_test@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.location('pathname', { timeout: 10000 }).should('include', '/student/dashboard');
});

it('should show error message when email is invalid', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_wrong@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
  cy.contains('Invalid email or password', { timeout: 10000 }).should('be.visible');
});

it('should show error message when password is incorrect', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.bg-green-100').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_test@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('wrong1234{enter}');
  cy.get('button.text-primary-foreground').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
});