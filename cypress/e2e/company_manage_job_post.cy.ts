describe('Company Job Posting Flow', () => {

  beforeEach(() => {
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

  it('should post and delete job successfully', function() {
    cy.intercept('DELETE', '/api/jobs/*', {
      statusCode: 200,
      body: { message: 'Job deleted successfully!' }
    }).as('jobDeleting');

    cy.intercept('GET', '/api/company/jobs', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Graphic Designer',
          slug: 'graphic-designer-bangkok',
          location: 'Bangkok, Thailand',
          status: 'active',
          salary: { min: 15000, max: 30000 },
          overview: 'Create visually appealing designs for marketing materials and social media.',
          description: 'We are looking for a creative Graphic Designer to produce high-quality visuals for marketing and product materials.',
          responsibilities: [
            'Create marketing and promotional materials',
            'Collaborate with product and marketing teams',
            'Deliver final assets in required formats'
          ],
          skills: ['Adobe Photoshop', 'Illustrator', 'Figma', 'Communication'],
          company: { id: 42, name: 'Acme Co', logoUrl: '/assets/icons/company-placeholder.png' },
          createdAt: '2025-10-28T12:00:00.000Z',
          applied: 1,
          applicantsCount: 1,
          employmentType: 'part-time',
          category: 'Design',
        },
      ],
    }).as('getJobs');

    cy.postJob();

    cy.get('a[href="/company/job-applicant"]').click();
    cy.wait('@getJobs');
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('firstJobCard')
      .click();

    cy.on('window:confirm', () => true);

    cy.get('[data-testid="delete-job-button"]', { timeout: 5000 })
      .filter(':visible')
      .first()
      .click();

    cy.wait('@jobDeleting');
    cy.reload();
    cy.intercept('GET', '/api/company/jobs', { statusCode: 200, body: [] });
    cy.wait(500);
    cy.get('[data-testid^="job-card-"]').should('have.length', 0);
  });
});
