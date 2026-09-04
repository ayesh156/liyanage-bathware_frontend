import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    fs: {
      allow: [".", "./src"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Radix UI components - split by category
          'radix-overlays': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dropdown-menu',
          ],
          'radix-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-label',
          ],
          'radix-navigation': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-tabs',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-scroll-area',
          ],
          'radix-misc': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-toast',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-slot',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-aspect-ratio',
          ],
          
          // Heavy libraries
          'charts': ['recharts'],
          '3d': ['three', '@react-three/fiber', '@react-three/drei'],
          'animations': ['framer-motion'],
          'ui-utils': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'cmdk',
            'date-fns',
            'embla-carousel-react',
            'input-otp',
            'lucide-react',
            'vaul',
          ],
          'forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod',
          ],
          'i18n': ['i18next', 'react-i18next'],
          // Real product catalogue — kept in its own chunk so the app shell
          // doesn't have to parse 3500+ objects on initial page load.
          'inventory-data': ['./src/data/inventoryData'],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));