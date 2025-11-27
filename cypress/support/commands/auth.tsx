/// <reference types="cypress" />

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


function getCred(envKey: string, fallback?: string) {
  const v = Cypress.env(envKey)
  return v || fallback
}


Cypress.Commands.add('loginAsStudent', (email: string = 'DEFAULT', password: string = 'DEFAULT') => {
  const em = email === 'DEFAULT' ? (getCred('TEST_STUDENT_EMAIL') || DEFAULTS.student.email) : email
  const pw = password === 'DEFAULT' ? (getCred('TEST_STUDENT_PASSWORD') || DEFAULTS.student.password) : password

  const base = Cypress.config('baseUrl') || 'https://localhost:3000'
  cy.visit(`${base}/login/student`)
  cy.get('#email', { timeout: 15000 }).should('be.visible').clear().type(em)
  cy.get('#password', { timeout: 15000 }).should('be.visible').clear().type(pw)
  cy.get('[data-testid="auth-submit"]', { timeout: 15000 }).should('not.be.disabled').then(($btn) => {
    if ($btn.length) {
      cy.wrap($btn).click()
    } else {
      cy.contains('Sign In').click()
    }
  })

  cy.request({ method: 'GET', url: '/api/auth/session' }).its('status').should('be.oneOf', [200, 204])
})

Cypress.Commands.add('loginAsCompany', (email: string = 'DEFAULT', password: string = 'DEFAULT') => {
  const em = email === 'DEFAULT' ? (getCred('TEST_COMPANY_EMAIL') || DEFAULTS.company.email) : email
  const pw = password === 'DEFAULT' ? (getCred('TEST_COMPANY_PASSWORD') || DEFAULTS.company.password) : password

  const base = Cypress.config('baseUrl') || 'https://localhost:3000'
  // Ensure the company account is approved in the database for posting actions
  // (this is safe for test environments only)
  // Use a Cypress task (node-side) which imports the app's Prisma client.
  cy.task('db:approveCompany', { email: em }).then((res) => {
    if (res && typeof res === 'object' && (res as any).error) {
      // eslint-disable-next-line no-console
      console.error('db:approveCompany error:', (res as any).error)
    } else {
      // eslint-disable-next-line no-console
      console.log('db:approveCompany result:', res)
    }
  })
  cy.visit(`${base}/login/company`)
  cy.get('#email', { timeout: 15000 }).should('be.visible').clear().type(em)
  cy.get('#password', { timeout: 15000 }).should('be.visible').clear().type(pw)
  cy.get('[data-testid="auth-submit"]', { timeout: 15000 }).should('not.be.disabled').then(($btn) => {
    if ($btn.length) {
      cy.wrap($btn).click()
    } else {
      cy.contains('Sign In').click()
    }
  })

  cy.request({ method: 'GET', url: '/api/auth/session' }).its('status').should('be.oneOf', [200, 204])
})

export {}
