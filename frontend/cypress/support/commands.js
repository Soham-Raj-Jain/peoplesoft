// Get a REAL valid token from backend
Cypress.Commands.add('loginWithRealToken', (email) => {
    const role = email.includes('hr') ? 'hr' : email.includes('manager') ? 'manager' : 'employee';

    // Call backend test endpoint to get real token
    cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/test/token?email=${email}&role=${role}`,
        failOnStatusCode: false
    }).then((response) => {
        if (response.status === 200 && response.body.token) {
            cy.window().then((win) => {
                win.localStorage.setItem('token', response.body.token);
                win.localStorage.setItem('email', response.body.email);
                win.localStorage.setItem('role', response.body.role);
                win.localStorage.setItem('name', response.body.name || 'Test User');
            });

            cy.log('✅ Got real token from backend');
        } else {
            cy.log('❌ Failed to get token, using mock');
            // Fallback to mock if endpoint not available
            cy.window().then((win) => {
                win.localStorage.setItem('token', 'mock-token');
                win.localStorage.setItem('email', email);
                win.localStorage.setItem('role', role);
            });
        }
    });
});