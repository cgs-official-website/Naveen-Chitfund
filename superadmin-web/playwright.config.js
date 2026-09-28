import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    fullyParallel: false,
    retries: 0,
    workers: 1,
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        }
    ],
    webServer: {
        command: 'npm run dev',
        port: 5174,
        reuseExistingServer: true,
        cwd: './',
    },
});
