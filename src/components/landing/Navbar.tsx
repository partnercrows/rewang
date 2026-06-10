import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Harga", href: "#harga" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl shadow-soft border-b border-[#d4e5e0]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2 font-heading text-xl font-bold text-[#2d6a4f]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7d9b76] to-[#52b788] text-white shadow-soft">
              <Home className="h-5 w-5" />
            </div>
            Rewang
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4a6b5d] transition-colors hover:bg-[#e8f5e9] hover:text-[#2d6a4f]"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-[#b5c99a] px-4 py-2 text-sm font-semibold text-[#4a6b5d] transition-all hover:bg-[#e8f5e9] hover:border-[#7d9b76]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-gradient-to-r from-[#52b788] to-[#40916c] px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Daftar
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-xl p-2 text-[#4a6b5d] hover:bg-[#e8f5e9]"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#d4e5e0] py-4 bg-white/95 backdrop-blur-xl">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-[#4a6b5d] hover:bg-[#e8f5e9]"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-3 mt-3 px-4">
                <Link
                  to="/login"
                  className="flex-1 rounded-xl border border-[#b5c99a] px-4 py-2.5 text-center text-sm font-semibold text-[#4a6b5d] hover:bg-[#e8f5e9]"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#52b788] to-[#40916c] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-soft"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}