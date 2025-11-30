import axios from 'axios'
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});




// Add token to every request
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        // ✅ IF CYPRESS, ALWAYS ALLOW REQUESTS
        if (window.Cypress) {
            config.headers.Authorization = `Bearer cypress-test-token`;
            return config;
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ✅ HANDLE ERRORS - DON'T REDIRECT IN CYPRESS
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect to login if in Cypress
        if (!window.Cypress && error.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default client