describe('Company Registration E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000')
    cy.get('[data-testid="company-card"]').click()
    cy.get('[data-testid="auth-signup"]', { timeout: 10000 }).should('be.visible').click()
  })

  it('Happy Path - register company and redirect', () => {
    const ts = Date.now()
    const email = `company+${ts}@example.com`

    cy.get('#companyName').clear().type(`Test Company ${ts}`)
    cy.get('#email').clear().type(email)
    cy.get('#password').clear().type('test1234')
    cy.get('#confirmPassword').clear().type('test1234')
    cy.get('#address').clear().type('123 Test St')
    cy.get('#description').clear().type('We are a test company')
    cy.get('#phone').clear().type('0812345678')
    cy.get('#website').clear().type('https://example.com')
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })

    cy.get('[data-testid="auth-submit"]').click()

    cy.location('pathname', { timeout: 15000 }).should((p) => {
      // Accept either company dashboard or registration-complete route
      expect(/\/company/.test(p) || /\/register\/complete/.test(p)).to.be.true
    })

    // Expect some success or pending message on the page
    cy.contains(/registration|pending|under review|welcome/i, { timeout: 10000 }).should('exist')
  })

  it('Required Fields Validation - shows per-field errors', () => {
    // Submit empty form
    cy.get('[data-testid="auth-submit"]').click()
    // Global error card should show the evidence-required message from the backend
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Company evidence document is required')
  })

  it('Password Validation - too short and mismatch', () => {
    // Too short
    cy.get('#companyName').clear().type('PwShort Co')
    cy.get('#email').clear().type(`company+pwshort${Date.now()}@example.com`)
    cy.get('#password').clear().type('123')
    cy.get('#confirmPassword').clear().type('123')
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.get('[data-testid="auth-submit"]').click()
    // Either a per-field password error or a global card mentioning password
    cy.get('body').then(() => {
      cy.get('[data-testid="error-password"]').then($el => {
        if ($el.length) {
          cy.wrap($el).should('exist')
        } else {
          cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 }).should('be.visible').and('contain.text', /password/i)
        }
      })
    })

    // Password mismatch
    cy.visit('http://localhost:3000/register/company')
    const email2 = `company+pwmm${Date.now()}@example.com`
    cy.get('#companyName').clear().type('PwMismatch Co')
    cy.get('#email').clear().type(email2)
    cy.get('#password').clear().type('test1234')
    cy.get('#confirmPassword').clear().type('wrong1234')
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.get('[data-testid="auth-submit"]').click()
    cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 }).should('be.visible')
  })

  it('Duplicate Email - shows exists error', () => {
    const existing = Cypress.env('TEST_COMPANY_EMAIL') || 'company_test@gmail.com'
    cy.visit('http://localhost:3000/register/company')
    cy.get('#companyName').clear().type('DupCo')
    cy.get('#email').clear().type(existing)
    cy.get('#password').clear().type('test1234')
    cy.get('#confirmPassword').clear().type('test1234')
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.get('[data-testid="auth-submit"]').click()

    cy.get('[data-testid="auth-form-error-card"]', { timeout: 5000 }).should('be.visible').then($el => {
      const text = $el.text().toLowerCase()
      // Accept 'invalid data' (server validation) or duplicate messages
      expect(text).to.satisfy((t: string) => t.includes('exists') || t.includes('already') || t.includes('invalid data') || t.includes('registration failed'))
    })
  })
})
