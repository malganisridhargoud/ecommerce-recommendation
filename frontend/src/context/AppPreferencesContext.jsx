import React, { createContext, useContext, useMemo, useState } from "react";

const AppPreferencesContext = createContext(null);

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
];

const TRANSLATIONS = {
  en: { searchPlaceholder: "Search equipment, specs, city...", featured: "Featured Products", popular: "Popular Products", newest: "New Products", becomeSeller: "Become a Seller", wishlist: "Wishlist", chat: "Chat", location: "Location" },
  bn: { searchPlaceholder: "ইকুইপমেন্ট, স্পেসিফিকেশন, শহর খুঁজুন...", featured: "ফিচার্ড পণ্য", popular: "জনপ্রিয় পণ্য", newest: "নতুন পণ্য", becomeSeller: "বিক্রেতা হন", wishlist: "উইশলিস্ট", chat: "চ্যাট", location: "অবস্থান" },
  hi: { searchPlaceholder: "उपकरण, स्पेसिफिकेशन, शहर खोजें...", featured: "फीचर्ड प्रोडक्ट्स", popular: "लोकप्रिय प्रोडक्ट्स", newest: "नए प्रोडक्ट्स", becomeSeller: "सेलर बनें", wishlist: "विशलिस्ट", chat: "चैट", location: "लोकेशन" },
  ta: { searchPlaceholder: "உபகரணம், விவரம், நகரம் தேடுங்கள்...", featured: "சிறப்பு பொருட்கள்", popular: "பிரபல பொருட்கள்", newest: "புதிய பொருட்கள்", becomeSeller: "விற்பனையாளர் ஆகுங்கள்", wishlist: "விஷ்லிஸ்ட்", chat: "அரட்டை", location: "இருப்பிடம்" },
};

export function AppPreferencesProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem("app_language") || "en");
  const [location, setLocation] = useState(localStorage.getItem("app_location") || "");
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const setLanguagePersisted = (value) => {
    setLanguage(value);
    localStorage.setItem("app_language", value);
  };
  const setLocationPersisted = (value) => {
    setLocation(value);
    localStorage.setItem("app_location", value);
  };

  const t = useMemo(() => TRANSLATIONS[language] || TRANSLATIONS.en, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguagePersisted,
      location,
      setLocation: setLocationPersisted,
      cartCount,
      setCartCount,
      unreadMessages,
      setUnreadMessages,
      languageOptions: LANGUAGE_OPTIONS,
      t,
    }),
    [language, location, cartCount, unreadMessages, t]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  return ctx;
}

