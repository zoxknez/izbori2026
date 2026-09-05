export const NAV_CTA = { href: "/vidim-problem", label: "Vidim problem sada" } as const;

export const NAV_LINKS = [
  { href: "/pravila", label: "Baza nepravilnosti" },
  { href: "/kontrolor", label: "Kontrolor" },
  { href: "/validator", label: "Validator zapisnika" },
  { href: "/trening/kviz", label: "Trening / Kviz" },
  { href: "/simulator/biracki-dan", label: "Simulator biračkog dana" },
  { href: "/van-birackog-mesta", label: "Glasanje van BM" },
  { href: "/krivicna-dela", label: "Krivična dela" },
  { href: "/mit-ili-cinjenica", label: "Mit ili činjenica" },
  { href: "/prijavi", label: "Prijavi incident" },
  { href: "/rokovi", label: "Rokovi" },
  { href: "/izvori", label: "Izvori" },
] as const;

export const MOBILE_TAB_LINKS = [
  { href: "/", label: "Početna", icon: "home" },
  { href: "/vidim-problem", label: "Problem", icon: "alert" },
  { href: "/pravila", label: "Pravila", icon: "book" },
  { href: "/validator", label: "Validator", icon: "calculator" },
  { href: "/kontrolor", label: "Kontrolor", icon: "check" },
] as const;
