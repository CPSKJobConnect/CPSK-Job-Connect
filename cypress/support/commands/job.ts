declare global {
  namespace Cypress {
    interface Chainable {
      fillJobPostDetail(): Chainable<void>
      fillJobPostDescription(): Chainable<void>
      postJob(options?: { draft?: boolean; message?: string }): Chainable<void>;
    }
  }
}

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

Cypress.Commands.add('postJob', (options = {}) => {
  const {
    draft = false,
    message = draft
      ? 'Job drafted successfully!'
      : 'Job posted successfully!',
  } = options;

  // cy.intercept('POST', '/api/company/jobs/create', {
  //   statusCode: 200,
  //   body: { message },
  // }).as('jobPosting');


  cy.fillJobPostDetail();
  cy.get('[data-testid="next-step-button"]').click();
  cy.fillJobPostDescription();
  cy.get('[data-testid="next-step-button"]').click();

  if (draft) {
    cy.get('[data-testid="draft-job-button"]').click();
  } else {
    cy.get('[data-testid="publish-job-button"]').click();
  }

  // cy.wait('@jobPosting');
});

export {}