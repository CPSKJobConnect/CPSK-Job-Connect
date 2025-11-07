describe('Company Job Posting Flow', () => {

  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsCompany();
    cy.get('a[href="/company/job-posting"]').click();
    cy.wait(5000);
  });

  it('should post job successfully and show success toast', function() {
    cy.postJob();
    cy.contains('Job posted successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should draft job successfully and show success toast', function() {
    cy.postJob({ draft: true });
    cy.contains('Job drafted successfully', { timeout: 10000 }).should('be.visible');
  });

  it('should not allow to go next step if missing fields (detail)', function() {
    cy.get('[name="title"]').type('Graphic Designer');
    cy.get('[data-testid="category-combobox"]').click();
    cy.contains('[role="option"]', 'Design').click(); 
    cy.get('button[data-testid="next-step-button"]').click();
    cy.contains('is required', { timeout: 10000 }).should('be.visible');
  });

  it('should not allow to go next step if missing fields (description)', function() {
    cy.fillJobPostDetail();
    cy.get('button[data-testid="next-step-button"]').click();
    cy.get('[name="overview"]').type('Create visually appealing designs for marketing materials and social media.');
    cy.get('button.text-primary-foreground').click();
    cy.contains('is required', { timeout: 10000 }).should('be.visible');
  });

  it('should go back to previous step when clicking Back', () => {
    cy.fillJobPostDetail();
    cy.get('[data-testid="next-step-button"]').click();
    cy.get('button').contains('Back').click();
    cy.contains('Fill details').should('be.visible');
  });

  it('should show the job preview when reaching step 3', () => {
    cy.fillJobPostDetail();
    cy.get('[data-testid="next-step-button"]').click();
    cy.fillJobPostDescription();
    cy.get('[data-testid="next-step-button"]').click();
    cy.contains('Preview').should('be.visible');
  });

  it('should post and edit job successfully', function() {
    cy.postJob();
    cy.wait(5000);
    cy.get('a[href="/company/job-applicant"]').click();
    cy.wait(5000);
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('firstJobCard')
      .click();

    cy.on('window:confirm', () => true);

    cy.get('[data-testid="edit-job-button"]', { timeout: 10000 })
      .first()
      .click({ force: true });


    cy.get('[data-testid="location-combobox"]', { timeout: 10000 }).click();
    cy.get('[data-testid="province-option-Bangkok"]', { timeout: 10000 }).click();
    cy.get('[data-testid="district-option-Dusit"]', { timeout: 10000 }).click();
    cy.get('[data-testid="subdistrict-option-Dusit"]', { timeout: 10000 }).click();

    cy.get('[data-testid="edit-job-arrangement"]', { timeout: 5000 }).click();
    cy.get('[data-slot="select-content"]', { timeout: 5000 }).contains('onsite').click();

    cy.get('[data-testid="edit-job-type"]', { timeout: 5000 }).click();
    cy.get('[data-slot="select-content"]', { timeout: 5000 }).contains('internship').click();

    cy.get('[data-testid="edit-job-category"]', { timeout: 5000 }).click();
    cy.get('[data-slot="select-content"]', { timeout: 5000 }).contains('Design').click();

    cy.get('[data-testid="select-skill-trigger"]', { timeout: 5000 }).click();
    cy.get('[data-testid="skill-option-Adobe-XD"]', { timeout: 5000 }).click();
    cy.get('[data-testid="select-skill-trigger"]', { timeout: 5000 }).click();
    cy.get('[data-testid="skill-option-Social-Media"]', { timeout: 5000 }).click();

    cy.get('[data-testid="edit-job-salary-min"]', { timeout: 5000 }).clear().type('35000');
    cy.get('[data-testid="edit-job-salary-max"]', { timeout: 5000 }).clear().type('70000');

    cy.get('[data-testid="edit-job-overview"]', { timeout: 10000 }).clear().type('Updated overview for Senior Graphic Designer');
    cy.get('[data-testid="edit-job-responsibility"]', { timeout: 5000 }).clear().type('Updated responsibilities');
    cy.get('[data-testid="edit-job-requirement"]', { timeout: 5000 }).clear().type('Updated requirements');
    cy.get('[data-testid="edit-job-qualification"]', { timeout: 5000 }).clear().type('Updated qualifications');

    cy.get('[data-testid="save-edit-job-btn-2"]', { timeout: 5000 })
      .first()
      .click({ force: true });

    cy.contains('Job updated successfully!', { timeout: 10000 }).should('be.visible');
  });

  it('should post and delete job successfully', function() {
    cy.get('a[href="/company/job-applicant"]').click();
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('firstJobCard')
      .click();

    cy.on('window:confirm', () => true);

    cy.wait(5000);
    cy.get('[data-testid="delete-job-button"]', { timeout: 5000 }).first().click();

    cy.reload();
    cy.intercept('GET', '/api/company/jobs', { statusCode: 200, body: [] });
    cy.wait(500);
    cy.reload();
    cy.get('[data-testid^="job-card-"]').should('have.length', 0);
  });
});
