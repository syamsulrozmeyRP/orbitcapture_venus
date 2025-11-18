# Frontend Guideline Document

This document lays out the frontend setup for ContentOS in clear, everyday language. It covers the architecture, design principles, styling, components, state and data handling, routing, performance tricks, testing, and more. By following these guidelines, any developer (even without a deep technical background) will know exactly how to work on or maintain the frontend.

## 1. Frontend Architecture

### Overview
- **Framework:** Next.js 16 (App Router) for server-side rendering (SSR), static site generation (SSG) and client components.
- **Language:** TypeScript for type safety and easier refactoring.
- **UI Library:** shadcn/ui (a collection of pre-built, accessible React components).
- **Styling:** Tailwind CSS (utility-first) with custom theme tokens in `tailwind.config.js`.
- **Real-Time:** Liveblocks.io for collaborative editing and presence indicators.
- **Editor:** Editor.js supplies the modular, block-based content editing experience, extended with custom tools for SEO metadata, personas, and distribution snippets.
- **Auth & User Data:** Clerk handles signup, login (email/password & SSO), and user profiles.
- **Hosting:** Vercel for automatic builds, deployments, and CDN distribution.
- **Version Control & CI/CD:** GitHub + GitHub Actions.

### How It Scales, Stays Maintainable, and Performs
- **Modular Components:** Small, reusable pieces live in a clear folder structure. Makes it easy to add features and fix bugs.
- **Hybrid Rendering:** Use SSR/SSG for public pages and server components for secure data; client components only when needed (e.g. rich editor).
- **Edge Functions:** Lightweight API routes on Vercel’s Edge for low-latency operations (e.g. AI prompts).
- **CDN & Caching:** Assets and pages served via CDN; Next.js ISR (Incremental Static Regeneration) for fast reloads and up-to-date data.
- **Real-Time Channel:** Liveblocks channels keep collaborative editors snappy without full-page reloads.

## 2. Design Principles

1. **Usability:** Interfaces are intuitive—buttons and links look like buttons/links. Forms provide clear feedback.
2. **Accessibility:** Follow WCAG standards. Use semantic HTML, ARIA roles, and keyboard navigation. All colors meet contrast ratios.
3. **Responsiveness:** Mobile-first approach. Layouts adapt from small phones to large desktops.
4. **Clarity & Consistency:** Reuse design tokens (colors, spacing, typography). Maintain a unified look across pages.
5. **Performance-First UI:** Only load heavy scripts/components when needed. Visual feedback (spinners, skeletons) show progress.

_Application in UI:_
- Buttons and form fields are consistent in padding, font size, and color.
- Headings, cards, and dialogs follow the same margin and typography scale.
- Color and iconography guide users (e.g. green for success, red for errors).

## 3. Styling and Theming

### Styling Approach
- **Tailwind CSS:** Utility-first classes for rapid layout and styling. No separate CSS files for most components.
- **Custom Tokens:** Defined in `tailwind.config.js` under `theme.extend` for colors, font sizes, border radii, etc.
- **No BEM/SMACSS:** Rely on Tailwind’s atomic classes.

### Theming
- **Light & Dark Themes:** CSS variables toggle between themes via a `data-theme` attribute on `<html>`.
- **Toggle Mechanism:** Stored in localStorage; React Context provides current theme to components.

### Visual Style
- **Overall Look:** Modern flat design with subtle glassmorphism on header cards and modals (light blur, semi-transparent backgrounds).

### Color Palette
- **Primary:** #4F46E5 (indigo)
- **Primary Light:** #6366F1
- **Secondary:** #10B981 (emerald)
- **Warning:** #F59E0B (amber)
- **Danger:** #EF4444 (red)
- **Neutral 100:** #F9FAFB (light bg)
- **Neutral 800:** #1F2937 (dark bg)
- **Surface:** #FFFFFF (cards)
- **Text Primary (light):** #111827
- **Text Primary (dark):** #F3F4F6

### Typography
- **Font Family:** ‘Inter’, sans-serif. Clean, highly readable.
- **Scale:** 14px (base), 16px (body), 20px (h4), 24px (h3), 32px (h2), 40px (h1).

## 4. Component Structure

### Folder Layout (Example)
```
/app
  /components     # Small UI pieces (buttons, inputs, cards)
  /features       # Feature-specific logic & components
  /layouts        # Page layout components (navbars, footers)
  /hooks          # Custom React hooks
  /context        # React Context providers (theme, workspace)
  /lib            # Utility functions, API clients
  /styles         # Global styles & tailwind config
```

### Reuse & Maintainability
- **Atomic Design:** Components split into atoms (Button, Input), molecules (FormGroup, Modal), and organisms (ContentCalendar, EditorPanel).
- **Props-Driven:** Components get all data via props. No hidden global state.
- **Single Responsibility:** Each component does one thing well, making it easy to test and update.

## 5. State Management

### Local vs Global
- **Server Components:** Fetch data (workspaces, calendar events) on the server—no client bundle needed.
- **React Context:** For theme, workspace selection, user info from Clerk.
- **Liveblocks State:** Real-time presence and collaborative editor state.
- **Data Fetching & Cache:** useSWR (or React Query) for fetching, caching, and re-validation of API data.

### Sharing State
- Wrap the app in a root provider (`<ThemeProvider>`, `<LiveblocksProvider>`).
- Use context hooks (`useTheme()`, `useWorkspace()`) in components to read/update shared state.

## 6. Routing and Navigation

- **File-Based Routing:** Next.js app router (e.g. `/app/workspaces/[id]/calendar/page.tsx`).
- **Nested Layouts:** Common UI (sidebar, header) stays in `layout.tsx` while page content changes.
- **Dynamic Routes:** For workspaces, content items, editor sessions, etc.
- **Route Protection:** Middleware checks Clerk session. Unauthenticated users are redirected to login.

## 7. Performance Optimization

1. **Code Splitting:** Next.js automatically splits by route. Use `next/dynamic` for heavy components like the Editor.js workspace.
2. **Lazy Loading:** Images with `next/image` and dynamic imports for non-critical code.
3. **Tailwind Purge:** Remove unused CSS in production builds.
4. **Caching:** SWR stale-while-revalidate for data. ISR for public pages.
5. **Minification & Compression:** Handled by Vercel’s build pipeline.
6. **Optimized Fonts:** Host ‘Inter’ via Google Fonts or self-host and preload.

These steps keep the UI snappy and the bundle size small.

## 8. Testing and Quality Assurance

### Unit & Integration Tests
- **Tools:** Jest + React Testing Library.
- **Scope:** Test individual components, utility functions, and hooks.
- **Practice:** One test file per component, placed beside code (`Component.test.tsx`).

### End-to-End (E2E) Tests
- **Tool:** Cypress (or Playwright as an alternative).
- **Scenarios:** User signup/login, workspace creation, calendar actions, AI editor workflow, approval process.

### Linting & Formatting
- **ESLint:** Enforce code style and catch errors.
- **Prettier:** Consistent formatting.
- **Husky + lint-staged:** Run linters on pre-commit for clean commits.

## 9. Conclusion and Overall Frontend Summary

This guideline ensures the ContentOS frontend is:
- **Scalable:** Modular architecture and server/client separation.
- **Maintainable:** Clear folder structure, consistent styling, and reusable components.
- **Performant:** Lazy loading, code splitting, real-time lanes via Liveblocks, and Vercel optimizations.
- **User-Friendly:** Focus on usability, accessibility, and responsive design.
- **Robust & Secure:** Clerk for auth, Next.js middleware, and GDPR/CCPA compliance downstream.

By following these practices, any developer can jump in, build new features quickly, and keep the platform solid, fast, and easy to use.