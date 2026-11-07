import { useEffect, useState } from "react";
import { Heading, Tree } from "../ui";
import { useReveal } from "../fx";

const REPO = "Setups-Works/setups-works-office";
const RELEASES = `https://github.com/${REPO}/releases/latest`;

type Os = "mac" | "win" | "other";
function detectOs(): Os {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return "other"; // phones can't run it
  if (/Mac/i.test(ua)) return "mac";
  if (/Win/i.test(ua)) return "win";
  return "other";
}

interface Release { version: string; mac_arm: string; mac_x64: string; win: string }

/** Looks up the latest GitHub release. If the repo is private or has no release yet, buttons fall back to the releases page. */
function useLatestRelease(): Release | null {
  const [rel, setRel] = useState<Release | null>(null);
  useEffect(() => {
    let off = false;
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { tag_name: string; assets: { name: string; browser_download_url: string }[] }) => {
        const find = (re: RegExp) => j.assets.find((a) => re.test(a.name))?.browser_download_url ?? RELEASES;
        if (!off) setRel({ version: j.tag_name, mac_arm: find(/mac-arm64\.dmg$/), mac_x64: find(/mac-x64\.dmg$/), win: find(/Setup.*\.exe$/) });
      })
      .catch(() => {});
    return () => { off = true; };
  }, []);
  return rel;
}

function Card({ you, title, sub, children }: { you: boolean; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className={`reveal px-box relative flex flex-col p-5 ${you ? "-translate-y-1 bg-yellow" : ""}`}>
      {you && <span className="absolute -top-3 left-4 border-2 border-ink bg-ink px-2 text-xs font-bold uppercase tracking-wider text-yellow">Your system</span>}
      <h3 className="m-0 text-2xl font-bold">{title}</h3>
      <p className="mb-4 mt-1 text-muted">{sub}</p>
      <div className="mt-auto grid gap-2">{children}</div>
    </div>
  );
}

const Btn = ({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) => (
  <a href={href} className={`px-btn block px-4 py-2 text-center font-bold no-underline ${primary ? "bg-ink text-cream" : "bg-cream"}`}>{children}</a>
);

export function Download() {
  const root = useReveal<HTMLDivElement>();
  const [os, setOs] = useState<Os>("other");
  const rel = useLatestRelease();
  useEffect(() => setOs(detectOs()), []);
  const mac = (k: keyof Release) => rel?.[k] ?? RELEASES;

  return (
    <section id="download" className="lawn relative scroll-mt-14 overflow-hidden border-t-4 border-ink py-16 sm:py-24">
      <Tree s={56} className="hidden md:block" style={{ left: "3%", top: "10%" }} />
      <Tree s={64} className="hidden md:block" style={{ right: "4%", bottom: "8%" }} />
      <div ref={root} className="relative mx-auto max-w-6xl px-4">
        <Heading label="Desktop app" title="A real app for Mac and Windows." sub="Same office, in its own window. It starts the server for you on localhost and updates itself." />
        <div className="grid gap-6 md:grid-cols-3">
          <Card you={os === "mac"} title="macOS" sub="macOS 14 or newer · Apple silicon and Intel · native app">
            <Btn primary href={mac("mac_arm")}>⬇ Apple silicon (.dmg)</Btn>
            <Btn href={mac("mac_x64")}>⬇ Intel (.dmg)</Btn>
          </Card>
          <Card you={os === "win"} title="Windows" sub="Windows 10 or 11 · 64-bit installer">
            <Btn primary href={rel?.win ?? RELEASES}>⬇ Download (.exe)</Btn>
            <span className="text-center text-sm text-muted">Docker Sandboxes need Windows 11</span>
          </Card>
          <Card you={os === "other"} title="Linux & CLI" sub="Any OS with Node.js 20+">
            <code className="font-term block overflow-x-auto whitespace-nowrap border-2 border-ink bg-navy-2 px-3 py-2 text-lg text-green">npx @setupsworks/office@latest</code>
            <Btn href="#start">CLI install steps</Btn>
          </Card>
        </div>

        <div className="reveal px-box-dark mt-6 grid gap-4 p-5 sm:grid-cols-3">
          {[
            ["↻", "Updates itself", "Checks every few hours and installs in the background. Mac and Windows."],
            ["⌂", "Runs locally", "The server binds to 127.0.0.1 on a free port. Nothing leaves your machine."],
            ["▦", "Pick any repo", "File → Open Project… switches teams. It remembers your recent projects."],
          ].map(([i, t, p]) => (
            <div key={t} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-yellow text-lg text-ink">{i}</span>
              <div><b className="text-lg">{t}</b><p className="m-0 text-cream/75">{p}</p></div>
            </div>
          ))}
        </div>
        <p className="reveal mt-4 text-center text-cream ink-text">
          {rel ? <>Latest: <b>{rel.version}</b> · </> : null}
          <a href={RELEASES} className="underline">All downloads and release notes</a>
        </p>
      </div>
    </section>
  );
}
