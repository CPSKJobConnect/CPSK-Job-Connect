it('should register successfully and redirect to dashboard', function() {
  cy.intercept('POST', '/api/register', (req) => {
    req.reply({ statusCode: 200, body: { redirectTo: '/company/dashboard' } })
  }).as('register')
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_test@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234');
  cy.get('[name="confirmPassword"]').click();
  cy.get('[name="confirmPassword"]').type('test1234');
  cy.get('[name="companyName"]').click();
  cy.get('[name="companyName"]').type('Company Test');
  cy.get('[name="address"]').click();
  cy.get('[name="address"]').type('195 One Bangkok Tower 4, Wireless Rd, Lumphini, Pathum Wan, Bangkok 10330');
  cy.get('[name="website"]').click();
  cy.get('[name="website"]').type('https://example.com');
  cy.get('textarea[name="description"]').click();
  cy.get('textarea[name="description"]').type(
      'Company Test is a technology-driven recruitment platform dedicated to connecting skilled professionals with top employers in Thailand. We specialize in providing innovative hiring solutions, internship programs, and career development tools that empower both students and businesses. Our mission is to make job searching and talent acquisition more efficient, transparent, and human-centered.'
  );
  cy.get('[name="phone"]').click();
  cy.get('[name="phone"]').type('0955320987');
  cy.get('[data-testid="auth-submit"]').click();
  cy.wait('@register');
  cy.location('pathname', { timeout: 20000 }).should('eq', '/company/dashboard');
});

it('should show error when passwords do not match', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_test@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234');
  cy.get('[name="confirmPassword"]').click();
  cy.get('[name="confirmPassword"]').type('wrong1234');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#confirm-password-error').should('be.visible');
});

it('should show error when missing fields', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('[name="email"]').click();
  cy.get('[name="email"]').type('company_test@gmail.com');
  cy.get('[name="password"]').click();
  cy.get('[name="password"]').type('test1234');
  cy.get('[name="confirmPassword"]').click();
  cy.get('[name="confirmPassword"]').type('test1234');
  cy.get('button.text-primary-foreground').click();
  cy.get('[data-testid="auth-form-error-card"]').should('be.visible');
});

it('should show error when description is less than 10 characters', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('textarea[name="description"]').click();
  cy.get('textarea[name="description"]').type('Too short');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#description-error').should('be.visible');
});

it('should show error when phone number is less than 10 digits', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('[name="phone"]').click();
  cy.get('[name="phone"]').type('09553');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#phone-error').should('be.visible');
});

it('should show error when phone number is not a digit', function() {
  cy.visit('http://localhost:3000/')
  cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click();
  cy.get('[data-testid="auth-signup"]').click();
  cy.get('[name="phone"]').click();
  cy.get('[name="phone"]').type('number');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('#phone-error').should('be.visible');
});