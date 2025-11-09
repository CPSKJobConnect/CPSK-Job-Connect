it('bookmark job successfully', function() {
    cy.loginAsStudent();
    cy.request('GET', '/api/jobs/filter').then(function (resp) {
      const jobs = resp.body?.data || resp.body || [];
      if (!jobs || jobs.length === 0) {
        Cypress.log({ name: 'skip', message: 'No jobs found from /api/jobs/filter — skipping bookmark test.' });
        this.skip();
      }

      cy.get('a[href="/jobs"]').click();
      cy.viewport(1280, 800);
    });

    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('firstJobCard')
      .should('be.visible');

    cy.get('@firstJobCard').within(() => {
      cy.get('button[data-testid="bookmark-job"]').click();
    });
    cy.wait(2000);
      cy.get('body').then(($body) => {
        const $avatar = $body.find('[data-testid="profile-avatar"]');
        if ($avatar.length) {
          cy.wrap($avatar.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        const $hamburger = $body.find('button[aria-label="Open menu"]');
        if ($hamburger.length) {
          cy.wrap($hamburger.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        const $profileTrigger = $body.find('div[role="button"][aria-haspopup="menu"]');
        if ($profileTrigger.length) {
          cy.wrap($profileTrigger.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        throw new Error('Could not find a menu trigger (profile-avatar, hamburger, or profile trigger) to open Bookmark menu.');
      });
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('bookmarkedJobCard')
      .should('be.visible');
    cy.get('@bookmarkedJobCard').within(() => {
      cy.get('button[data-testid="bookmark-job"]').should('have.attr', 'aria-pressed', 'true');
    });
});    

it('unbookmark job successfully', function() {
    cy.loginAsStudent();
    cy.wait(1000);
      cy.get('body').then(($body) => {
        const $hamburger = $body.find('button[aria-label="Open menu"]');
        if ($hamburger.length) {
          cy.wrap($hamburger.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        const $avatar = $body.find('[data-testid="profile-avatar"]');
        if ($avatar.length) {
          cy.wrap($avatar.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        const $profileTrigger = $body.find('div[role="button"][aria-haspopup="menu"]');
        if ($profileTrigger.length) {
          cy.wrap($profileTrigger.first()).click();
          cy.contains('Bookmark', { timeout: 5000 }).click();
          return;
        }

        throw new Error('Could not find menu trigger to open Bookmark menu.');
      });

    cy.get('[data-testid^="job-card-"]', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .as('bookmarkedJobCard')
      .should('be.visible');

    cy.get('@bookmarkedJobCard').find('button[data-testid="bookmark-job"]').as('bookmarkBtn');
    cy.get('@bookmarkBtn').click();

    cy.get('button[data-testid="bookmark-job"][aria-pressed="true"]', { timeout: 10000 }).should('not.exist');
});
