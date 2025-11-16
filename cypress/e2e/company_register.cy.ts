describe('Company Registration E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/register/company')

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
      const ok = /\/company/.test(p) || /\/register\/complete/.test(p);
      if (!ok) throw new Error(`Unexpected redirect path: ${p}`);
    })

    cy.contains(/registration|pending|under review|welcome/i, { timeout: 10000 }).should('exist')
  })

  it('Required Fields Validation - shows per-field errors', () => {
    cy.get('@authSubmit').click()
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Company evidence document is required')
  })

  it('Password Validation - too short and mismatch', () => {
    cy.get('@companyName').clear().type('PwShort Co', { delay: 10 })
    cy.get('@email').clear().type(`company+pwshort${Date.now()}@example.com`, { delay: 10 })
    cy.get('@password').clear().type('123', { delay: 10 })
    cy.get('@confirmPassword').clear().type('123', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.intercept('POST', '/api/register').as('postRegister')
    cy.get('form').then(($f) => cy.wrap($f).submit());
    cy.wait('@postRegister', { timeout: 10000 }).then(() => {
      cy.get('[data-testid="error-password"]', { timeout: 5000 }).should('be.visible')
    });

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
    cy.intercept('POST', '/api/register').as('postRegisterDup')
    cy.get('form').then(($f) => cy.wrap($f).submit());
    cy.wait('@postRegister', { timeout: 10000 }).then(() => {
      cy.get('[data-testid="error-confirmPassword"]', { timeout: 5000 }).should('be.visible')
    });
  })
})
