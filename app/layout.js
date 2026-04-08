import { Bricolage_Grotesque, Monoton, Over_the_Rainbow } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-brico",
});

const monoton = Monoton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
});

const rainbow = Over_the_Rainbow({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rainbow",
});

export const metadata = {
  title: "Creative Coding Recurse",
  description: "A speckled creative coding landing page with a playful preloader.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${monoton.variable} ${rainbow.variable}`}>
        {children}
      </body>
    </html>
  );
}
