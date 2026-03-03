import { MarketingBackground } from "@/components/marketing/MarketingBackground";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070B16] text-white relative overflow-hidden">
      <MarketingBackground />
      <div className="relative z-10">
        <MarketingNav />
        {children}
        <MarketingFooter />
      </div>
    </div>
  );
}
