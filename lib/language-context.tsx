"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { translations } from "./translations"

export type Language = "az" | "en" | "ru" | "tr"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translationsData: Record<string, Record<string, string>> = translations

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("az")

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem("vip-transfer-language") as Language
    if (savedLanguage && ["az", "en", "ru", "tr"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("vip-transfer-language", lang)
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translationsData[language]?.[key] ?? translationsData.az?.[key] ?? key
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value))
      })
    }
    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
