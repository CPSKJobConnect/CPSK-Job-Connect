describe('Student Bookmark Job', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    // allow session to settle after login
    cy.wait(5000);
    cy.request('GET', '/api/jobs/filter').then(function (resp) {
      const jobs = resp.body?.data || resp.body || [];
      if (!jobs || jobs.length === 0) {
        Cypress.log({ name: 'skip', message: 'No jobs found from /api/jobs/filter — skipping bookmark test.' });
        this.skip();
      }

      cy.get('a[href="/jobs"]', { timeout: 20000 }).should('be.visible').click();
      cy.wait(10000);
    });
  });

  it('bookmark job successfully', function() {

    // Choose a job that is NOT already saved according to the API, to avoid race/mismatch
    cy.request('GET', '/api/students/saved-jobs').then((savedResp) => {
      const savedJobs = savedResp.body?.savedJobs || []
      const savedIds = savedJobs.map((s: any) => String(s.job.id))

      // Fetch an available jobs list and pick one not already saved
      cy.request('GET', '/api/jobs?limit=50&offset=0').then((jobsResp) => {
        const jobs = jobsResp.body?.data || jobsResp.body || []
        let candidate = jobs.find((j: any) => !savedIds.includes(String(j.id)))
        if (!candidate) {
          // if all jobs are saved, just use the first job and we will toggle it
          candidate = jobs[0]
        }
        const id = String(candidate.id)

        // Ensure the specific job card is present in the DOM and bring it into view
        cy.get(`[data-testid="job-card-${id}"]`, { timeout: 30000 }).scrollIntoView().should('be.visible').as('firstJobCard')

        // Open actions and click bookmark. Break the chain to avoid re-render races.
        cy.get(`button[data-testid="job-actions-trigger-${id}"]`, { timeout: 5000 })
          .should('be.visible')
          .then(($trigger) => {
            cy.wrap($trigger).click();
          });
        // Wait briefly for the dropdown/menu to stabilize, then click the bookmark item
        cy.get(`[data-testid="bookmark-job-${id}"]`, { timeout: 7000 })
          .should('be.visible')
          .then(($item) => {
            // small pause helps when the UI animates the menu
            cy.wait(200);
            cy.wrap($item).click();
          });

        // Verify via API the job is saved
        cy.wait(1000)
        cy.request('GET', '/api/students/saved-jobs').then((resp) => {
          const updated = resp.body?.savedJobs || []
          const updatedIds = updated.map((s: any) => String(s.job.id))
          expect(updatedIds).to.include(id)
        })
      })
    })
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
    cy.get('[data-testid^="job-card-"]', { timeout: 30000 })
      .should('have.length.at.least', 1)
      .first()
      .as('bookmarkedJobCard')
      .scrollIntoView()
      .should('be.visible');
    cy.get('@bookmarkedJobCard').then(($card) => {
      const dt = $card.attr('data-testid') || ''
      const id = dt.replace('job-card-', '')
      // Verify via API the job remains in saved jobs list
      cy.request('GET', '/api/students/saved-jobs').then((resp) => {
        const savedJobs = resp.body?.savedJobs || []
        const savedIds = savedJobs.map((s: any) => String(s.job.id))
        expect(savedIds).to.include(id)
      })
    });
  });

  it('unbookmark job successfully', function() {
    cy.wait(2000);
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

    cy.get('[data-testid^="job-card-"]', { timeout: 30000 })
      .should('have.length.at.least', 1)
      .first()
      .as('bookmarkedJobCard')
      .scrollIntoView()
      .should('be.visible');

    cy.get('@bookmarkedJobCard').then(($card) => {
      const dt = $card.attr('data-testid') || ''
      const id = dt.replace('job-card-', '')
      // open actions and toggle (unsave) — click robustly to avoid re-render races
      cy.get(`button[data-testid="job-actions-trigger-${id}"]`, { timeout: 5000 })
        .should('be.visible')
        .then(($trigger) => cy.wrap($trigger).click());
      cy.get(`[data-testid="bookmark-job-${id}"]`, { timeout: 7000 })
        .should('be.visible')
        .then(($item) => {
          cy.wait(200);
          cy.wrap($item).click();
        });
      // Verify via API the job is no longer in saved jobs
      cy.wait(1000)
      cy.request('GET', '/api/students/saved-jobs').then((resp) => {
        const savedJobs = resp.body?.savedJobs || []
        const savedIds = savedJobs.map((s: any) => String(s.job.id))
        expect(savedIds).to.not.include(id)
      })
    });
  });
});