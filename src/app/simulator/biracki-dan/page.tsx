import { permanentRedirect } from "next/navigation";

/** Zadržano za postojeće sačuvane linkove; kanonska stranica je /izborni-dan. */
export default function LegacySimulatorPage() {
  permanentRedirect("/izborni-dan");
}
