import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AffeXAI | System Disclosure Interface",
    description: "Formal disclosure of high-density neural infrastructure designed for institutional autonomy.",
};

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div lang="en" className="theme-marketing min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f9bc06] selection:text-black font-sans">
            {children}
        </div>
    );
}
