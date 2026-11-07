import { useState } from "react";
import { Heading, Section, copyText } from "../ui";

const CMDS = {
  npx: ["# run once, no install", "npx @setupsworks/office@latest"],
  npm: ["# install globally", "npm install -g @setupsworks/office", "setups-works-office"],
  pnpm: ["# install globally", "pnpm add -g @setupsworks/office", "setups-works-office"],
} as const;
const REQ = [
  ["Node.js 20+", "runs the office"], ["git + a GitHub repo", "agents clone it and open PRs"], ["GitHub CLI (gh)", "reads PRs and reviews"],
  ["Docker Sandboxes (sbx)", "one VM per agent"], ["tmux (macOS, Linux)", "agents survive closing the office"], ["A Claude or ChatGPT account", "for the agents themselves"],
];

export function GetStarted({ onCopied }: { onCopied: () => void }) {
  const [tab, setTab] = useState<keyof typeof CMDS>("npx");
  const [have, setHave] = useState<boolean[]>(REQ.map(() => false));
  const n = have.filter(Boolean).length;
  const lines = CMDS[tab];
  const cmds = lines.filter((l) => !l.startsWith("#"));
  return (
    <Section id="start" alt>
      <Heading chip="Get started" title="Running in about two minutes." sub="From inside a git repo that has a GitHub remote." />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="px-box-dark p-4">
          <div className="mb-3 flex gap-2">
            {(Object.keys(CMDS) as (keyof typeof CMDS)[]).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={`border-2 border-ink px-3 py-0.5 font-bold ${tab === k ? "bg-yellow text-ink" : "bg-navy-2 text-cream"}`}>{k}</button>
            ))}
          </div>
          <pre className="font-term m-0 min-h-28 whitespace-pre-wrap text-xl leading-snug">
            {lines.map((l) => (l.startsWith("#") ? <div key={l} className="text-lav">{l}</div> : <div key={l}><span className="text-green">$ </span>{l}</div>))}
          </pre>
          <button className="px-btn mt-3 bg-yellow px-4 py-1 font-bold text-ink" onClick={async () => { await copyText(cmds.join("\n")); onCopied(); }}>Copy command</button>
        </div>
        <div className="px-box p-5">
          <h4 className="m-0 mb-3 text-xl font-bold">What you need</h4>
          <ul className="m-0 grid list-none gap-2 p-0">
            {REQ.map(([t, d], k) => (
              <li key={t}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-1.5 h-4 w-4 accent-green" checked={have[k]} onChange={() => setHave((h) => h.map((v, j) => (j === k ? !v : v)))} />
                  <span><b>{t}</b> <span className="text-muted">· {d}</span></span>
                </label>
              </li>
            ))}
          </ul>
          <div className={`mt-4 border-4 border-ink px-3 py-2 font-bold ${n === REQ.length ? "bg-green" : "bg-cream-2"}`}>
            {n === REQ.length ? "You're ready. Run the command!" : `${n} of ${REQ.length} ticked. The office checks the rest and shows the fix.`}
          </div>
        </div>
      </div>
    </Section>
  );
}
