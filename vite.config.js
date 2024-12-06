import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5000
    },
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true
    }
});
