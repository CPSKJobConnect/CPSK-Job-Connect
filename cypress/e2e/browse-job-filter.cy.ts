describe('Browse jobs - filter bar', () => {
  before(() => {
    cy.viewport(1280, 800);
  });

  it('search by keyword returns the right job', () => {
    cy.loginAsStudent();
    cy.get('a[href="/jobs"]').click();
    cy.wait(5000);
    cy.get('[data-testid="job-keyword-input"]').type('Graphic Designer');
    cy.get('[data-testid="search-button"]').click();
    cy.wait(5000);
    cy.contains('Graphic Designer', { timeout: 10000 }).should('be.visible');
  });

  it('applies all filters and returns the expected job', () => {
    cy.loginAsStudent();
    cy.get('a[href="/jobs"]').click();
    cy.wait(5000);
    cy.get('[data-testid="filters-trigger"]').click();
    cy.contains('Filter Jobs', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="location-combobox"]').click({ force: true });
    cy.get('[data-testid="province-option-Bangkok"]').click({ force: true });
    cy.get('[data-testid="district-option-Dusit"]').click({ force: true });
    
    cy.get('body', { timeout: 10000 }).should('not.have.attr', 'data-scroll-locked', '1');

    cy.get('[data-testid="select-job-category"]').click({ force: true });
    cy.contains('[role="option"]', 'Design').click({ force: true });
    cy.get('body').then(($body) => {
      const sheetVisible = $body.find('[data-slot="sheet-content"]:visible').length > 0;
      if (!sheetVisible) {
        cy.get('[data-testid="filters-trigger"]').click({ force: true });
        cy.contains('Filter Jobs', { timeout: 10000 }).should('be.visible');
      }
  });

    cy.get('[data-testid="select-min-salary"]').scrollIntoView().click({ force: true });
    cy.contains('[role="option"]', '30000').click({ force: true });

    cy.get('[data-testid="select-max-salary"]').scrollIntoView().click({ force: true });
    cy.contains('[role="option"]', '50000').click({ force: true });

    cy.get('[data-testid="select-job-type"]').scrollIntoView().click({ force: true });
    cy.contains('[role="option"]', 'internship').click({ force: true });

    cy.get('[data-testid="select-job-arrangement"]').scrollIntoView().click({ force: true });
    cy.contains('[role="option"]', 'onsite').click({ force: true });

    cy.get('[data-testid="select-date-post"]').scrollIntoView().click({ force: true });
    cy.contains('[role="option"]', 'Today').click({ force: true });

    cy.get('[data-testid="apply-filters-button"]').scrollIntoView().click({ force: true });

      cy.contains('Graphic Designer', { timeout: 10000 }).should('be.visible');
    });
});
