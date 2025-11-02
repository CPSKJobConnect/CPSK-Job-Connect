it('should post job sucessfully and show success toast', function() {
  cy.intercept('POST', '/api/company/jobs/create', {
    statusCode: 200,
    body: { message: 'Job posted successfully!' }
  }).as('jobPosting');

  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.fillJobPostDetail();
  cy.get('button[data-testid="next-step-button"]').click();
  cy.fillJobPostDescription();
  cy.get('[data-testid="next-step-button"]').click();
  cy.get('[data-testid="publish-job-button"]').click();
  cy.wait('@jobPosting');
  cy.contains('Job posted successfully', { timeout: 10000 }).should('be.visible')
});

it('should draft job sucessfully and show success toast', function() {
  cy.intercept('POST', '/api/company/jobs/create', {
    statusCode: 200,
    body: { message: 'Job drafted successfully!' }
  }).as('jobDrafting');

  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.fillJobPostDetail();
  cy.get('button[data-testid="next-step-button"]').click();
  cy.fillJobPostDescription();
  cy.get('[data-testid="next-step-button"]').click();
  cy.get('[data-testid="draft-job-button"]').click();
  cy.wait('@jobDrafting');
  cy.contains('Job drafted successfully', { timeout: 10000 }).should('be.visible')
});

it('should not allow to go next step if missing fields (detail)', function() {
  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.get('[name="title"]').click().type('Graphic Designer');
  cy.get('[data-testid="category-combobox"]').click();
  cy.contains('[role="option"]', 'Design').click(); 
  cy.get('button[data-testid="next-step-button"]').click();
  cy.contains('is required', { timeout: 10000 }).should('be.visible')
});

it('should not allow to go next step if missing fields (description)', function() {
  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.fillJobPostDetail();
  cy.get('button[data-testid="next-step-button"]').click();
  cy.get('[name="overview"]').click();
  cy.get('[name="overview"]').type('Create visually appealing designs for marketing materials and social media.');
  cy.get('button.text-primary-foreground').click();
  cy.contains('is required', { timeout: 10000 }).should('be.visible')
});

it('should go back to previous step when clicking Back', () => {
  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.fillJobPostDetail();
  cy.get('[data-testid="next-step-button"]').click();
  cy.get('button').contains('Back').click();
  cy.contains('Fill details').should('be.visible');
});

it('should show the job preview when reaching step 3', () => {
  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-posting"]').click();
  cy.wait(5000);
  cy.fillJobPostDetail();
  cy.get('[data-testid="next-step-button"]').click();
  cy.fillJobPostDescription();
  cy.get('[data-testid="next-step-button"]').click();
  cy.contains('Preview').should('be.visible');
});

it('should delete job post successfully', function() {
  cy.intercept('DELETE', '/api/jobs/*', {
    statusCode: 200,
    body: { message: 'Job deleted successfully!' }
  }).as('jobDeleting');

  cy.loginAsCompany('mimtest3@ku.th', 'mim1234');
  cy.get('a[href="/company/job-applicant"]').click();
  cy.wait(5000);

  cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
    .should('have.length.at.least', 1)
    .first()
    .as('firstJobCard')
    .click();

  cy.on('window:confirm', () => true);

  cy.get('[data-testid="delete-job-button"]', { timeout: 5000 }).then(($els) => {
    const $visible = Cypress.$($els).filter(':visible');
    if ($visible.length === 0) {
      throw new Error('No visible delete button found');
    }
    cy.wrap($visible.first()).click();
  });

  cy.wait('@jobDeleting');
  cy.reload();
  cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
  .should('have.length.lessThan', 1);
});


