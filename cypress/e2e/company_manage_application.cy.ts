describe('Company workflow: post job and change applicant status', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsCompany();
    cy.get('a[href="/company/job-posting"]').click();
    cy.wait(5000);
    cy.postJob();
    cy.mockJobAppApiPage();
  });


  it('changes applicant status successfully', () => {
    cy.wait(5000);
    cy.get('a[href="/company/job-applicant"]').first().click();
    cy.wait('@getJobs');

    cy.wait(1000);
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('firstJobCard')
      .should('be.visible')
      .click();
    cy.on('window:confirm', () => true);

  cy.wait('@getStatusList');
  cy.wait('@getApplicants');
  cy.wait(200);

    cy.get('[data-testid="applicant-card-1"]', { timeout: 10000 })
      .should('exist')
      .filter(':visible')
      .first()
      .as('applicantCard');

    cy.get('body', { timeout: 5000 }).then(($body) => {
      const pe = $body.css('pointer-events');
      if (pe === 'none') {
        cy.log('body has pointer-events:none — overriding to auto for test');
        cy.document().then((doc) => {
          doc.body.style.pointerEvents = 'auto';
        });
      }
    });

    cy.get('@applicantCard').within(() => {
      cy.get('[data-testid="status-select-1"]', { timeout: 10000 })
        .filter(':visible')
        .first()
        .scrollIntoView({ offset: { top: -100, left: 0 } })
        .should('be.visible')
        .click();
    });

    cy.get('[data-slot="select-content"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid="status-item-3"]', { timeout: 5000 }).click();
      });

    cy.wait('@patchStatus').its('response.statusCode').should('eq', 200);

    cy.get('[data-testid="applicant-card-1"]')
    .find('[data-slot="select-value"]')
    .contains(/interview/i);
  });
});