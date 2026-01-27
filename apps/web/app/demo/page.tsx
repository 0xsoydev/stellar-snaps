import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            shadcn/ui + Tailwind CSS Demo
          </h1>
          <p className="text-slate-400">
            Successfully integrated into Stellar Snaps
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Button Variants */}
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>Different button styles available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">Default Button</Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
              <Button variant="outline" className="w-full">
                Outline Button
              </Button>
              <Button variant="ghost" className="w-full">
                Ghost Button
              </Button>
              <Button variant="destructive" className="w-full">
                Destructive Button
              </Button>
            </CardContent>
          </Card>

          {/* Form Example */}
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
              <CardDescription>Input fields with labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <Button className="w-full">Submit</Button>
            </CardContent>
          </Card>

          {/* Button Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Button Sizes</CardTitle>
              <CardDescription>Different size options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 flex flex-col items-start">
              <Button size="sm">Small Button</Button>
              <Button size="default">Default Button</Button>
              <Button size="lg">Large Button</Button>
              <Button size="icon">
                <span>🚀</span>
              </Button>
            </CardContent>
          </Card>

          {/* Tailwind Utilities */}
          <Card>
            <CardHeader>
              <CardTitle>Tailwind CSS</CardTitle>
              <CardDescription>Custom styling with Tailwind</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold">
                Gradient Background
              </div>
              <div className="p-4 border-2 border-dashed border-purple-500 rounded-lg text-center">
                Dashed Border
              </div>
              <div className="p-4 bg-slate-800 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300">
                Hover Effect
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-2xl">🎉 Setup Complete!</CardTitle>
            <CardDescription>
              You can now use shadcn/ui components and Tailwind CSS in your project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To add more components, run:
            </p>
            <code className="block bg-slate-900 p-3 rounded text-sm text-slate-300">
              pnpm dlx shadcn@latest add [component-name]
            </code>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="outline">
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
