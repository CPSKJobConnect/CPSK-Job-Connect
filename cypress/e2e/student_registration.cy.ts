it('should register successfully and redirect to dashboard', function() {
    cy.intercept('POST', '/api/register', (req) => {
      req.reply({ statusCode: 200, body: { redirectTo: '/student/dashboard' } })
    }).as('register')
    cy.visit('http://localhost:3000/')
    cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
    cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click();
    cy.get('[name="email"]').click();
    cy.get('[name="email"]').type('student_test@ku.th');
    cy.get('[name="password"]').click();
    cy.get('[name="password"]').type('test1234');
    cy.get('[name="confirmPassword"]').click();
    cy.get('[name="confirmPassword"]').type('test1234');
    cy.get('[name="studentId"]').click();
    cy.get('[name="studentId"]').type('6610545555');
    cy.get('[name="name"]').click();
    cy.get('[name="name"]').type('Student Test');
    cy.get('[name="phone"]').click();
    cy.get('[name="phone"]').type('0955320987');
    cy.get('[data-testid="faculty-select-trigger"]').click({ force: true });
    cy.get('[role="listbox"]').contains('Software and Knowledge Engineering (SKE)').click({ force: true });
    cy.get('[data-testid="year-select-trigger"]').click({ force: true });
    cy.get('[role="listbox"]').contains('Year 3').click({ force: true });
    cy.get('label.w-full').click();
    cy.get('#transcript').selectFile('cypress/fixtures/transcript.pdf', { force: true });
    cy.get('[data-testid="auth-submit"]').click();
    cy.wait('@register');
    cy.location('pathname', { timeout: 10000 }).should('include', '/student/dashboard');
});

it('should show error when passwords do not match', function() {
  cy.visit('http://localhost:3000/');
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_test@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234');
  cy.get('[name="confirmPassword"]').click();
  cy.get('[name="confirmPassword"]').type('wrongpassword');
  cy.get('[name="studentId"]').click();
  cy.get('[name="studentId"]').type('6610545555');
  cy.get('[name="name"]').click();
  cy.get('[name="name"]').type('Student Test');
  cy.get('[name="phone"]').click();
  cy.get('[name="phone"]').type('0955320987');
  cy.get('button').contains('Select faculty').click({ force: true });
  cy.get('[role="listbox"]').contains('Software and Knowledge Engineering (SKE)').click({ force: true });
  cy.get('button').contains('Select year').click({ force: true });
  cy.get('[role="listbox"]').contains('Year 3').click({ force: true });
  cy.get('label.w-full').click();
  cy.get('#transcript').selectFile('cypress/fixtures/transcript.pdf', { force: true });
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#confirm-password-error').should('be.visible');
  cy.contains("Passwords don't match", { timeout: 10000 }).should('be.visible');
});

it('should show error when missing fields', function() {
  cy.visit('http://localhost:3000/');
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click();
  cy.get('[name="password"]').type('test1234');
  cy.get('[name="confirmPassword"]').type('test1234');
  cy.get('[name="studentId"]').type('6610545555');
  cy.get('[name="name"]').type('Student Test');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
});

it('should show error when password less than 6 characters', function() {
  cy.visit('http://localhost:3000/');
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('student_test@ku.th');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test');
  cy.get('[name="confirmPassword"]').click();
  cy.get('[name="confirmPassword"]').type('test');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#password-error').should('be.visible');
});

it('should upload transcript successfully', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-green-100 img.w-full').click();
  cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click();
  cy.get('label.w-full').click();
  cy.get('#transcript').selectFile('cypress/fixtures/transcript.pdf', { force: true });
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('[data-testid="auth-transcript"]').contains('transcript.pdf').should('be.visible');
});

