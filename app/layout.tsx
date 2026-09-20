import "./globals.css";
import type {Metadata} from "next";
export const metadata:Metadata={title:"Avainpelaaja OS",description:"StandSales OS"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fi"><body>{children}</body></html>}