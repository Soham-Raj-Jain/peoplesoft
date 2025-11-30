// Import commands.js
import './commands';

// Hide fetch/XHR requests from command log (optional)
Cypress.on('uncaught:exception', (err, runnable) => {
    // Returning false here prevents Cypress from failing the test
    return false;
});