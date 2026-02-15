import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="flex items-center gap-4 mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
      </div>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
