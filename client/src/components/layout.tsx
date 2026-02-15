import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Scale, Gavel, ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isBench = location.startsWith("/bench");

  const navItems = [
    { href: "/", label: "Resolve", icon: ShieldCheck, active: !isBench },
    { href: "/bench", label: "Bench", icon: Gavel, active: isBench },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg group-hover:bg-primary/90 transition-colors">
              <Scale className="w-5 h-5" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight text-primary">
              CLAUSE
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  item.active 
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b bg-white overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3",
                      item.active 
                        ? "bg-primary/5 text-primary" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 CLAUSE Legal Tech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
