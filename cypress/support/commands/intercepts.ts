declare global {
  namespace Cypress {
    interface Chainable {
      mockJobAppApiPage(): Chainable<void>;
      deleteJob(): Chainable<void>;
      getJobs(): Chainable<void>;
      editJob(): Chainable<void>;
      getFilters(): Chainable<void>;
      getApplicants(): Chainable<void>;
      getStatusList(): Chainable<void>;
      patchStatus(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('mockJobAppApiPage', () => {
  cy.getJobs();
  cy.getFilters();
  cy.getApplicants();
  cy.getStatusList();
  cy.patchStatus();
});

Cypress.Commands.add('getApplicants', () => {
  cy.intercept('GET', '/api/jobs/1/applicants', {
      statusCode: 200,
      body: {
        applicants: [
          {
            applicant_id: '1',
            profile_url: '',
            name: 'Test Student',
            email: 'student@example.com',
            status: '1',
            applied_at: new Date().toISOString(),
          },
        ],
      },
    }).as('getApplicants');
})

Cypress.Commands.add('getStatusList', () => {
  cy.intercept('GET', '/api/application-status', {
      statusCode: 200,
      body: {
        statuses: [
          { id: 1, name: 'pending' },
          { id: 2, name: 'reviewed' },
          { id: 3, name: 'interview' },
          { id: 4, name: 'offered' },
          { id: 5, name: 'rejected' },
        ],
      },
    }).as('getStatusList');
})

Cypress.Commands.add('patchStatus', () => {
  cy.intercept('PATCH', '/api/applications/1/status', {
      statusCode: 200,
      body: { message: 'Status updated' },
    }).as('patchStatus');
})

Cypress.Commands.add('deleteJob', () => {
  cy.intercept('DELETE', '/api/jobs/*', {
      statusCode: 200,
      body: { message: 'Job deleted successfully!' }
    }).as('jobDeleting');
})

Cypress.Commands.add('editJob', () => {
  cy.intercept('PATCH', '/api/jobs/*', {
      statusCode: 200,
      body: { message: 'Job updated successfully!' }
    }).as('jobEditing');
})

Cypress.Commands.add('getFilters', () => {
  cy.intercept('GET', '/api/jobs/filter', {
      statusCode: 200,
      body: {
        categories: ['Design'],
        types: ['internship', 'part-time', 'fulltime'],
        arrangements: ['onsite', 'remote'],
        tags: ['Adobe XD', 'Social Media'],
      },
    }).as('getFilters');
})

Cypress.Commands.add('getJobs', () => {
  cy.intercept('GET', '/api/company/jobs', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Graphic Designer',
          location: 'Bangkok',
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
          deadline: '2025-11-28T12:00:00.000Z'
        },
      ],
    }).as('getJobs');
})
export {}