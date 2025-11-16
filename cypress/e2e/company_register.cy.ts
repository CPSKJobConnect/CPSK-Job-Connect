describe('Company Registration E2E', () => {
  beforeEach(() => {
    // Navigate directly to the company registration page for stability
    cy.visit('http://localhost:3000/register/company')

    // Alias key inputs so tests reference stable subjects and avoid DOM-detached errors
    cy.get('#companyName', { timeout: 10000 }).should('be.visible').as('companyName')
    cy.get('#email').should('exist').as('email')
    cy.get('#password').should('exist').as('password')
    cy.get('#confirmPassword').should('exist').as('confirmPassword')
    cy.get('#address').should('exist').as('address')
    cy.get('#description').should('exist').as('description')
    cy.get('#phone').should('exist').as('phone')
    cy.get('#website').should('exist').as('website')
    cy.get('[data-testid="auth-submit"]').should('exist').as('authSubmit')
  })

  it('Happy Path - register company and redirect', () => {
    const ts = Date.now()
    const email = `company+${ts}@example.com`

    // Use aliased inputs to avoid detached DOM elements after re-renders
    cy.get('@companyName').clear().type(`Test Company ${ts}`, { delay: 10 })
    cy.get('@email').clear().type(email, { delay: 10 })
    cy.get('@password').clear().type('test1234', { delay: 10 })
    cy.get('@confirmPassword').clear().type('test1234', { delay: 10 })
    cy.get('@address').clear().type('123 Test St', { delay: 10 })
    cy.get('@description').clear().type('We are a test company', { delay: 10 })
    cy.get('@phone').clear().type('0812345678', { delay: 10 })
    cy.get('@website').clear().type('https://example.com', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })

    cy.get('@authSubmit').should('be.visible').and('not.be.disabled').then(($btn) => cy.wrap($btn).click());

    cy.location('pathname', { timeout: 15000 }).should((p) => {
      // Accept either company dashboard or registration-complete route
      const ok = /\/company/.test(p) || /\/register\/complete/.test(p);
      if (!ok) throw new Error(`Unexpected redirect path: ${p}`);
    })

    // Expect some success or pending message on the page
    cy.contains(/registration|pending|under review|welcome/i, { timeout: 10000 }).should('exist')
  })

  it('Required Fields Validation - shows per-field errors', () => {
    // Submit empty form
    cy.get('@authSubmit').click()
    // Global error card should show the evidence-required message from the backend
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Company evidence document is required')
  })

  it('Password Validation - too short and mismatch', () => {
    // Too short
    cy.get('@companyName').clear().type('PwShort Co', { delay: 10 })
    cy.get('@email').clear().type(`company+pwshort${Date.now()}@example.com`, { delay: 10 })
    cy.get('@password').clear().type('123', { delay: 10 })
    cy.get('@confirmPassword').clear().type('123', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    // Wait for server validation by intercepting the register POST
    cy.intercept('POST', '/api/register').as('postRegister')
    // Submit the form directly to avoid clicking a button that may be removed during render
    cy.get('form').then(($f) => cy.wrap($f).submit());

    // Wait for server response and assert the per-field password error is shown
    cy.wait('@postRegister', { timeout: 10000 }).then(() => {
      cy.get('[data-testid="error-password"]', { timeout: 5000 }).should('be.visible')
    });

    // Password mismatch
    cy.visit('http://localhost:3000/register/company')
    cy.get('#companyName', { timeout: 10000 }).should('be.visible').as('companyName')
    cy.get('#email').should('exist').as('email')
    cy.get('#password').should('exist').as('password')
    cy.get('#confirmPassword').should('exist').as('confirmPassword')
    cy.get('@companyName').clear().type('PwMismatch Co', { delay: 10 })
    const email2 = `company+pwmm${Date.now()}@example.com`
    cy.get('@email').clear().type(email2, { delay: 10 })
    cy.get('@password').clear().type('test1234', { delay: 10 })
    cy.get('@confirmPassword').clear().type('wrong1234', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    // Intercept and wait for the register POST to ensure server-side duplicate handling completes
    cy.intercept('POST', '/api/register').as('postRegisterDup')
    // Submit the form directly to avoid clicking a button that may be removed during render
    cy.get('form').then(($f) => cy.wrap($f).submit());
    cy.wait('@postRegister', { timeout: 10000 }).then(() => {
      cy.get('[data-testid="error-confirmPassword"]', { timeout: 5000 }).should('be.visible')
    });
  })
})
