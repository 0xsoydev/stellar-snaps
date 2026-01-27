# shadcn/ui + Tailwind CSS Setup

## ✅ Successfully Installed

This project now has **shadcn/ui** and **Tailwind CSS** fully configured and ready to use!

## 📦 Installed Components

The following shadcn/ui components are currently available:

- ✅ Button (`@/components/ui/button`)
- ✅ Card (`@/components/ui/card`)
- ✅ Input (`@/components/ui/input`)
- ✅ Label (`@/components/ui/label`)

## 🎨 Demo Page

Visit the demo page to see all components in action:

```
http://localhost:3000/demo
```

## 📝 Configuration Files

- `tailwind.config.ts` - Tailwind CSS configuration with shadcn theme
- `components.json` - shadcn/ui configuration
- `app/globals.css` - Global styles with Tailwind directives and CSS variables
- `lib/utils.ts` - Utility functions (includes `cn()` helper)
- `tsconfig.json` - TypeScript paths configured for `@/` imports

## 🚀 Adding More Components

To add more shadcn/ui components, run:

```bash
pnpm dlx shadcn@latest add [component-name]
```

Examples:
```bash
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add form
```

Browse all available components at: https://ui.shadcn.com/docs/components

## 💡 Usage Examples

### Using the Button Component

```tsx
import { Button } from "@/components/ui/button";

export default function MyComponent() {
  return (
    <div>
      <Button>Click me</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Delete</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}
```

### Using the Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content</p>
      </CardContent>
    </Card>
  );
}
```

### Using Tailwind CSS

All Tailwind utility classes work throughout the project:

```tsx
<div className="flex items-center gap-4 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
  <h1 className="text-2xl font-bold text-white">Hello Tailwind!</h1>
</div>
```

## 🎯 Key Features

- **Dark mode support** - Uses class-based dark mode (`dark:` prefix)
- **CSS Variables** - Theme customization via CSS variables
- **Type-safe** - Full TypeScript support
- **Accessible** - Built on Radix UI primitives
- **Customizable** - Easy to modify via Tailwind classes
- **Copy & paste** - Components are part of your codebase

## 🛠️ Dependencies Installed

```json
{
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.23",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18"
  }
}
```

## 📚 Documentation

- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives

## ✨ Tips

1. Use the `cn()` utility from `@/lib/utils` to merge Tailwind classes:
   ```tsx
   import { cn } from "@/lib/utils";
   
   <div className={cn("base-class", condition && "conditional-class", className)} />
   ```

2. Dark mode is enabled with the `.dark` class on the root element

3. All components can be customized by modifying the files in `components/ui/`

4. Theme colors can be changed in `app/globals.css` CSS variables

---

**Happy building! 🚀**
