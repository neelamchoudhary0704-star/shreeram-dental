# Background Paths shadcn Integration Notes

This workspace currently contains a standalone HTML file, not a React, TypeScript, Tailwind CSS, or shadcn project. The requested component files have been placed in the standard shadcn paths:

- `components/ui/background-paths.tsx`
- `components/ui/button.tsx`
- `lib/utils.ts`
- `demo.tsx`

The default shadcn component path is `components/ui`. Keeping UI primitives there matters because shadcn imports, generated components, and aliases such as `@/components/ui/button` expect that convention.

To run this component in a new shadcn project, scaffold a React app with TypeScript and Tailwind, then initialize shadcn:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
```

Then install the component dependencies:

```bash
npm install framer-motion @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

Make sure your TypeScript path alias maps `@/*` to the project source root, or adjust the imports in the component files to use relative paths.

Use the component like this:

```tsx
import { BackgroundPaths } from "@/components/ui/background-paths";

export default function Page() {
  return <BackgroundPaths title="Shree Ram Dental" />;
}
```
