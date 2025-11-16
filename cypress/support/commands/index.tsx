// cypress/support/commands/index.ts
import './auth';

// helper to collect visible toast texts from the Sonner toaster
Cypress.Commands.add('getToasts', () => {
	return cy.get('[data-testid="app-toaster"]', { timeout: 5000 }).then(($t) => {
		// Sonner renders toasts as children; select elements with role "status" or any child divs
		const toasts = $t[0].querySelectorAll('[role="status"], .toaster > *');
		const texts: string[] = [];
		toasts.forEach((el) => {
			const txt = (el.textContent || '').trim();
			if (txt) texts.push(txt);
		});
		return cy.wrap(texts);
	});
});

// convenience: assert that any of the toasts contain the provided text
Cypress.Commands.add('expectToast', (expected: string) => {
	return cy.getToasts().then((texts: string[]) => {
		const found = texts.some((t) => t.includes(expected));
		expect(found, `expected toaster to include "${expected}". Found: ${texts.join(' | ')}`).to.be.true;
	});
});
