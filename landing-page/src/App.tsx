import { Nav } from "./sections/Nav";
import { Hero } from "./sections/Hero";
import { Story } from "./sections/Story";
import { Playground } from "./sections/Playground";
import { Why } from "./sections/Why";
import { GetStarted } from "./sections/Start";
import { Faq, Footer } from "./sections/FaqFooter";
import { useToast } from "./ui";

export function App() {
  const toast = useToast();
  const copied = () => toast.show("Copied to clipboard!");
  return (
    <>
      <Nav />
      <main>
        <Hero onCopied={copied} />
        <Story />
        <Playground />
        <Why />
        <GetStarted onCopied={copied} />
        <Faq />
      </main>
      <Footer onCopied={copied} />
      {toast.node}
    </>
  );
}
