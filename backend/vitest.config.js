import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 30000,
        hookTimeout: 30000,
        setupFiles: ['./tests/setup.js'],
        fileParallelism: false,
        env: {
            NODE_ENV: 'test'
        },
        reporters: ['default', 'html'],
        outputFile: {
            html: './test-report/index.html'
        },
    },
});
