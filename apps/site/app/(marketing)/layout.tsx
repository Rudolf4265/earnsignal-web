import { MarketingBackground } from "@/components/marketing/MarketingBackground";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#050B18] text-white">
      <MarketingBackground />
      <div className="relative">
        <MarketingNav />
        {children}
        <MarketingFooter />
      </div>
    </div>
  );
}
