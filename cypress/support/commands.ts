import './commands';
// /// <reference types="cypress" />
// // ***********************************************
// // Custom commands for this project's Cypress tests
// // ***********************************************

// // Custom Cypress commands for authentication/session reuse
// // Adds helpers to log in as test users and cache the session

// declare global {
//   namespace Cypress {
//     interface Chainable {
//       loginAsStudent(email?: string, password?: string): Chainable<void>
//       loginAsCompany(email?: string, password?: string): Chainable<void>
//       login(role: 'student' | 'company', email: string, password: string): Chainable<void>
//       fillJobPostDetail(): Chainable<void>
//       fillJobPostDescription(): Chainable<void>
//       postJob(options?: { draft?: boolean; message?: string }): Chainable<void>;
//       mockJobAppApiPage(): Chainable<void>;
//     }
//   }
// }

// // const DEFAULTS = {
// //   student: { email: 'student_test@ku.th', password: 'test1234' },
// //   company: { email: 'company_test@gmail.com', password: 'test1234' },
// // }

// // Cypress.Commands.add('login', (role: 'student' | 'company', email: string, password: string) => {
// //   const key = `${role}:${email}`

// //   cy.session(key, () => {
// //     cy.visit('http://localhost:3000/')
// //     if (role === 'student') {
// //       cy.get('#role-selection div.bg-green-100').click()
// //     } else {
// //       cy.get('#role-selection div.hover\\:bg-orange-100 div.text-center').click()
// //     }
// //     cy.get('[name="email"]').clear().type(email)
// //     cy.get('[name="password"]').clear().type(password)
// //     cy.get('[data-testid="auth-submit"]').click()
// //     cy.location('pathname', { timeout: 10000 }).should('include', `/${role}/dashboard`);
// //   })
// //   cy.visit(`http://localhost:3000/${role}/dashboard`)
// // })


// // Cypress.Commands.add('loginAsStudent', (email = DEFAULTS.student.email, password = DEFAULTS.student.password) => {
// //   return cy.login('student', email, password)
// // })

// // Cypress.Commands.add('loginAsCompany', (email = DEFAULTS.company.email, password = DEFAULTS.company.password) => {
// //   return cy.login('company', email, password)
// // })

// Cypress.Commands.add('fillJobPostDetail', () => {
//   cy.get('[name="title"]').click();
//   cy.get('[name="title"]').type('Graphic Designer');
//   cy.get('[data-testid="category-combobox"]').click();
//   cy.contains('[role="option"]', 'Design').click(); 
//   cy.get('[data-testid="location-combobox"]').click();
//   cy.get('[data-testid="province-option-Bangkok"]').click();
//   cy.get('[data-testid="district-option-Dusit"]').click();
//   cy.get('[data-testid="subdistrict-option-Dusit"]').click();
//   cy.get('[data-testid="select-type-trigger"]').click({ force: true });
//   cy.contains('[role="option"]', 'internship').click({ force: true });
//   cy.get('[data-testid="select-arrangement-trigger"]').click({ force: true });
//   cy.contains('[role="option"]', 'onsite').click({ force: true });
//   cy.get('[name="minSalary"]').click();
//   cy.get('[name="minSalary"]').type('30000');
//   cy.get('[name="maxSalary"]').click();
//   cy.get('[name="maxSalary"]').type('60000');

//   const today = new Date();
//   const nextMonth = new Date(today);
//   nextMonth.setMonth(today.getMonth() + 1);

//   const yyyy = nextMonth.getFullYear();
//   const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
//   const dd = String(nextMonth.getDate()).padStart(2, '0');
//   const nextMonthDate = `${yyyy}-${mm}-${dd}`;

//   cy.get('[name="deadline"]').click();
//   cy.get('input[name="deadline"]')
//     .type(nextMonthDate)
//     .should('have.value', nextMonthDate);
// })

// Cypress.Commands.add('fillJobPostDescription', () => {
//   cy.get('[data-testid="select-skill-trigger"]').click();
//   cy.get('[data-testid="skill-option-Adobe-XD"]').click();
//   cy.get('[data-testid="skill-option-Social-Media"]').click();
//   cy.get('[name="overview"]').click();
//   cy.get('[name="overview"]').type('Create visually appealing designs for marketing materials and social media.');
//   cy.get('[name="responsibilities"]').click();
//   cy.get('[name="responsibilities"]').type('Design layouts, social media posts, and branding assets.');
//   cy.get('[name="requirements"]').click();
//   cy.get('[name="requirements"]').type('Strong portfolio of design projects, basic motion design is a plus.');
//   cy.get('[name="qualifications"]').click();
//   cy.get('[name="qualifications"]').type('Bachelor’s in Design or related field.');
// })

// Cypress.Commands.add('postJob', (options = {}) => {
//   const {
//     draft = false,
//     message = draft
//       ? 'Job drafted successfully!'
//       : 'Job posted successfully!',
//   } = options;

//   cy.intercept('POST', '/api/company/jobs/create', {
//     statusCode: 200,
//     body: { message },
//   }).as('jobPosting');


//   cy.fillJobPostDetail();
//   cy.get('[data-testid="next-step-button"]').click();
//   cy.fillJobPostDescription();
//   cy.get('[data-testid="next-step-button"]').click();

//   if (draft) {
//     cy.get('[data-testid="draft-job-button"]').click();
//   } else {
//     cy.get('[data-testid="publish-job-button"]').click();
//   }

//   cy.wait('@jobPosting');
// });

// // Cypress.Commands.add('editJob', () => {
// //   cy.get('[data-testid="edit-job-category"]').click();
// //   cy.contains('[role="option"]', 'Design').click(); 
// //   cy.get('[data-testid="edit-job-location-combobox"]').click();
// //   cy.get('[data-testid="province-option-Bangkok"]').click();
// //   cy.get('[data-testid="district-option-Dusit"]').click();
// //   cy.get('[data-testid="subdistrict-option-Dusit"]').click();
// //   cy.get('[data-testid="select-type-trigger"]').click({ force: true });
// //   cy.contains('[role="option"]', 'internship').click({ force: true });
// //   cy.get('[data-testid="select-arrangement-trigger"]').click({ force: true });
// //   cy.contains('[role="option"]', 'onsite').click({ force: true });
// //   cy.get('[name="minSalary"]').click();
// //   cy.get('[name="minSalary"]').type('30000');
// //   cy.get('[name="maxSalary"]').click();
// //   cy.get('[name="maxSalary"]').type('60000');

// //   const today = new Date();
// //   const nextMonth = new Date(today);
// //   nextMonth.setMonth(today.getMonth() + 1);

// //   const yyyy = nextMonth.getFullYear();
// //   const mm = String(nextMonth.getMonth() + 1).padStart(2, '0');
// //   const dd = String(nextMonth.getDate()).padStart(2, '0');
// //   const nextMonthDate = `${yyyy}-${mm}-${dd}`;

// //   cy.get('[name="deadline"]').click();
// //   cy.get('input[name="deadline"]')
// //     .type(nextMonthDate)
// //     .should('have.value', nextMonthDate);
// //   cy.get('[data-testid="select-skill-trigger"]').click();
// //   cy.get('[data-testid="skill-option-Adobe-XD"]').click();
// //   cy.get('[data-testid="skill-option-Social-Media"]').click();
// //   cy.get('[name="overview"]').click();
// //   cy.get('[name="overview"]').type('Create visually appealing designs for marketing materials and social media.');
// //   cy.get('[name="responsibilities"]').click();
// //   cy.get('[name="responsibilities"]').type('Design layouts, social media posts, and branding assets.');
// //   cy.get('[name="requirements"]').click();
// //   cy.get('[name="requirements"]').type('Strong portfolio of design projects, basic motion design is a plus.');
// //   cy.get('[name="qualifications"]').click();
// //   cy.get('[name="qualifications"]').type('Bachelor’s in Design or related field.');
// // });

// Cypress.Commands.add('mockJobAppApiPage', () => {
//   cy.intercept('GET', '/api/company/jobs', {
//       statusCode: 200,
//       body: [
//         {
//           id: 1,
//           title: 'Graphic Designer',
//           slug: 'graphic-designer-bangkok',
//           location: 'Bangkok, Thailand',
//           status: 'active',
//           salary: { min: 15000, max: 30000 },
//           overview: 'Create visually appealing designs for marketing materials and social media.',
//           description: 'We are looking for a creative Graphic Designer to produce high-quality visuals for marketing and product materials.',
//           responsibilities: [
//             'Create marketing and promotional materials',
//             'Collaborate with product and marketing teams',
//             'Deliver final assets in required formats'
//           ],
//           skills: ['Adobe Photoshop', 'Illustrator', 'Figma', 'Communication'],
//           company: { id: 42, name: 'Acme Co', logoUrl: '/assets/icons/company-placeholder.png' },
//           createdAt: '2025-10-28T12:00:00.000Z',
//           applied: 1,
//           applicantsCount: 1,
//           employmentType: 'part-time',
//           category: 'Design',
//         },
//       ],
//     }).as('getJobs');

//     // Mock filters
//     cy.intercept('GET', '/api/jobs/filter', {
//       statusCode: 200,
//       body: { categories: ['Design'], types: ['Full-time', 'Part-time'], arrangements: ['Remote'], tags: ['React'] },
//     }).as('getFilters');

//     // Mock applicants
//     cy.intercept('GET', '/api/jobs/1/applicants', {
//       statusCode: 200,
//       body: {
//         applicants: [
//           {
//             applicant_id: '1',
//             profile_url: '',
//             name: 'Test Student',
//             email: 'student@example.com',
//             status: '1',
//             applied_at: new Date().toISOString(),
//           },
//         ],
//       },
//     }).as('getApplicants');

//     // Mock company applicants (some flows call this)
//     cy.intercept('GET', '/api/company/applicants/*', {
//       statusCode: 200,
//       body: {
//         applicants: [
//           {
//             applicant_id: '1',
//             profile_url: '',
//             name: 'Test Student',
//             email: 'student@example.com',
//             status: '1',
//             applied_at: new Date().toISOString(),
//           },
//         ],
//       },
//     }).as('getCompanyApplicants');

//     // Mock status list
//     cy.intercept('GET', '/api/application-status', {
//       statusCode: 200,
//       body: {
//         statuses: [
//           { id: 1, name: 'pending' },
//           { id: 2, name: 'reviewed' },
//           { id: 3, name: 'interview' },
//           { id: 4, name: 'offered' },
//           { id: 5, name: 'rejected' },
//         ],
//       },
//     }).as('getStatusList');

//     // Mock PATCH for status update
//     cy.intercept('PATCH', '/api/applications/1/status', {
//       statusCode: 200,
//       body: { message: 'Status updated' },
//     }).as('patchStatus');
// });


// export {}
