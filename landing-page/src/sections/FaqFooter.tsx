import { CopyCommand, Heading, Section } from "../ui";

const FAQ = [
  ["Does it merge code for me?", "No. The office follows pull requests on GitHub and reports their status, but merging is always yours."],
  ["Where does the code run?", "Everything runs on your machine. Each agent gets its own Docker Sandbox (a small VM). Where sandboxes aren't supported, set agents to Local in Settings → Team and they run directly, with permission prompts on."],
  ["Which platforms are supported?", "Sandboxes need macOS 14+ on Apple silicon, Windows 11, or Ubuntu 24.04+. Local mode works elsewhere."],
  ["Which agents can I use?", "Claude Code or Codex, chosen per agent for the lead and each worker."],
  ["Can I try it without risk?", "Yes. Use a throwaway repo: git init -b main, add a README, commit, then run the command above."],
];

export function Faq() {
  return (
    <Section id="faq">
      <Heading dark chip="FAQ" title="Good questions." />
      <div className="mx-auto grid max-w-3xl gap-3">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0} className="px-box group p-4">
            <summary className="cursor-pointer list-none text-lg font-bold marker:hidden">
              <span className="mr-2 inline-block transition-transform group-open:rotate-90">▶</span>{q}
            </summary>
            <p className="mb-0 mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta({ onCopied }: { onCopied: () => void }) {
  return (
    <section className="bg-navy py-20 text-center text-cream">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-5">
        <h2 className="m-0 text-4xl font-bold md:text-5xl">Hire your first pixel team.</h2>
        <CopyCommand big onCopied={onCopied} />
        <div className="flex flex-wrap justify-center gap-3 text-ink">
          <a className="px-btn bg-yellow px-5 py-2 font-bold no-underline" href="https://www.npmjs.com/package/@setupsworks/office">View on npm</a>
          <a className="px-btn bg-cream px-5 py-2 font-bold no-underline" href="https://github.com/Setups-Works/setups-works-office">Star on GitHub</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t-4 border-ink bg-navy-2 py-6 text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-5 text-sm">
        <span>Setups Works Office · MIT</span>
        <span>Built by <b>Setups Works</b></span>
      </div>
    </footer>
  );
}
