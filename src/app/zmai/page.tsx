import type { Metadata } from "next";
import { ZmaiEmbed } from "@/components/zmai/zmai-embed";

export const metadata: Metadata = {
  title: "ZmAI - CRTA izborni asistent",
  description:
    "Pitaj ZmAI, zvaničnog AI asistenta organizacije CRTA za pitanja o izbornom procesu, procedurama i zakonitosti na biračkom mestu.",
  alternates: { canonical: "/zmai" },
  openGraph: {
    title: "ZmAI - CRTA izborni asistent",
    description:
      "AI asistent za brze odgovore o izbornim pravilima, pravima birača i dužnostima biračkog odbora.",
    type: "website",
    url: "https://izborilegalnost.vercel.app/zmai",
  },
};

export default function ZmaiPage() {
  return <ZmaiEmbed />;
}
