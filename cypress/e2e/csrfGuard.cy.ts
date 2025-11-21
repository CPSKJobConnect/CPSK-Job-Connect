describe('CSRF Guard (Cypress)', () => {
  // Use configured baseUrl when available, otherwise default to localhost:3000
  const base = Cypress.config('baseUrl') || 'http://localhost:3000';
  const endpoint = `${base}/api/test/csrf`;

  it('rejects browser-style form POST without custom header', () => {
    cy.request({
      method: 'POST',
      url: endpoint,
      body: 'a=b&c=d',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.equal(403);
    });
  });

  it('accepts frontend POST with x-app-request header and JSON body', () => {
    cy.request({
      method: 'POST',
      url: endpoint,
      body: { test: 'data' },
      headers: { 'x-app-request': '1', 'content-type': 'application/json' },
    }).then((resp) => {
      expect(resp.status).to.equal(200);
      expect(resp.body).to.have.property('ok', true);
      expect(resp.body.body).to.deep.equal({ test: 'data' });
    });
  });

  // PATCH tests
  it('rejects PATCH without custom header', () => {
    cy.request({
      method: 'PATCH',
      url: endpoint,
      body: { a: 'b' },
      headers: { 'content-type': 'application/json' },
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.equal(403);
    });
  });

  it('accepts PATCH with x-app-request header', () => {
    cy.request({
      method: 'PATCH',
      url: endpoint,
      body: { a: 'b' },
      headers: { 'x-app-request': '1', 'content-type': 'application/json' },
    }).then((resp) => {
      expect(resp.status).to.equal(200);
      expect(resp.body).to.have.property('method', 'PATCH');
    });
  });

  // DELETE tests
  it('rejects DELETE without custom header', () => {
    cy.request({
      method: 'DELETE',
      url: endpoint,
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.equal(403);
    });
  });

  it('accepts DELETE with x-app-request header', () => {
    cy.request({
      method: 'DELETE',
      url: endpoint,
      headers: { 'x-app-request': '1' },
    }).then((resp) => {
      expect(resp.status).to.equal(200);
      expect(resp.body).to.have.property('method', 'DELETE');
    });
  });
});
