// Route group layout — applies Header + Footer to all pages inside (main)/
// The body in root layout is flex flex-col min-h-dvh.
// This layout fills that flex column so footer is always pushed to the bottom.
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/*
        flex-1        — takes all remaining vertical space in the body flex column
        min-h-[calc(100dvh-3.5rem-1px)]
                      — 3.5rem = h-14 header, 1px = header border
                        ensures the content area is at least one full viewport
                        tall so the footer is always below the fold on tool pages
      */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-10 min-h-[calc(100dvh-3.5rem-1px)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
