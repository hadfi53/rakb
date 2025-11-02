import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['@stripe/stripe-js', '@stripe/react-stripe-js'],
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps in production for better security
    sourcemap: false,
    // Minify code to make it harder to read
    minify: 'esbuild', // esbuild is faster and included with Vite
    // Remove console statements in production build
    esbuild: {
      drop: ['console', 'debugger'], // Remove console and debugger in production
    },
  }
});
