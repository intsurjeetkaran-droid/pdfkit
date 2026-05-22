/**
 * Landing Page — /
 *
 * Each section lives in its own file under ./sections/
 * This file is just the wrapper that composes them in order.
 *
 * Sections:
 *   NavSection            — sticky nav with section anchor links
 *   HeroSection           — dark hero with headline, CTAs, tool pills
 *   StatsSection          — 4 key stats (tools, file size, TTL, no account)
 *   WhySection            — 6 feature cards explaining what makes PDFKit different
 *   CompareSection        — dark comparison table vs competitors
 *   HowItWorksSection     — 3-step process with icons
 *   ToolsHighlightSection — 6 popular tool cards
 *   TrustSection          — 4 privacy/trust cards
 *   CtaSection            — final blue CTA banner
 *   FooterSection         — 4-column footer with hover underline links
 */

import NavSection            from './sections/NavSection';
import HeroSection           from './sections/HeroSection';
import StatsSection          from './sections/StatsSection';
import WhySection            from './sections/WhySection';
import CompareSection        from './sections/CompareSection';
import HowItWorksSection     from './sections/HowItWorksSection';
import ToolsHighlightSection from './sections/ToolsHighlightSection';
import TrustSection          from './sections/TrustSection';
import CtaSection            from './sections/CtaSection';
import FooterSection         from './sections/FooterSection';

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white text-slate-900 antialiased overflow-x-hidden">
      <NavSection />
      <HeroSection />
      <StatsSection />
      <WhySection />
      <CompareSection />
      <HowItWorksSection />
      <ToolsHighlightSection />
      <TrustSection />
      <CtaSection />
      <FooterSection />
    </div>
  );
}
