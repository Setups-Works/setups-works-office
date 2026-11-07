import { agentPalette, colors } from "../../../src/theme/tokens";
import { Bot, CopyCommand } from "../ui";

function MiniOffice() {
  const desks = [
    { name: "MICHAEL", color: agentPalette[0], rug: "#8a2f3c", lead: true },
    { name: "DWIGHT", color: agentPalette[1], rug: "#35568f" },
    { name: "JIM", color: agentPalette[2], rug: "#a8812b" },
  ];
  return (
    <div className="px-box-dark overflow-hidden" aria-label="Animated pixel office preview" role="img">
      <div className="flex items-center gap-2 border-b-4 border-ink bg-cream px-3 py-2 text-ink">
        <span className="h-3 w-3 bg-red" />
        <span className="h-3 w-3 bg-yellow" />
        <span className="h-3 w-3 bg-green" />
        <b className="ml-2 text-sm">Setups Works Office</b>
        <span className="ml-auto border-2 border-ink bg-yellow px-2 text-xs font-bold">Demo data</span>
      </div>
      <div className="relative p-4" style={{ background: "#c98f4f", backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 36px)" }}>
        {/* wall: board + sign */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex flex-1 gap-1 border-4 border-ink bg-cream p-2">
            {["TODO", "DOING", "REVIEW", "DONE"].map((c, i) => (
              <div key={c} className="flex-1">
                <div className="text-[10px] font-bold">{c}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Array.from({ length: i < 2 ? 2 : 0 }).map((_, k) => (
                    <i key={k} className="block h-2 w-3" style={{ background: [colors.yellow, colors.blue][k % 2] }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-4 border-ink bg-[#a8642c] px-3 py-2 text-center text-sm font-bold text-cream">SETUPS WORKS</div>
        </div>
        {/* desks */}
        <div className="grid grid-cols-3 gap-3">
          {desks.map((d, i) => (
            <div key={d.name} className="relative flex flex-col items-center border-4 border-ink pb-2 pt-3" style={{ background: d.rug }}>
              <div className="mb-2 flex h-9 w-14 items-center border-4 border-ink bg-navy-2 px-1">
                <span className="type-bar block h-1 w-full bg-green" style={{ animationDelay: `${i * 0.25}s` }} />
              </div>
              <Bot color={d.color} bob size={1.1} />
              <em className="mt-1 border-2 border-ink bg-cream px-1 text-[10px] font-bold not-italic">{d.name}</em>
              {d.lead && <span className="absolute -top-2 right-1 text-xs">♛</span>}
            </div>
          ))}
        </div>
        {/* belt to review gate */}
        <div className="relative mt-4 flex items-center gap-2">
          <div className="belt relative h-5 flex-1 overflow-hidden border-2 border-ink">
            {[0, 1, 2].map((i) => (
              <span key={i} className="absolute top-0.5 h-3 w-5 border-2 border-ink bg-cream text-[8px] font-bold leading-none" style={{ animation: `slide 4s linear ${i * 1.3}s infinite` }}>
                PR
              </span>
            ))}
          </div>
          <div className="border-4 border-ink bg-[#4a4a58] px-2 py-1 text-[10px] font-bold text-cream">CODERABBIT</div>
        </div>
      </div>
    </div>
  );
}

export function Hero({ onCopied }: { onCopied: () => void }) {
  return (
    <section className="grass-bg pb-20 pt-14" id="top">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
        <div>
          <span className="px-btn inline-block bg-yellow px-3 py-1 text-sm font-bold">v0.7 · runs on your machine</span>
          <h1 className="mt-5 text-5xl font-bold leading-[1.05] text-cream drop-shadow-[3px_3px_0_#241a2e] md:text-6xl">
            Your AI coding team, <span className="text-yellow">in a pixel office.</span>
          </h1>
          <p className="mt-5 max-w-xl text-xl text-cream">
            One <b>lead</b> agent plans the work. Each <b>worker</b> gets its own desk, its own copy of your repo and its own Docker Sandbox, then opens a pull request. You watch it all happen.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#start" className="px-btn bg-yellow px-5 py-2.5 text-lg font-bold no-underline">Get started</a>
            <a href="#demo" className="px-btn bg-cream px-5 py-2.5 text-lg font-bold no-underline">Try the live demo</a>
          </div>
          <div className="mt-6">
            <CopyCommand onCopied={onCopied} />
          </div>
          <div className="mt-5 flex items-center gap-2 text-cream">
            <span>Works with</span>
            <b className="border-2 border-ink bg-blue px-2 text-ink">Claude Code</b>
            <b className="border-2 border-ink bg-green px-2 text-ink">Codex</b>
          </div>
        </div>
        <MiniOffice />
      </div>
    </section>
  );
}
