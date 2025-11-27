describe('Company Registration E2E', () => {
  beforeEach(() => {
    cy.visit('https://localhost:3000/register/company')

    // Allow the page transition/animations to complete before querying inputs
    cy.wait(1500);
    cy.get('#companyName', { timeout: 20000 }).should('be.visible').as('companyName')
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
    const password = `Aa1!${Date.now().toString().slice(-6)}X`

    cy.get('@companyName').clear().type(`Test Company ${ts}`, { delay: 10 })
    cy.get('@email').clear().type(email, { delay: 10 })
    cy.get('@password').clear().type(password, { delay: 10 })
    cy.get('@confirmPassword').clear().type(password, { delay: 10 })
    cy.get('@address').clear().type('123 Test St', { delay: 10 })
    cy.get('@description').clear().type('We are a test company', { delay: 10 })
    cy.get('@phone').clear().type('0812345678', { delay: 10 })
    cy.get('@website').clear().type('https://example.com', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })

    cy.get('@authSubmit').should('be.visible').and('not.be.disabled').then(($btn) => cy.wrap($btn).click());

    // Expect redirect to login page, then perform login and accept privacy modal
    cy.location('pathname', { timeout: 15000 }).should('include', '/login/company')

    // Login with newly created company account
    cy.get('#email').clear().type(email)
    cy.get('#password').clear().type(password)
    cy.get('[data-testid="auth-submit"]').click()

    // Accept privacy modal when prompted (allow for animation; force click if overlay interferes)
    cy.get('[data-testid="privacy-accept"]', { timeout: 20000 })
      .should('be.visible')
      .wait(200)
      .click({ force: true })

    cy.location('pathname', { timeout: 20000 }).should('include', '/company/dashboard')
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

    cy.visit('https://localhost:3000/register/company')
    cy.get('#companyName', { timeout: 10000 }).should('be.visible').as('companyName')
    cy.get('#email').should('exist').as('email')
    cy.get('#password').should('exist').as('password')
    cy.get('#confirmPassword').should('exist').as('confirmPassword')
    cy.get('@companyName').clear().type('PwMismatch Co', { delay: 10 })
    const email2 = `company+pwmm${Date.now()}@example.com`
    cy.get('@email').clear().type(email2, { delay: 10 })
    cy.get('@password').clear().type(`Aa1!${Date.now().toString().slice(-6)}X`, { delay: 10 })
    cy.get('@confirmPassword').clear().type('wrong1234', { delay: 10 })
    cy.get('#evidence').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.intercept('POST', '/api/register').as('postRegisterDup')
    cy.get('form').then(($f) => cy.wrap($f).submit());
    cy.wait('@postRegister', { timeout: 10000 }).then(() => {
      cy.get('[data-testid="error-confirmPassword"]', { timeout: 5000 }).should('be.visible')
    });
  })
})
