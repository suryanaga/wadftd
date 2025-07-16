const { defineConfig } = require('vite');
const path = require('path');

module.exports = defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.js'),
      output: {
        // Always emit the main entry as "bundle.js"
        entryFileNames: 'bundle.js',
        // Hash other assets for caching
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
});