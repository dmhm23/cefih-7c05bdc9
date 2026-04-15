

# Fix: Lists not rendering in paragraph block preview

## Root Cause

The `@tailwindcss/typography` package is installed in `package.json` but **not registered** in `tailwind.config.ts` plugins array. The `prose` CSS classes used in both `BlockPreview.tsx` and `RichTextEditor.tsx` are therefore ignored — lists render as unstyled `<ul>`/`<ol>` elements with no bullets, numbers, or indentation.

## Change

**1 file — `tailwind.config.ts`**

Add `@tailwindcss/typography` to the plugins array:

```ts
plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
```

That's it. No other files need changes — the `prose prose-sm max-w-none` classes are already correctly applied in both `BlockPreview.tsx` (line 113) and `RichTextEditor.tsx` (line 37). Once the plugin is active, lists, bold, italic, and other HTML elements will render properly everywhere.

