describe('Student Profile Update', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsStudent();
    // Allow extra time for session and header/menu to render
    cy.wait(8000);
    // Navigate directly to the profile page to avoid flaky popover/menu selectors
    cy.get('[data-testid="profile-menu-popover"]', { timeout: 15000 }).should('be.visible').click();
    cy.get('[data-testid="profile-menu-profile-btn"]', { timeout: 10000 }).should('be.visible').click();
    cy.wait(1000);
  });

  it('updates profile fields and profile picture successfully', () => {
    const ts = Date.now();
    const newFirst = `E2EFirst${ts}`;
    const newLast = `E2ELast${ts}`;
    const newPhone = '0123456789';

    cy.get('[data-testid="edit-profile-btn"]', { timeout: 20000 }).should('be.visible').click();
    cy.get('[data-testid="input-firstname"]').clear().type(newFirst);
    cy.get('[data-testid="input-lastname"]').clear().type(newLast);
    cy.get('[data-testid="input-phone"]').clear().type(newPhone);

    cy.get('[data-testid="select-faculty"]').click();
    cy.get('[data-testid="ske"]').click();
    cy.get('[data-testid="select-year"]').click();
    cy.get('[data-testid="year-3"]').click();

    cy.fixture('avatar.png', 'base64').then((fileBase64) => {
      const blob = Cypress.Blob.base64StringToBlob(fileBase64, 'image/png');
      const testFile = new File([blob], 'avatar.png', { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      cy.get('input[data-testid="profile-picture-input"]').then($input => {
        const input = $input[0] as HTMLInputElement;
        input.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });
    });

    cy.intercept('POST', '/api/students/profile-image').as('uploadProfileImage');
    cy.intercept('PUT', '/api/students/profile').as('updateProfile');

    cy.get('[data-testid="save-profile-btn"]').click();

    cy.wait('@uploadProfileImage', { timeout: 10000 });
    cy.wait('@updateProfile', { timeout: 10000 });

    cy.contains('Profile updated successfully', { timeout: 10000 }).should('be.visible');

    cy.get('h1').should('contain', `${newFirst} ${newLast}`);
  });

  it('shows validation errors for invalid input and invalid file type', () => {
    cy.get('[data-testid="edit-profile-btn"]', { timeout: 20000 }).should('be.visible').click();
    cy.get('[data-testid="input-firstname"]').clear();
    cy.get('[data-testid="save-profile-btn"]').click();

    cy.contains('First name must be at least 2 characters').should('be.visible');

    cy.get('[data-testid="input-firstname"]').type('AB');
    cy.get('[data-testid="input-phone"]').clear().type('123');
    cy.get('[data-testid="save-profile-btn"]').click();

    cy.contains('Phone number must be at least 10 digits').should('be.visible');

    cy.fixture('not-image.txt', 'utf8').then((txt) => {
      const blob = new Blob([txt], { type: 'text/plain' });
      const testFile = new File([blob], 'not-image.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      cy.get('input[data-testid="profile-picture-input"]').then($input => {
        const input = $input[0] as HTMLInputElement;
        input.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });
    });

    cy.contains('Please select an image file').should('be.visible');
  });
});
