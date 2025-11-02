/// <reference types="cypress" />
// ***********************************************
// Custom commands for this project's Cypress tests
// ***********************************************

// Custom Cypress commands for authentication/session reuse
// Adds helpers to log in as test users and cache the session

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsStudent(email?: string, password?: string): Chainable<void>
      loginAsCompany(email?: string, password?: string): Chainable<void>
      login(role: 'student' | 'company', email: string, password: string): Chainable<void>
      fillJobPostDetail(): Chainable<void>
      fillJobPostDescription(): Chainable<void>
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

Cypress.Commands.add('fillJobPostDetail', () => {
  cy.get('[name="title"]').click();
  cy.get('[name="title"]').type('Graphic Designer');
  cy.get('[data-testid="category-combobox"]').click();
  cy.contains('[role="option"]', 'Design').click(); 
  cy.get('[data-testid="location-combobox"]').click();
  cy.get('[data-testid="province-option-Bangkok"]').click();
  cy.get('[data-testid="district-option-Dusit"]').click();
  cy.get('[data-testid="subdistrict-option-Dusit"]').click();
  cy.get('[data-testid="select-type-trigger"]').click({ force: true });
  cy.contains('[role="option"]', 'internship').click({ force: true });
  cy.get('[data-testid="select-arrangement-trigger"]').click({ force: true });
  cy.contains('[role="option"]', 'onsite').click({ force: true });
  cy.get('[name="minSalary"]').click();
  cy.get('[name="minSalary"]').type('30000');
  cy.get('[name="maxSalary"]').click();
  cy.get('[name="maxSalary"]').type('60000');

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);

  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const dd = String(nextMonth.getDate()).padStart(2, '0');
  const nextMonthDate = `${yyyy}-${mm}-${dd}`;

  cy.get('[name="deadline"]').click();
  cy.get('input[name="deadline"]')
    .type(nextMonthDate)
    .should('have.value', nextMonthDate);
})

Cypress.Commands.add('fillJobPostDescription', () => {
  cy.get('[data-testid="select-skill-trigger"]').click();
  cy.get('[data-testid="skill-option-Adobe-XD"]').click();
  cy.get('[data-testid="skill-option-Social-Media"]').click();
  cy.get('[name="overview"]').click();
  cy.get('[name="overview"]').type('Create visually appealing designs for marketing materials and social media.');
  cy.get('[name="responsibilities"]').click();
  cy.get('[name="responsibilities"]').type('Design layouts, social media posts, and branding assets.');
  cy.get('[name="requirements"]').click();
  cy.get('[name="requirements"]').type('Strong portfolio of design projects, basic motion design is a plus.');
  cy.get('[name="qualifications"]').click();
  cy.get('[name="qualifications"]').type('Bachelor’s in Design or related field.');
})

export {}
