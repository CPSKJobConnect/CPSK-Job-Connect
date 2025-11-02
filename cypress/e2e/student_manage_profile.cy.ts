it('should update student profile and show success toast', function () {
  cy.intercept('PUT', '/api/students/[id]', {
    statusCode: 200,
    body: { message: 'Profile updated successfully!' }
  }).as('updateProfile');

  cy.loginAsStudent('student1@ku.th', 'mim1234');
  cy.get('[data-testid="profile-menu-popover"]').click(); 
  cy.get('[data-testid="profile-menu-profile-btn"]').click();
  cy.wait(1000);
  cy.contains('Edit Profile').click();
  cy.get('#firstname').clear().type('Johnny');
  cy.get('#lastname').clear().type('Wattanakul');
  cy.get('#phone').clear().type('0897654321');
  cy.get('#faculty').click();
  cy.get('[data-testid="ske"]').click({ force: true });
  cy.get('#year').click();
  cy.contains('Year 3').click({ force: true });
  cy.get('[data-testid="student-save-edit-profile-btn"]').click();
  cy.wait('@updateProfile');
  cy.contains('Profile updated successfully', { timeout: 10000 }).should('be.visible')
});

it('should upload resume and show success toast', function() {
  cy.intercept('PUT', '/api/students/[id]', {
    statusCode: 200,
    body: { message: 'Profile updated successfully!' }
  }).as('updateProfile');

  cy.loginAsStudent('student1@ku.th', 'mim1234');
  cy.get('[data-testid="profile-menu-popover"]').click(); 
  cy.get('[data-testid="profile-menu-profile-btn"]').click();
  cy.wait(1000);
  cy.get('[name="student-document-tab"]').click();
  const fileName = 'sample_resume.pdf';
  cy.get('[data-testid="student-upload-resume-section"]').selectFile('cypress/fixtures/sample_resume.pdf', { force: true });
  cy.wait(2000);
  cy.contains('Document uploaded successfully', { timeout: 10000 }).should('be.visible');
});




