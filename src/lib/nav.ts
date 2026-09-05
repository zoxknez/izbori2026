export const NAV_LINKS = [
  { href: "/vidim-problem", label: "Vidim problem", emphasis: true },
  { href: "/pravila", label: "Baza nepravilnosti", emphasis: false },
  { href: "/kontrolor", label: "Kontrolor", emphasis: false },
  { href: "/validator", label: "Validator zapisnika", emphasis: false },
  { href: "/van-birackog-mesta", label: "Glasanje van BM", emphasis: false },
  { href: "/krivicna-dela", label: "Krivična dela", emphasis: false },
  { href: "/mit-ili-cinjenica", label: "Mit ili činjenica", emphasis: false },
  { href: "/prijavi", label: "Prijavi incident", emphasis: false },
  { href: "/rokovi", label: "Rokovi", emphasis: false },
  { href: "/izvori", label: "Izvori", emphasis: false },
] as const;

export const MOBILE_TAB_LINKS = [
  { href: "/", label: "Početna", icon: "home" },
  { href: "/vidim-problem", label: "Problem", icon: "alert" },
  { href: "/pravila", label: "Pravila", icon: "book" },
  { href: "/validator", label: "Validator", icon: "calculator" },
  { href: "/kontrolor", label: "Kontrolor", icon: "check" },
] as const;
