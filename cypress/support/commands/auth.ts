declare global {
  namespace Cypress {
    interface Chainable {
      loginAsStudent(email?: string, password?: string): Chainable
      loginAsCompany(email?: string, password?: string): Chainable
      login(role: 'student' | 'company', email: string, password: string): Chainable
    }
  }
}

const DEFAULTS = {
  student: { email: 'student_test@ku.th', password: 'test1234' },
  company: { email: 'company_test@gmail.com', password: 'test1234' },
}

Cypress.Commands.add('login', (role: 'student' | 'company', email: string, password: string) => {
  const key = `${role}:${email}`

  cy.session(key, () => {
    cy.visit('http://localhost:3000/')
    if (role === 'student') {
      cy.get('#role-selection div.bg-green-100').click()
    } else {
      cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click()
    }
    cy.get('[name="email"]').clear().type(email)
    cy.get('[name="password"]').clear().type(password)
    cy.get('[data-testid="auth-submit"]').click()
    cy.location('pathname', { timeout: 10000 }).should('include', `/${role}/dashboard`);
  })
  cy.visit(`http://localhost:3000/${role}/dashboard`)
})


Cypress.Commands.add('loginAsStudent', (email = DEFAULTS.student.email, password = DEFAULTS.student.password) => {
  return cy.login('student', email, password)
})

Cypress.Commands.add('loginAsCompany', (email = DEFAULTS.company.email, password = DEFAULTS.company.password) => {
  return cy.login('company', email, password)
})

export {}