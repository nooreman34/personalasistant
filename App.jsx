import { useState, useEffect, useRef } from "react";

const CURRICULUM = [
  { week: 1, day: 1, topic: "Arrays – Basics & Methods", query: "DSA with JavaScript Hindi arrays", emoji: "📦" },
  { week: 1, day: 2, topic: "Array Loops – forEach, map, filter", query: "DSA with JavaScript Hindi array loops", emoji: "🔁" },
  { week: 1, day: 3, topic: "Objects & Key-Value Pairs", query: "DSA with JavaScript Hindi objects", emoji: "🗂️" },
  { week: 1, day: 4, topic: "Linked Lists – Concept & Node", query: "DSA with JavaScript Hindi linked list", emoji: "🔗" },
  { week: 1, day: 5, topic: "Linked List – Insert & Delete", query: "DSA with JavaScript Hindi linked list insert delete", emoji: "✂️" },
  { week: 2, day: 1, topic: "Stacks – LIFO Concept", query: "DSA with JavaScript Hindi stack", emoji: "📚" },
  { week: 2, day: 2, topic: "Queues – FIFO Concept", query: "DSA with JavaScript Hindi queue", emoji: "🚶" },
  { week: 2, day: 3, topic: "Hash Tables & Objects", query: "DSA with JavaScript Hindi hash table", emoji: "🗃️" },
  { week: 2, day: 4, topic: "Binary Trees – Intro", query: "DSA with JavaScript Hindi binary tree", emoji: "🌲" },
  { week: 2, day: 5, topic: "Tree Traversal – BFS & DFS", query: "DSA with JavaScript Hindi BFS DFS", emoji: "🧭" },
  { week: 3, day: 1, topic: "Sorting – Bubble & Selection", query: "DSA with JavaScript Hindi bubble sort", emoji: "🔢" },
  { week: 3, day: 2, topic: "Sorting – Merge Sort", query: "DSA with JavaScript Hindi merge sort", emoji: "🔀" },
  { week: 3, day: 3, topic: "Recursion Fundamentals", query: "DSA with JavaScript Hindi recursion", emoji: "♻️" },
  { week: 3, day: 4, topic: "Graph – Adjacency List", query: "DSA with JavaScript Hindi graph", emoji: "🕸️" },
  { week: 3, day: 5, topic: "Dynamic Programming Intro", query: "DSA with JavaScript Hindi dynamic programming", emoji: "🧩" },
];

const PLAYLIST_URL = "https://www.youtube.com/watch?v=wZHtZ_VJGKI";
const STORAGE_KEY = "noor_js_agent_v2";

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function ytSearchUrl(q) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function App() {
  const saved = loadState();
  const [started, setStarted] = useState(saved.started ?? false);
  const [startDate, setStartDate] = useState(saved.startDate ?? null);
  const [completed, setCompleted] = useState(saved.completed ?? []);
  const [notifPerm, setNotifPerm] = useState("default");
  const [aiTip, setAiTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [now, setNow] = useState(new Date());
  const [sessionSec, setSessionSec] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [toast, setToast] = useState("");
  const [view, setView] = useState("home");
  const timerRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    saveState({ started, startDate, completed });
  }, [started, startDate, completed]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  // Schedule daily 5 PM notification
  useEffect(() => {
    if (!started || notifPerm !== "granted") return;
    function schedule() {
      const next = new Date();
      next.setHours(17, 0, 0, 0);
      if (new Date() >= next) next.setDate(next.getDate() + 1);
      const ms = next - new Date();
      notifRef.current = setTimeout(() => {
        const l = todayLesson();
        new Notification("⚡ JS Study Time – Noor!", {
          body: l ? `Aaj ka topic: ${l.emoji} ${l.topic}\nChannel ki next video dekho! 5–7 PM` : "🎉 Roadmap complete! Revision time!",
          icon: "/icon-192.png",
        });
        schedule();
      }, ms);
    }
    schedule();
    return () => clearTimeout(notifRef.current);
  }, [started, notifPerm]);

  // Session timer
  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setSessionSec(s => {
          if (s >= 7200) {
            setSessionActive(false);
            showToast("🎉 2 ghantay complete! Shabash Noor!");
            return 0;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  function todayLesson() {
    if (!startDate) return CURRICULUM[0];
    const days = Math.floor((Date.now() - new Date(startDate)) / 86400000);
    return CURRICULUM[Math.min(days, CURRICULUM.length - 1)];
  }

  function dayIdx() {
    if (!startDate) return 0;
    return Math.min(Math.floor((Date.now() - new Date(startDate)) / 86400000), CURRICULUM.length - 1);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function requestNotif() {
    if (!("Notification" in window)) return showToast("❌ Browser notifications support nahi karta");
    const r = await Notification.requestPermission();
    setNotifPerm(r);
    showToast(r === "granted" ? "✅ Notifications on! Roz 5 PM reminder aayega" : "❌ Allow nahi hua — browser settings check karo");
  }

  function handleStart() {
    setStarted(true);
    setStartDate(new Date().toISOString());
    showToast("🚀 Journey shuru ho gayi Noor!");
  }

  async function fetchTip() {
    const lesson = todayLesson();
    setLoadingTip(true);
    setAiTip("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `Tum ek friendly JS tutor ho. Noor ek university student hai jo "${lesson.topic}" seekh rahi hai DSA with JavaScript Hindi channel se. Usse Hinglish mein 3-4 bullet points mein batao: kya seekhna hai, ek real-life misaal, ek practice idea, aur ek motivational line. Max 150 words. Emojis zaroor use karo.`,
          messages: [{ role: "user", content: `"${lesson.topic}" ke baare mein aaj ka tip do!` }]
        })
      });
      const data = await res.json();
      setAiTip(data.content?.map(b => b.text || "").join("") || "Tip load nahi ho saki.");
    } catch {
      setAiTip("❌ Internet check karo aur retry karo.");
    }
    setLoadingTip(false);
  }

  function markDone() {
    const idx = dayIdx();
    if (!completed.includes(idx)) {
      setCompleted(p => [...p, idx]);
      showToast("✅ Lesson complete! Shabash Noor! 🌟");
    }
  }

  const lesson = todayLesson();
  const idx = dayIdx();
  const isDone = completed.includes(idx);
  const progress = Math.round((completed.length / CURRICULUM.length) * 100);
  const sessionPct = Math.min((sessionSec / 7200) * 100, 100);
  const isStudyTime = now.getHours() >= 17 && now.getHours() < 19;
  const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#07071a 0%,#0f0a2e 60%,#071628 100%)", color: "#e8e8ff", fontFamily: "'Segoe UI',system-ui,sans-serif", padding: "0", overflowX: "hidden" }}>

      {/* Glow blobs */}
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,.18) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,.13) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", background: "rgba(109,40,217,.97)", color: "#fff", padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: "0 8px 30px rgba(109,40,217,.45)", border: "1px solid rgba(167,139,250,.35)", backdropFilter: "blur(10px)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 460, margin: "0 auto", padding: "22px 14px 40px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 38, marginBottom: 2 }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "#c4b5fd", letterSpacing: "-.5px" }}>JS Learning Agent</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#7c6aab" }}>Noor ki daily study companion</p>
          <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: isStudyTime ? "#86efac" : "#a78bfa", letterSpacing: "-.5px" }}>
            {timeStr}
            {isStudyTime && <span style={{ fontSize: 10, marginLeft: 8, background: "rgba(134,239,172,.18)", color: "#86efac", padding: "2px 9px", borderRadius: 99, fontWeight: 700 }}>STUDY TIME ✨</span>}
          </div>
        </div>

        {/* Nav */}
        {started && (
          <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "rgba(255,255,255,.04)", borderRadius: 12, padding: 4 }}>
            {["home", "roadmap"].map(tab => (
              <button key={tab} onClick={() => setView(tab)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 9, background: view === tab ? "rgba(109,40,217,.75)" : "transparent", color: view === tab ? "#fff" : "#7c6aab", fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
                {tab === "home" ? "🏠 Home" : "🗺️ Roadmap"}
              </button>
            ))}
          </div>
        )}

        {/* ── ONBOARDING ── */}
        {!started ? (
          <div>
            <Card>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 46, marginBottom: 10 }}>🎯</div>
                <h2 style={{ margin: "0 0 8px", fontSize: 17, color: "#c4b5fd" }}>Teri JS Study Plan</h2>
                <p style={{ margin: "0 0 18px", color: "#7c6aab", fontSize: 13, lineHeight: 1.65 }}>
                  DSA with JavaScript Hindi channel se seekhna hai? Yeh agent roz 5 PM pe remind karega, AI tip dega, aur progress track karega.
                </p>
                <InfoRow icon="⏰" label="Daily reminder" value="5:00 PM (roz)" />
                <InfoRow icon="📅" label="Session" value="5 PM – 7 PM (2 hours)" />
                <InfoRow icon="📺" label="Channel" value="DSA JS Hindi" />
                <InfoRow icon="📚" label="Lessons" value={`${CURRICULUM.length} topics, 3 weeks`} />
                <div style={{ height: 12 }} />
                <Btn onClick={handleStart} color="#7c3aed">🚀 Journey Shuru Karo</Btn>
              </div>
            </Card>
            <Card style={{ marginTop: 14 }}>
              <NotifBanner perm={notifPerm} onRequest={requestNotif} />
            </Card>
          </div>

        ) : view === "home" ? (

          /* ── HOME ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Progress */}
            <Card>
              <Row label="Overall progress" value={`${progress}%`} />
              <Bar pct={progress} color="linear-gradient(90deg,#7c3aed,#a78bfa)" />
              <div style={{ marginTop: 7, fontSize: 12, color: "#4b5563" }}>{completed.length}/{CURRICULUM.length} lessons complete • Week {lesson?.week}</div>
            </Card>

            {/* Today's lesson */}
            <Card style={{ border: "1px solid rgba(167,139,250,.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1 }}>Aaj ka Topic</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: "#e8e8ff", marginTop: 3 }}>{lesson?.emoji} {lesson?.topic}</div>
                </div>
                {isDone && <Tag color="#86efac">✓ Done</Tag>}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14 }}>Week {lesson?.week} • Lesson {idx + 1} of {CURRICULUM.length}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", background: "#dc2626", color: "#fff", padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 15px rgba(220,38,38,.4)" }}>
                  ▶ Channel Playlist Kholo
                </a>
                <a href={ytSearchUrl(lesson?.query)} target="_blank" rel="noopener noreferrer" style={{ display: "block", textAlign: "center", background: "rgba(255,255,255,.05)", color: "#a78bfa", padding: "10px 0", borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: "none", border: "1px solid rgba(167,139,250,.2)" }}>
                  🔍 Search "{lesson?.topic}"
                </a>
                {!isDone && <Btn onClick={markDone} color="transparent" border="rgba(134,239,172,.35)" textColor="#86efac">✓ Aaj ki Lesson Mark Done</Btn>}
              </div>
            </Card>

            {/* AI Tip */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#c4b5fd" }}>🤖 AI Tutor Tip</span>
                <button onClick={fetchTip} disabled={loadingTip} style={{ background: "rgba(109,40,217,.3)", border: "1px solid rgba(167,139,250,.3)", color: "#a78bfa", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: loadingTip ? "wait" : "pointer", fontWeight: 700 }}>
                  {loadingTip ? "Loading..." : "Get Tip ✨"}
                </button>
              </div>
              {aiTip
                ? <div style={{ fontSize: 13, lineHeight: 1.75, color: "#d1d5db", whiteSpace: "pre-wrap" }}>{aiTip}</div>
                : <div style={{ fontSize: 13, color: "#4b5563", fontStyle: "italic" }}>Get Tip dabao — AI aaj ke topic ka personalized tip Hinglish mein dega 💡</div>
              }
            </Card>

            {/* Session Timer */}
            <Card>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#c4b5fd", marginBottom: 12 }}>⏱️ Study Session (5PM–7PM)</div>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: sessionActive ? "#86efac" : "#a78bfa", letterSpacing: "-1px" }}>
                  {formatTime(sessionSec)}
                </div>
                <div style={{ fontSize: 11, color: "#4b5563", marginTop: 3 }}>Goal: 02:00:00</div>
              </div>
              <Bar pct={sessionPct} color={sessionActive ? "linear-gradient(90deg,#059669,#86efac)" : "linear-gradient(90deg,#7c3aed,#a78bfa)"} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={() => setSessionActive(v => !v)} color={sessionActive ? "#dc2626" : "#059669"}>
                  {sessionActive ? "⏸ Pause" : "▶ Start Session"}
                </Btn>
                {sessionSec > 0 && (
                  <button onClick={() => { setSessionActive(false); setSessionSec(0); }} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#6b7280", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                    Reset
                  </button>
                )}
              </div>
            </Card>

            {/* Notifications */}
            <Card>
              <NotifBanner perm={notifPerm} onRequest={requestNotif} compact />
            </Card>
          </div>

        ) : (

          /* ── ROADMAP ── */
          <Card>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#c4b5fd", marginBottom: 18 }}>📚 3-Week JS Roadmap</div>
            {[1, 2, 3].map(week => (
              <div key={week} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Week {week}</div>
                {CURRICULUM.filter(l => l.week === week).map(l => {
                  const i = CURRICULUM.indexOf(l);
                  const done = completed.includes(i);
                  const isToday = i === idx;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, marginBottom: 6, background: isToday ? "rgba(109,40,217,.22)" : "rgba(255,255,255,.03)", border: isToday ? "1px solid rgba(167,139,250,.4)" : "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: done ? "rgba(134,239,172,.2)" : isToday ? "rgba(109,40,217,.5)" : "rgba(255,255,255,.06)", color: done ? "#86efac" : "#a78bfa", fontWeight: 700, flexShrink: 0 }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: done ? "#4b5563" : "#e8e8ff" }}>{l.emoji} {l.topic}</div>
                        {isToday && <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 1 }}>← Aaj ka topic</div>}
                      </div>
                      {isToday && (
                        <a href={PLAYLIST_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, textDecoration: "none" }}>▶</a>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </Card>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "#1f2937", marginTop: 24 }}>Made with ❤️ for Noor • JS Data Structures 2026</p>
      </div>
    </div>
  );
}

// ── Reusable components ──────────────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: 18, backdropFilter: "blur(8px)", ...style }}>{children}</div>;
}
function Bar({ pct, color }) {
  return (
    <div style={{ height: 7, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width .5s ease" }} />
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "#7c6aab" }}>{label}</span>
      <span style={{ color: "#a78bfa", fontWeight: 700 }}>{value}</span>
    </div>
  );
}
function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)", textAlign: "left" }}>
      <span style={{ fontSize: 13, color: "#7c6aab" }}>{icon} {label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd" }}>{value}</span>
    </div>
  );
}
function Tag({ children, color }) {
  return <span style={{ background: `rgba(${color === "#86efac" ? "134,239,172" : "167,139,250"},.15)`, color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, border: `1px solid ${color}44` }}>{children}</span>;
}
function Btn({ children, onClick, color, border, textColor }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "11px 0", border: border ? `1px solid ${border}` : "none", borderRadius: 10, background: color === "transparent" ? "transparent" : color, color: textColor || "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: color !== "transparent" ? `0 4px 14px ${color}55` : "none" }}>
      {children}
    </button>
  );
}
function NotifBanner({ perm, onRequest, compact }) {
  if (perm === "granted") return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 22 }}>🔔</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#86efac" }}>Notifications Active</div>
        {!compact && <div style={{ fontSize: 12, color: "#4b5563" }}>Roz 5 PM pe reminder aayega</div>}
      </div>
    </div>
  );
  return (
    <div>
      {!compact && <div style={{ fontSize: 13, color: "#7c6aab", marginBottom: 10 }}>Browser notifications allow karo taake roz 5 PM reminder mile:</div>}
      <Btn onClick={onRequest} color="#7c3aed">🔔 {compact ? "Enable Notifications" : "Notifications On Karo (5 PM daily)"}</Btn>
    </div>
  );
}
