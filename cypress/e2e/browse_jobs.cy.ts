describe('Browse jobs - dynamic filter tests', () => {
  const _ignoreErr = (err: Error) => {
    const msg = err && (err.message || '');
    if (msg.includes('ResizeObserver loop completed with undelivered notifications')) return false;
    if (msg.includes("Failed to execute 'removeChild'")) return false;
    return undefined;
  }

  before(function () {
    cy.viewport(1280, 800);
    Cypress.on('uncaught:exception', _ignoreErr);
  });

  after(function () {
    Cypress.off('uncaught:exception', _ignoreErr);
  });

  beforeEach(function () {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    cy.wait(5000);
    // Allow extra time for auth/session and nav to be ready
    cy.wait(8000);
    cy.get('a[href="/jobs"]', { timeout: 20000 }).should('be.visible').click();
    cy.wait(10000);
    cy.get('[data-testid^="job-card-"]', { timeout: 15000 }).should('have.length.at.least', 1);

    const base = Cypress.env('baseUrl') || Cypress.config('baseUrl') || 'https://localhost:3000';
    cy.request({ method: 'GET', url: `${base}/api/jobs` }).then((resp) => {
      const jobs = resp.body?.data || resp.body || [];
      if (!jobs || jobs.length === 0) {
        Cypress.log({ name: 'skip', message: 'No jobs found — skipping browse jobs tests.' });
        return;
      }
      const job = jobs.find((j: any) => j.title && j.category) || jobs[0];
      cy.wrap(job).as('job');
    });

    cy.request({ method: 'GET', url: `${base}/api/jobs/filter` }).then((resp) => {
      const filters = resp.body || resp.body?.data || {};
      cy.wrap(filters).as('filterInfo');
    });
  });

  it('search by keyword returns the job', function () {
    cy.get('@job').then((job: any) => {
      const keyword = job.title.split(' ').slice(0, 3).join(' ');

      cy.get('[data-testid="job-keyword-input"]').clear().type(keyword);
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid^="job-card-"]', { timeout: 15000 }).first().should('contain.text', job.title.slice(0, Math.min(30, job.title.length)));
      cy.get('[data-testid^="job-card-"]').first().click();
      cy.contains(job.title, { timeout: 10000 }).should('be.visible');
    });
  });

  it('filter: category returns matching jobs', function () {
    cy.get('@job').then((job: any) => {
      const category = job.category;

      cy.get('[data-testid="filters-trigger"]').click();
      cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');

      cy.get('[data-testid="select-job-category"]').click({ force: true });
      cy.contains(category, { timeout: 5000 }).click({ force: true });
      cy.get('[data-testid="apply-filters-button"]').click({ force: true });

      cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
      cy.get('[data-testid^="job-card-"]').first().invoke('text').then((text) => {
        cy.wrap(text.includes(category) || text.includes(job.title)).should('be.true');
      });
    });
  });

  it('filter: location (province/district) returns matching jobs when present', function () {
    cy.get('@job').then((job: any) => {
      if (!job.location || !job.location.includes(',')) {
        cy.log('Job location not parsable — skipping location test');
        return;
      }

      const parts = job.location.split(',').map((s: string) => s.trim());
      const province = parts[0];
      const district = parts[1];

      cy.get('[data-testid="filters-trigger"]').click();
      cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');

      cy.get('[data-testid="location-combobox"]').click({ force: true });
      cy.get(`[data-testid="province-option-${province}"]`, { timeout: 5000 }).click({ force: true });
      if (district) {
        cy.get(`[data-testid="district-option-${district}"]`, { timeout: 5000 }).click({ force: true });
      }

      cy.get('[data-testid="apply-filters-button"]').click({ force: true });
      cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
      cy.get('[data-testid^="job-card-"]').first().invoke('text').then((text) => {
        cy.wrap(text.includes(province) || text.includes(job.title)).should('be.true');
      });
    });
  });

  it('filter: salary min/max returns matching jobs when filter options present', function () {
    cy.get('@job').then((job: any) => {
      cy.get('@filterInfo').then((filters: any) => {
        const ranges: string[] = filters.salaryRanges || [];
        if (!ranges || ranges.length === 0) {
          cy.log('No salary ranges provided by filter API — skipping salary test');
          return;
        }

        const minOpt = ranges.find((r: string) => Number(r) <= (job.salary?.min || 0)) || ranges[0];
        const maxOpt = ranges.slice().reverse().find((r: string) => Number(r) >= (job.salary?.max || 0)) || ranges[ranges.length - 1];

        cy.get('[data-testid="filters-trigger"]').click();
        cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');

        cy.get('[data-testid="select-min-salary"]').click({ force: true });
        cy.contains(minOpt, { timeout: 5000 }).click({ force: true });

        cy.get('[data-testid="select-max-salary"]').click({ force: true });
        cy.contains(maxOpt, { timeout: 5000 }).click({ force: true });

        cy.get('[data-testid="apply-filters-button"]').click({ force: true });
        cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
      });
    });
  });

  it('filter: job type returns matching jobs when type exists', function () {
    cy.get('@job').then((job: any) => {
      if (!job.type) {
        cy.log('No job.type present — skipping job type test');
        return;
      }

      cy.get('[data-testid="filters-trigger"]').click();
      cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');

      cy.get('[data-testid="select-job-type"]').click({ force: true });
      cy.contains(job.type, { timeout: 5000 }).click({ force: true });
      cy.get('[data-testid="apply-filters-button"]').click({ force: true });
      cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
    });
  });

  it('filter: arrangement returns matching jobs when arrangement exists', function () {
    cy.get('@job').then((job: any) => {
      if (!job.arrangement) {
        cy.log('No job.arrangement present — skipping arrangement test');
        return;
      }

      cy.get('[data-testid="filters-trigger"]').click();
      cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');

      cy.get('[data-testid="select-job-arrangement"]').click({ force: true });
      cy.contains(job.arrangement, { timeout: 5000 }).click({ force: true });
      cy.get('[data-testid="apply-filters-button"]').click({ force: true });
      cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);
    });
  });

  it('filter: date posted returns recent jobs (2weeks) when option available', function () {
    const roHandler = (err: Error) => {
      if (err && err.message && err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return false
      }
      return undefined
    }
    Cypress.on('uncaught:exception', roHandler)

    cy.get('[data-testid="filters-trigger"]').click();
    cy.contains('Filter Jobs', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="select-date-post"]').click({ force: true });
    cy.get('body').then($body => {
      if ($body.find('[data-testid="date-post-2weeks"]').length) {
        cy.get('[data-testid="date-post-2weeks"]', { timeout: 5000 }).click({ force: true })
      } else {
        cy.contains('2weeks', { timeout: 5000 }).click({ force: true })
      }
    })
    cy.get('[data-testid="apply-filters-button"]').click({ force: true });
    cy.get('[data-testid^="job-card-"]', { timeout: 10000 }).should('have.length.at.least', 1);

    Cypress.off('uncaught:exception', roHandler)
  });
});