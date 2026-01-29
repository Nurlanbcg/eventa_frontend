"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const languages = [
    { code: "az" as const, label: "AZE" },
    { code: "en" as const, label: "ENG" },
    { code: "ru" as const, label: "RUS" },
    { code: "tr" as const, label: "TUR" },
  ]

  const handleLanguageChange = (langCode: "az" | "en" | "ru" | "tr") => {
    setLanguage(langCode)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            className="flex items-center gap-1 overflow-hidden mr-2 bg-background/80 backdrop-blur-md rounded-full p-1 border border-border"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                type="button"
                className={`
                  px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                  ${language === lang.code
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/10 text-foreground"
                  }
                `}
              >
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`
          p-2 rounded-full transition-all duration-300
          ${isOpen
            ? "bg-accent text-accent-foreground rotate-180"
            : "hover:bg-accent/10 text-muted-foreground"
          }
        `}
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
      </button>
    </div>
  )
}
