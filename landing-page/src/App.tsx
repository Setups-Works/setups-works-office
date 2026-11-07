import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { LiveDemo } from "./sections/LiveDemo";
import { HowItWorks, Why } from "./sections/HowWhy";
import { GetStarted } from "./sections/Start";
import { Faq, FinalCta, Footer, Stats } from "./sections/FaqFooter";
import { PageChrome } from "./fx";
import { useToast } from "./ui";

export function App() {
  const toast = useToast();
  const copied = () => toast.show("Copied to clipboard!");
  return (
    <>
      <PageChrome />
      <Nav />
      <main>
        <Hero onCopied={copied} />
        <Stats />
        <LiveDemo />
        <HowItWorks />
        <Why />
        <GetStarted onCopied={copied} />
        <Faq />
        <FinalCta onCopied={copied} />
      </main>
      <Footer />
      {toast.node}
    </>
  );
}
