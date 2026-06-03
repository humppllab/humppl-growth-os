import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopNavbar from "@/components/layout/TopNavbar";
import WorkflowNavigator from "@/components/layout/WorkflowNavigator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Humppl Growth OS",
  description: "Modern SaaS CRM Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex h-screen overflow-hidden antialiased`}>
        <Sidebar />
        <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
            <WorkflowNavigator />
          </main>
        </div>
      </body>
    </html>
  );
}
