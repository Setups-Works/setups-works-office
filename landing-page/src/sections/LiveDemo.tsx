import { useEffect, useReducer, useRef, useState } from "react";
import { burst, gsap, reduced } from "../fx";
import { Section, Heading, Bot } from "../ui";
import { agentPalette, stateStyle } from "../../../src/theme/tokens";
import type { AgentState } from "../../../src/data/types";

type Col = "todo" | "doing" | "review" | "done";
interface Task { id: string; title: string; col: Col; progress: number; owner?: string; pr?: number; reviewT: number }
interface Agent { name: string; role: string; color: string; state: AgentState; note: string }
interface Feed { id: number; icon: string; text: string }
interface S {
  running: boolean; goal: string; tasks: Task[]; agents: Agent[]; feed: Feed[];
  asking: boolean; answered: boolean; nextPr: number; seq: number;
}

const AGENTS: Agent[] = [
  { name: "Michael", role: "Lead", color: agentPalette[0], state: "idle", note: "Waiting for a goal" },
  { name: "Dwight", role: "Developer", color: agentPalette[1], state: "idle", note: "At my desk" },
  { name: "Jim", role: "Developer", color: agentPalette[2], state: "idle", note: "At my desk" },
];
const init = (goal: string): S => ({ running: false, goal, tasks: [], agents: AGENTS, feed: [], asking: false, answered: false, nextPr: 5, seq: 0 });

type A = { t: "start" } | { t: "tick" } | { t: "goal"; v: string } | { t: "answer" } | { t: "reset" };

function log(s: S, icon: string, text: string): S {
  return { ...s, seq: s.seq + 1, feed: [{ id: s.seq, icon, text }, ...s.feed].slice(0, 8) };
}
const setAgent = (s: S, name: string, state: AgentState, note: string): S => ({
  ...s, agents: s.agents.map((a) => (a.name === name ? { ...a, state, note } : a)),
});

function reduce(s: S, a: A): S {
  switch (a.t) {
    case "goal": return { ...s, goal: a.v };
    case "reset": return init(s.goal);
    case "start": {
      if (s.running || s.tasks.length) return s;
      const g = s.goal.trim() || "Add a /chat route";
      const mk = (id: string, title: string): Task => ({ id, title, col: "todo", progress: 0, reviewT: 0 });
      let n: S = { ...s, running: true, tasks: [mk("T01", g), mk("T02", "Message store + migrations"), mk("T03", "Search endpoint")] };
      n = setAgent(n, "Michael", "working", "Writing the task plan");
      return log(n, "▶", `Michael planned 3 tasks for “${g.slice(0, 32)}”`);
    }
    case "answer": {
      let n: S = { ...s, asking: false, answered: true };
      n = setAgent(n, "Jim", "working", "Building on your answer");
      return log(n, "✓", "You answered Jim. He's back to work");
    }
    case "tick": {
      if (!s.running || s.asking) return s;
      let n = { ...s, tasks: s.tasks.map((t) => ({ ...t })) };
      // progress doing → review
      for (const t of n.tasks.filter((x) => x.col === "doing")) {
        if (t.owner === "Jim" && !n.answered && t.progress >= 45) {
          n = setAgent(n, "Jim", "needs-input", "Asking: pgvector or hosted DB?");
          return log({ ...n, asking: true }, "!", "Jim needs you: pgvector or hosted DB?");
        }
        t.progress = Math.min(100, t.progress + 15);
        if (t.progress >= 100) {
          t.col = "review"; t.pr = n.nextPr; n.nextPr += 1;
          n = setAgent(n, t.owner!, "in-review", `PR #${t.pr} in review`);
          n = log(n, "⎇", `${t.owner} opened PR #${t.pr}: ${t.title.slice(0, 24)}`);
        }
      }
      // review → done
      for (const t of n.tasks.filter((x) => x.col === "review")) {
        t.reviewT += 1;
        if (t.reviewT >= 3) {
          t.col = "done";
          n = setAgent(n, t.owner!, "review-passed", `PR #${t.pr} passed. Ready to merge`);
          n = log(n, "✓", `PR #${t.pr} passed review. Waiting on you to merge`);
        }
      }
      // assign idle / finished workers
      for (const w of ["Dwight", "Jim"]) {
        const ag = n.agents.find((x) => x.name === w)!;
        const busy = n.tasks.some((t) => t.owner === w && (t.col === "doing" || t.col === "review"));
        const next = n.tasks.find((t) => t.col === "todo");
        if (!busy && next && (ag.state === "idle" || ag.state === "review-passed")) {
          next.col = "doing"; next.owner = w;
          n = setAgent(n, w, "working", `${next.id} ${next.title}`);
          n = log(n, "▶", `Michael assigned ${next.id} to ${w}`);
        }
      }
      const done = n.tasks.every((t) => t.col === "done");
      if (done) {
        n = setAgent(n, "Michael", "review-passed", "All tasks shipped");
        n = log({ ...n, running: false }, "★", "All tasks ready. You merge, the team never does");
      } else if (n.agents[0]!.state === "working") {
        n = setAgent(n, "Michael", "working", "Watching the board");
      }
      return n;
    }
  }
}

const COLS: { id: Col; label: string }[] = [
  { id: "todo", label: "TODO" }, { id: "doing", label: "DOING" }, { id: "review", label: "REVIEW" }, { id: "done", label: "DONE" },
];

export function LiveDemo() {
  const [s, d] = useReducer(reduce, "Add a /chat route with message history", init);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!s.running) return;
    const id = window.setInterval(() => d({ t: "tick" }), 900 / speed);
    return () => window.clearInterval(id);
  }, [s.running, speed]);

  const shipped = s.tasks.filter((t) => t.col === "done").length;
  const pct = s.tasks.length ? Math.round((shipped / s.tasks.length) * 100) : 0;
  const box = useRef<HTMLDivElement>(null);
  const need = s.agents.filter((a) => a.state === "needs-input").length;

  useEffect(() => {
    if (pct === 100 && box.current) {
      const r = box.current.getBoundingClientRect();
      burst(r.left + r.width / 2, Math.min(Math.max(r.top + 120, 120), window.innerHeight - 120), 48);
    }
  }, [pct]);
  useEffect(() => {
    if (!s.asking || reduced() || !box.current) return;
    gsap.fromTo(box.current, { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1.2, 0.2)" });
  }, [s.asking]);

  return (
    <Section id="demo">
      <Heading dark chip="Interactive" title="Run the team. Right here." sub="Press Start team and watch tasks flow from the board to review. When an agent needs you, answer it, just like the real thing." />
      <div ref={box} className="reveal px-box relative overflow-hidden text-ink">
        <div className="flex flex-wrap items-center gap-2 border-b-4 border-ink bg-cream-2 px-4 py-3">
          <b className="text-lg">Setups Works Office</b>
          <span className="border-2 border-ink bg-yellow px-2 text-xs font-bold">Demo data</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {[1, 2, 4].map((x) => (
              <button key={x} onClick={() => setSpeed(x)} className={`px-btn px-2.5 py-0.5 text-sm font-bold ${speed === x ? "bg-yellow" : "bg-cream"}`}>{x}x</button>
            ))}
            <button onClick={() => d({ t: "start" })} disabled={s.running || s.tasks.length > 0} className="px-btn bg-green px-3 py-0.5 font-bold disabled:opacity-50">▶ Start team</button>
            <button onClick={() => d({ t: "reset" })} className="px-btn bg-cream px-3 py-0.5 font-bold">Reset</button>
          </div>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-[280px_1fr_300px]">
          {/* team */}
          <div>
            <div className="mb-2 text-sm font-bold tracking-widest">TEAM · 3 {need > 0 && <span className="blink ml-2 text-red">{need} NEED YOU</span>}</div>
            <div className="grid gap-3">
              {s.agents.map((a) => {
                const st = stateStyle[a.state];
                return (
                  <div key={a.name} className={`border-4 bg-cream p-2.5 ${a.state === "needs-input" ? "border-red" : "border-ink"}`}>
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 place-items-center border-2 border-ink bg-navy"><Bot color={a.color} bob={a.state === "working"} size={1} /></div>
                      <div className="min-w-0 flex-1">
                        <b>{a.name}</b> <span className="text-xs text-muted">{a.role} · {a.name === "Jim" ? "Codex" : "Claude Code"}</span>
                        <div><span className="inline-block border-2 border-ink px-1.5 text-xs font-bold text-ink" style={{ background: st.color }}>{st.label}</span></div>
                      </div>
                    </div>
                    <div className={`mt-1.5 truncate text-sm ${a.state === "needs-input" ? "font-bold text-red" : "text-muted"}`}>{a.note}</div>
                  </div>
                );
              })}
            </div>
            <form className="mt-4" onSubmit={(e) => { e.preventDefault(); d({ t: "start" }); }}>
              <label htmlFor="goal" className="text-sm font-bold">Tell the lead what to build</label>
              <div className="mt-1 flex gap-2">
                <input id="goal" value={s.goal} maxLength={60} disabled={s.tasks.length > 0} onChange={(e) => d({ t: "goal", v: e.target.value })} className="min-w-0 flex-1 border-4 border-ink bg-white px-2 py-1 disabled:opacity-60" />
                <button type="submit" disabled={s.tasks.length > 0} className="px-btn bg-blue px-3 font-bold disabled:opacity-50">Send</button>
              </div>
            </form>
          </div>

          {/* board */}
          <div>
            <div className="mb-2 text-sm font-bold tracking-widest">TASK BOARD</div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {COLS.map((c) => (
                <div key={c.id} className="min-h-40 border-4 border-ink bg-white p-2">
                  <h5 className="m-0 mb-2 border-b-2 border-ink pb-1 text-xs font-bold tracking-wider">{c.label}</h5>
                  <div className="grid gap-2">
                    {s.tasks.filter((t) => t.col === c.id).map((t) => (
                      <div key={t.id} className="pop border-2 border-ink p-1.5 text-xs" style={{ background: c.id === "done" ? "#b8f5c9" : c.id === "review" ? "#ffe0a3" : c.id === "doing" ? "#cdeaff" : "#fff2b8" }}>
                        <b>{t.id}</b> {t.title}
                        {t.col === "doing" && <div className="mt-1 h-1.5 border border-ink bg-white"><div className="h-full bg-blue transition-all" style={{ width: `${t.progress}%` }} /></div>}
                        {t.pr && <div className="mt-1 font-bold">PR #{t.pr}{t.owner ? ` · ${t.owner}` : ""}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-4 border-4 border-ink bg-white"><div className="h-full bg-green transition-all" style={{ width: `${pct}%` }} /></div>
            <div className="mt-1 flex justify-between text-sm font-bold"><span>{pct}% shipped</span><span>{s.running ? (s.asking ? "waiting on you" : "running") : s.tasks.length ? "finished" : "idle"}</span></div>
          </div>

          {/* activity */}
          <div className="px-box-dark p-3 !shadow-none">
            <div className="mb-2 text-sm font-bold tracking-widest text-green">■ ACTIVITY</div>
            <ul className="font-term m-0 grid list-none gap-1.5 p-0 text-lg leading-tight">
              {s.feed.length === 0 && <li className="opacity-60">Nothing yet. Press Start team.</li>}
              {s.feed.map((f) => (
                <li key={f.id} className="pop flex gap-2 border-b border-white/10 pb-1">
                  <span className={f.icon === "!" ? "text-red" : f.icon === "✓" || f.icon === "★" ? "text-green" : "text-blue"}>{f.icon}</span>{f.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {s.asking && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-ink/60 p-4">
            <div className="pop px-box max-w-sm p-5" role="dialog" aria-modal="true" aria-labelledby="ask-t">
              <b id="ask-t" className="text-xl">Jim needs you</b>
              <p className="my-3">Use pgvector or a hosted vector DB for message search?</p>
              <div className="flex gap-2">
                <button className="px-btn bg-green px-3 py-1 font-bold" onClick={() => d({ t: "answer" })}>Use pgvector</button>
                <button className="px-btn bg-blue px-3 py-1 font-bold" onClick={() => d({ t: "answer" })}>Hosted vector DB</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
