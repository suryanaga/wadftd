module.exports = async () => {
  // Dynamically import the ESM-based Vite API and Node path module
  const { defineConfig } = await import('vite');
  const pathModule = await import('path');
  const path = pathModule.default || pathModule;

  return defineConfig({
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
};