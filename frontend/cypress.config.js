import { defineConfig } from 'cypress';

export default defineConfig({
 
    env: {
        BASE_URL: process.env.CYPRESS_BASE_URL,
        HR_EMAIL: "peoplesoftent.hr@gmail.com",
        HR_NAME: "Jasmin Park",
        HR_ROLE: "hr",
        HR_FIRST_NAME: "Jasmin",
        MANAGER_EMAIL: "peoplesoftent.manager@gmail.com",
        MANAGER_NAME: "Jack Fernandes",
        MANAGER_ROLE: "manager",
        MANAGER_FIRST_NAME: "Jack",
        EMP_EMAIL: "peoplesoftent.employee@gmail.com",
        EMP_NAME: "Maria Fisher",
        EMP_ROLE: "employee",
        EMP_FIRST_NAME: "Maria"
    },
    e2e: {
        baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
        supportFile: 'cypress/support/e2e.js',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',

        viewportWidth: 1920,
        viewportHeight: 1080,

        video: true,
        videoCompression: 15,
        videosFolder: 'cypress/videos',

        screenshotOnRunFailure: true,
        screenshotsFolder: 'cypress/screenshots',

        defaultCommandTimeout: 20000,
        pageLoadTimeout: 60000,
        requestTimeout: 20000,

        chromeWebSecurity: false,
        testIsolation: false,

        retries: {
            runMode: 1,
            openMode: 0,
        },
    },
});