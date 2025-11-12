// Custom Cypress command type declarations for project
// Add additional custom commands here as needed

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom helper to log in as a test student user in Cypress tests.
     */
    loginAsStudent(): Chainable<void>;
  }
}
