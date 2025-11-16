/// <reference types="cypress" />

context('Company - Job Posting Flow', () => {
  beforeEach(() => {
    const base = Cypress.config('baseUrl') || Cypress.env('baseUrl') || 'http://localhost:3000';
    cy.loginAsCompany();
    cy.request({ method: 'GET', url: `${base}/api/auth/session` }).its('status').should('be.oneOf', [200, 204]);
    cy.request({ method: 'GET', url: `${base}/api/jobs/filter` }).then((res) => {
      Cypress.env('jobFilters', res.body || {});
    });

    cy.visit(`${base}/company/job-posting`);
    cy.get('[data-testid="job-title-input"]', { timeout: 20000 }).should('exist');
  });

  it('Happy path - company can post a job (fills all steps and publishes)', function (this: Mocha.Context) {
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping happy path');
      this.skip();
    }

    const title = `E2E Test Job ${Date.now()}`;
    cy.get('[data-testid="job-title-input"]').clear().type(title);

    cy.get('[data-testid="category-combobox"]').click();
    const cat0 = filters.categories[0] || '';
    const catSafe0 = cat0.replace(/\s+/g, '-');
    cy.get(`[data-testid="category-option-${catSafe0}"]`, { timeout: 4000 }).click();

    cy.get('[data-testid="location-combobox"]').click();
    cy.get('[data-testid="province-option-Bangkok"]').click();
    cy.get('[data-testid="district-option-Dusit"]').click();
    cy.get('[data-testid="subdistrict-option-Dusit"]').click();

    if (filters.types && filters.types.length > 0) {
      cy.get('[data-testid="select-job-type"]').click();
      cy.contains(filters.types[0]).click();
    }

    if (filters.arrangements && filters.arrangements.length > 0) {
      cy.get('[data-testid="select-arrangement"]').click();
      cy.contains(filters.arrangements[0]).click();
    }

    cy.get('[data-testid="min-salary-input"]').clear().type('30000');
    cy.get('[data-testid="max-salary-input"]').clear().type('60000');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    cy.get('[data-testid="deadline-input"]').clear().type(dateStr);

    cy.get('[data-testid="reqdoc-resume"]').check({ force: true });
    cy.get('[data-testid="next-button"]').click();

    cy.get('[data-testid="skill-combobox"]', { timeout: 10000 }).should('be.visible').click();
    const skill = `e2e-skill-${Date.now()}`;
    cy.get('input[placeholder="Search skill..."]', { timeout: 2000 }).type(skill);
    cy.contains(`Add new skill: ${skill}`).click();

    cy.get('[data-testid="overview-textarea"]').clear().type('This is a short overview for E2E test.');
    cy.get('[data-testid="responsibility-textarea"]').clear().type('Do things, write code, test features.');
    cy.get('[data-testid="requirement-textarea"]').clear().type('1+ years experience, willingness to learn.');
    cy.get('[data-testid="qualification-textarea"]').clear().type('Bachelor degree or equivalent.');
    cy.get('[data-testid="next-button"]').click();
    cy.get('[data-testid="publish-button"]').click();

    cy.contains('Job posted successfully!', { timeout: 10000 }).should('exist');
    cy.url().should('include', '/company/job-applicant');
  });

  it('Step 1 validation - required fields block progression and show messages', function (this: Mocha.Context) {
    cy.get('[data-testid="job-title-input"]').clear();
    cy.get('[data-testid="min-salary-input"]').clear();
    cy.get('[data-testid="max-salary-input"]').clear();
    cy.get('[data-testid="next-button"]').click();

    cy.contains('is required', { timeout: 10000 }).should('be.visible');
  });

  it('Later steps validation - description required fields and skills are enforced', function (this: Mocha.Context) {
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping later steps validation');
      return this.skip();
    }

    cy.get('[data-testid="job-title-input"]').clear().type(`E2E Validation ${Date.now()}`);
    cy.get('[data-testid="category-combobox"]').click();
    const cat1 = filters.categories[0] || '';
    const catSafe1 = cat1.replace(/\s+/g, '-');
    cy.get(`[data-testid="category-option-${catSafe1}"]`, { timeout: 4000 }).click();
    cy.get('[data-testid="min-salary-input"]').clear().type('20000');
    cy.get('[data-testid="max-salary-input"]').clear().type('40000');
    const future = new Date(); future.setDate(future.getDate() + 5);
    const fyyyy = future.getFullYear();
    const fmm = String(future.getMonth() + 1).padStart(2,'0');
    const fdd = String(future.getDate()).padStart(2,'0');
    cy.get('[data-testid="deadline-input"]').clear().type(`${fyyyy}-${fmm}-${fdd}`);

    cy.get('[data-testid="next-button"]').click();

    cy.get('[data-testid="next-button"]').click();
    cy.contains('is required', { timeout: 10000 }).should('be.visible');
  });

  it('Salary validation - min > max blocks progression with correct message', function (this: Mocha.Context) {
    cy.get('[data-testid="job-title-input"]').clear().type(`E2E Salary ${Date.now()}`);
    cy.get('[data-testid="category-combobox"]').click();
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping salary validation');
      return this.skip();
    }
    const cat2 = filters.categories[0] || '';
    const catSafe2 = cat2.replace(/\s+/g, '-');
    cy.get(`[data-testid="category-option-${catSafe2}"]`, { timeout: 4000 }).click();
    cy.get('[data-testid="min-salary-input"]').clear().type('80000');
    cy.get('[data-testid="max-salary-input"]').clear().type('40000');

    cy.get('[data-testid="next-button"]').click();

    cy.contains('Min Salary should be less than Max Salary').should('exist');
  });

  it('Deadline validation - selecting past date is blocked', function (this: Mocha.Context) {
    cy.get('[data-testid="job-title-input"]').clear().type(`E2E Deadline ${Date.now()}`);
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping deadline validation');
      return this.skip();
    }
    cy.get('[data-testid="category-combobox"]').click();
    const cat3 = filters.categories[0] || '';
    const catSafe3 = cat3.replace(/\s+/g, '-');
    cy.get(`[data-testid="category-option-${catSafe3}"]`, { timeout: 4000 }).click();

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yyyyy = yesterday.getFullYear();
    const ymm = String(yesterday.getMonth() + 1).padStart(2,'0');
    const ydd = String(yesterday.getDate()).padStart(2,'0');
    cy.get('[data-testid="deadline-input"]').clear().type(`${yyyyy}-${ymm}-${ydd}`);

    cy.get('[data-testid="min-salary-input"]').clear().type('20000');
    cy.get('[data-testid="max-salary-input"]').clear().type('30000');

    cy.get('[data-testid="next-button"]').click();

    cy.contains('The deadline must be a future date.').should('exist');
  });

  it('Happy path - Edit Job Post (create -> edit -> verify)', function (this: Mocha.Context) {
    const base = Cypress.config('baseUrl') || 'http://localhost:3000'
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping edit job test');
      this.skip();
    }

    if (!filters.tags || filters.tags.length === 0) {
      cy.log('No tags available, skipping edit job test');
      this.skip();
    }

    const createBody = {
      title: `E2E Edit Job ${Date.now()}`,
      category: filters.categories[0] || 'Other',
      location: 'Bangkok',
      type: (filters.types && filters.types[0]) || 'fulltime',
      arrangement: (filters.arrangements && filters.arrangements[0]) || 'onsite',
      salary: { min: 10000, max: 20000 },
      posted: new Date().toISOString(),
      deadline: (() => { const d = new Date(); d.setDate(d.getDate()+10); return d.toISOString().slice(0,10); })(),
      skills: [filters.tags[0]],
      description: { overview: 'overview', responsibility: 'resp', requirement: 'req', qualification: 'qual' },
      documents: ['Resume'],
      is_published: true,
    };

    cy.request({ method: 'POST', url: `${base}/api/company/jobs/create`, body: createBody }).then((res) => {
      cy.wrap([200, 201]).should('include', res.status);
      const job = res.body;
      const jobId = job.id || job.jobId || job.data?.id;
      cy.wrap(jobId).should('exist');

      cy.visit(`${base}/company/job-applicant`);
      cy.get(`[data-testid="job-card-${jobId}"]`, { timeout: 10000 }).should('exist').click();
      cy.get('[data-testid="edit-job-button"]', { timeout: 5000 }).filter(':visible').first().click();

      const newTitle = `E2E Edited ${Date.now()}`;
      cy.get('[data-testid="edit-job-overview"]').clear().type('Edited overview');
      cy.get('[data-testid="edit-job-responsibility"]').clear().type('Edited responsibility');
      cy.get('[data-testid="edit-job-salary-min"]').clear().type('15000');
      cy.get('[data-testid="edit-job-salary-max"]').clear().type('25000');
      cy.get('[data-testid="edit-job-overview"]').clear().type('Edited overview');

      cy.get('[data-testid="save-edit-job-btn-2"]').click();
      cy.get('[data-testid="confirm-save-button"]', { timeout: 5000 }).filter(':visible').first().click({ force: true });
      
      cy.contains('Job updated successfully!', { timeout: 10000 }).should('exist');

      cy.request({ method: 'GET', url: `${base}/api/jobs/${jobId}` }).then((r2) => {
        cy.wrap(r2.status).should('equal', 200);
        const overview = r2.body?.description?.overview || r2.body?.aboutRole || r2.body?.description || '';
        cy.wrap(String(overview)).should('include', 'Edited overview');
      });
    });
  });

  it('Delete Job Post (create -> delete -> verify removed)', function (this: Mocha.Context) {
    const base = Cypress.config('baseUrl') || 'http://localhost:3000'
    const filters = Cypress.env('jobFilters') || {};
    if (!filters || !filters.categories || filters.categories.length === 0) {
      cy.log('No categories available, skipping delete job test');
      this.skip();
    }
    if (!filters.tags || filters.tags.length === 0) {
      cy.log('No tags available, skipping delete job test');
      this.skip();
    }

    const createBody = {
      title: `E2E Delete Job ${Date.now()}`,
      category: filters.categories[0] || 'Other',
      location: 'Bangkok',
      type: (filters.types && filters.types[0]) || 'fulltime',
      arrangement: (filters.arrangements && filters.arrangements[0]) || 'onsite',
      salary: { min: 10000, max: 20000 },
      posted: new Date().toISOString(),
      deadline: (() => { const d = new Date(); d.setDate(d.getDate()+10); return d.toISOString().slice(0,10); })(),
      skills: [filters.tags[0]],
      description: { overview: 'overview', responsibility: 'resp', requirement: 'req', qualification: 'qual' },
      documents: ['Resume'],
      is_published: true,
    };

    cy.request({ method: 'POST', url: `${base}/api/company/jobs/create`, body: createBody }).then((res) => {
      cy.wrap([200, 201]).should('include', res.status);
      const job = res.body;
      const jobId = job.id || job.jobId || job.data?.id;
      cy.wrap(jobId).should('exist');

      cy.visit(`${base}/company/job-applicant`);
      cy.reload();
      cy.get(`[data-testid="job-card-${jobId}"]`, { timeout: 30000 }).should('exist').click();

      cy.on('window:confirm', () => true);

      cy.get('[data-testid="delete-job-button"]', { timeout: 5000 }).filter(':visible').first().click({ force: true });
      cy.contains('Job deleted successfully!', { timeout: 10000 }).should('exist');

      cy.request({ method: 'GET', url: `${base}/api/jobs/${jobId}`, failOnStatusCode: false }).then((r) => {
        cy.wrap([404, 410]).should('include', r.status);
      });
    });
  });
});
