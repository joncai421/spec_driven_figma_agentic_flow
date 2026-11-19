// Minimal Vitest config (spec gap: spec-driven.md defines `npm run test` as
// `vitest run` with Vitest + Testing Library + jsdom but ships no config).
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // No feature tests exist yet; the Stop hook also uses --passWithNoTests.
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})