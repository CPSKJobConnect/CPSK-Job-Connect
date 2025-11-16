describe('Student Registration E2E', () => {

  function uniqueEmail(suffix = '@ku.th') {
    const uuid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `${Date.now()}${Math.floor(Math.random()*1000000)}`
    return `e2e_student_${uuid}${suffix}`
  }

  function uniqueUsername(prefix = 'E2E') {
    const uuid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : `${Date.now()}${Math.floor(Math.random()*1000000)}`
    return `${prefix}_user_${uuid.slice(0,8)}`
  }

  beforeEach(() => {
    cy.visit('http://localhost:3000')
    cy.get('[data-testid="student-card"]').click()
    // Wait briefly for signup trigger to be interactable (animations/overlays)
    cy.wait(1500);
    cy.get('[data-testid="auth-signup"]', { timeout: 20000 }).should('be.visible').click()
  })

  it('Happy path — Current KU Student can register successfully (real API)', () => {
    const email = uniqueEmail('@ku.th')

    cy.get('#email').type(email)
    cy.get('#password').type('password123')
    cy.get('#confirmPassword').type('password123')
    cy.get('#studentId').type('6610545001')
    const username = uniqueUsername('E2E')
    cy.get('#name').type(username)

    cy.get('[data-testid="faculty-select"]').click()
    cy.get('[data-testid="ske"]').click()

    cy.get('[data-testid="year-select"]').click()
    cy.get('[data-testid="year-3"]').click()

    cy.get('#phone').type('0812345678')

    cy.get('[data-testid="auth-submit"]').click();

    cy.location('pathname', { timeout: 100000 }).should('include', '/student/dashboard');
  })

  it('KU Student Email Validation — non-KU email shows exact message', () => {
    const nonKuEmail = uniqueEmail('@gmail.com')

    cy.get('#email').type(nonKuEmail)
    cy.get('#password').type('password123')
    cy.get('#confirmPassword').type('password123')
    cy.get('#studentId').type('6610545002')
    const username = uniqueUsername('E2E')
    cy.get('#name').type(username)

    cy.contains('Current KU Student').click()

    cy.get('[data-testid="faculty-select"]').click()
    cy.get('[data-testid="ske"]').click()
    cy.get('[data-testid="year-select"]').click()
    cy.get('[data-testid="year-2"]').click()

    cy.get('#phone').type('0812345679')

    cy.get('[data-testid="auth-submit"]').click()

    const expectedMessage = "Current students must use a KU email address (@ku.th). If you don't have access to your KU email, please register as Alumni instead and provide your transcript for verification."

    cy.contains(expectedMessage, { timeout: 10000 }).should('be.visible')
  })

  it('Alumni — transcript is required and thows error when missing', () => {
    const email = uniqueEmail('@example.com')

    cy.get('#email').type(email)
    cy.get('#password').type('password123')
    cy.get('#confirmPassword').type('password123')
    cy.get('#studentId').type('6610545003')
    const username = uniqueUsername('E2E')
    cy.get('#name').type(username)

    cy.contains('KU Alumni').click()

    cy.get('[data-testid="faculty-select"]').click()
    cy.get('[data-testid="cpe"]').click()
    cy.get('[data-testid="year-select"]').should('be.disabled')
    cy.contains('Alumni').should('exist')

    cy.get('#phone').type('0812345680')

    cy.get('[data-testid="auth-submit"]').click()

    cy.contains('Alumni must upload a transcript', { timeout: 10000 }).should('be.visible')

    cy.get('input#transcript').selectFile('cypress/fixtures/transcript.pdf', { force: true })
    cy.get('[data-testid="auth-submit"]').click()

    cy.location('pathname', { timeout: 30000 }).should('include', '/student/dashboard')
  })

  it('Alumni cannot register without uploading a transcript (explicit check)', () => {
    const email = uniqueEmail('@example.com')

    cy.get('#email').type(email)
    cy.get('#password').type('password123')
    cy.get('#confirmPassword').type('password123')
    cy.get('#studentId').clear().type(`${Math.floor(6600000000 + Math.random() * 899999999)}`)
    const username = uniqueUsername('E2E')
    cy.get('#name').type(username)

    cy.contains('KU Alumni').click()

    cy.get('[data-testid="faculty-select"]').click()
    cy.get('[data-testid="cpe"]').click()

    cy.get('[data-testid="year-select"]').should('be.disabled')
    cy.contains('Alumni').should('exist')

    cy.get('#phone').type('0812345999')

    cy.get('[data-testid="auth-submit"]').click()

    cy.contains('Alumni must upload a transcript', { timeout: 10000 }).should('be.visible')
    cy.location('pathname').should('include', '/register/student')
  })
})
