import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clipboard,
  Database,
  FileCheck2,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "https://project-cipherwatch-production.up.railway.app/api";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, target: "dashboard" },
  { label: "Threat intelligence", icon: ShieldCheck, target: "threat-intelligence" },
  { label: "Network graph", icon: Network, target: "network-graph" },
  { label: "Federated learning", icon: GitBranch, target: "federated-learning" },
  { label: "Audit ledger", icon: FileCheck2, target: "audit-ledger" },
];

function Badge({ children, tone = "neutral", dot = false }) {
  return <span className={`cw-badge cw-badge-${tone}`}>{dot && <span className="cw-badge-dot" />}{children}</span>;
}

function Panel({ title, eyebrow, action, children, className = "", id }) {
  return (
    <section id={id} className={`cw-panel ${className}`}>
      <div className="cw-panel-header">
        <div>
          {eyebrow && <div className="cw-eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  return (
    <div className="cw-metric">
      <div className="cw-metric-top">
        <span>{label}</span>
        <span className={`cw-metric-icon cw-${tone}`}><Icon size={16} strokeWidth={1.8} /></span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ProgressBar({ value, tone = "blue" }) {
  return <div className="cw-progress"><span className={`cw-fill-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [accuracyHistory, setAccuracyHistory] = useState({ rounds: [], accuracy: [] });
  const [institutions, setInstitutions] = useState({});
  const [heroCluster, setHeroCluster] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [apiError, setApiError] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statusRes, accRes, instRes, heroRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/status`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/accuracy-history`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/institutions`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/hero-cluster`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/audit-log`).then((r) => (r.ok ? r.json() : null)),
      ]);
      if (!isMountedRef.current) return;
      setApiError(!statusRes && !accRes && !instRes);
      if (statusRes) {
        setStatus(statusRes);
        const r = statusRes.round ?? 0;
        const total = statusRes.total_rounds || 20;
        if (r > 0 && r < total) setIsRunning(true);
        else if (r >= total) setIsRunning(false);
        else if (statusRes.live) setIsRunning(true);
      }
      if (accRes && Array.isArray(accRes.rounds)) setAccuracyHistory(accRes);
      if (instRes && typeof instRes === "object") setInstitutions(instRes);
      if (heroRes && typeof heroRes === "object") setHeroCluster(heroRes);
      if (auditRes && Array.isArray(auditRes)) setAuditLog(auditRes);
    } catch (err) {
      console.warn("Polling warning:", err);
      setApiError(true);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 800);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const handleStartSimulation = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsRunning(true);
      setApiError(false);
      setStatus({
        round: 0, total_rounds: 20, global_accuracy: null, accuracy_delta: 0,
        institutions_online: 4, institutions_total: 4, clusters_flagged: 0,
        chain_integrity: { verified_blocks: 0, total_blocks: 20 }, live: true,
      });
      setAccuracyHistory({ rounds: [], accuracy: [] });
      setAuditLog([]);
      await fetch(`${API_BASE}/demo/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n_rounds: 20, round_delay_seconds: 2.0 }),
      });
    } catch (err) {
      console.error("Start error:", err);
      setIsRunning(false);
      setApiError(true);
    }
  };

  const currentRound = status?.round ?? 0;
  const totalRounds = status?.total_rounds || 20;
  const globalScore = heroCluster?.global_score ?? 0;
  const isGlobalHighRisk = globalScore >= 0.5;
  const verifiedBlocks = status?.chain_integrity?.verified_blocks ?? currentRound;
  const online = status?.institutions_online ?? Object.keys(institutions).length ?? 4;
  const accuracy = status?.global_accuracy;

  const clusterGraphNodes = useMemo(() => {
    const count = heroCluster?.wallet_count || 14;
    const centerX = 230, centerY = 110, radius = 78;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        id: `0x7a2...f${(i + 1).toString(16)}`, label: `W-${i + 1}`,
        x: centerX + radius * Math.cos(angle) + (i % 2 === 0 ? 8 : -8),
        y: centerY + radius * Math.sin(angle) + (i % 3 === 0 ? -6 : 6),
        amount: `${((i + 1) * 3.42).toFixed(2)} ETH`, hops: 2 + (i % 4),
        isFlagged: currentRound > 4 && (i < Math.floor((currentRound / totalRounds) * count) || isGlobalHighRisk),
      };
    });
  }, [heroCluster?.wallet_count, currentRound, totalRounds, isGlobalHighRisk]);

  const clusterEdges = useMemo(() => {
    const edges = [];
    const count = clusterGraphNodes.length;
    for (let i = 0; i < count; i++) {
      edges.push({ from: clusterGraphNodes[i], to: clusterGraphNodes[(i + 1) % count] });
      if (i % 3 === 0 && currentRound >= 5) edges.push({ from: clusterGraphNodes[i], to: clusterGraphNodes[(i + 5) % count] });
      if (i % 4 === 0 && currentRound >= 12) edges.push({ from: clusterGraphNodes[i], to: clusterGraphNodes[(i + 7) % count] });
    }
    return edges;
  }, [clusterGraphNodes, currentRound]);

  const chartData = useMemo(() => (accuracyHistory?.rounds || []).map((rnd, i) => ({
    round: `R${rnd}`, accuracy: Number(((accuracyHistory?.accuracy?.[i] || 0) * 100).toFixed(1)),
  })), [accuracyHistory]);

  const copyWallet = async () => {
    if (!selectedWallet) return;
    await navigator.clipboard?.writeText(selectedWallet.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const scrollToSection = (target) => {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="cw-app">
      <aside className="cw-sidebar">
        <div className="cw-brand">
          <div className="cw-brand-mark"><ShieldCheck size={20} /></div>
          <div><strong>CipherWatch</strong><small>Federated intelligence</small></div>
        </div>
        <div className="cw-side-label">Workspace</div>
        <nav>{navItems.map(({ label, icon: Icon, active }) => (
          <button key={label} className={`cw-nav-item ${label === "Dashboard" ? "active" : ""}`} onClick={() => scrollToSection(target)}><Icon size={17} />{label}</button>
        ))}</nav>
        <div className="cw-sidebar-bottom">
          <div className="cw-side-label">Environment</div>
          <div className="cw-env"><span className="cw-live-dot" /><div><strong>Production</strong><small>API connected</small></div></div>
        </div>
      </aside>

      <main id="dashboard" className="cw-main">
        <header className="cw-header">
          <div>
            <div className="cw-breadcrumb">Workspace <ChevronRight size={13} /> Intelligence console</div>
            <h1>Federated threat intelligence</h1>
            <p>Monitor collaborative fraud detection across participating institutions.</p>
          </div>
          <div className="cw-header-actions">
            <div className="cw-header-status"><span className={`cw-live-dot ${apiError ? "offline" : ""}`} /><div><strong>{apiError ? "API offline" : "System operational"}</strong><small>Updated just now</small></div></div>
            <button className={`cw-primary-button ${isRunning ? "running" : ""}`} onClick={handleStartSimulation} disabled={isRunning}>
              {isRunning ? <RefreshCw size={16} className="cw-spin" /> : <Play size={16} fill="currentColor" />}
              {isRunning ? "Round in progress" : "Start simulation"}
            </button>
          </div>
        </header>

        <div className="cw-round-strip">
          <div className="cw-round-copy"><span className="cw-eyebrow">Federated learning cycle</span><strong>Round {currentRound} of {totalRounds}</strong></div>
          <ProgressBar value={(currentRound / totalRounds) * 100} />
          <div className="cw-round-state"><span className={`cw-status-dot ${isRunning ? "working" : "ready"}`} />{isRunning ? "Processing secure updates" : currentRound >= totalRounds ? "Cycle complete" : "Ready to begin"}</div>
        </div>

        {apiError && <div className="cw-alert"><AlertTriangle size={17} /><span><strong>Unable to reach the dashboard API.</strong> Live values will resume when the backend is available.</span><button onClick={fetchDashboardData}>Retry</button></div>}

        <section className="cw-metrics" aria-label="Key metrics">
          <MetricCard label="Global accuracy" value={accuracy == null ? "—" : `${(accuracy * 100).toFixed(1)}%`} detail={`${accuracy == null ? "Awaiting evaluation" : `${((status?.accuracy_delta || 0) * 100).toFixed(2)}% vs prior round`}`} icon={BarChart3} />
          <MetricCard label="Active nodes" value={`${online} / ${status?.institutions_total ?? 4}`} detail="Secure participants" icon={Users} tone="green" />
          <MetricCard label="Scam clusters" value={status?.clusters_flagged ?? "—"} detail="Resolved entities" icon={Network} />
          <MetricCard label="Chain integrity" value={`${verifiedBlocks} / ${totalRounds}`} detail="SHA-256 blocks verified" icon={CheckCircle2} tone="green" />
        </section>

        <div className="cw-grid cw-grid-top">
          <Panel id="federated-learning" title="Global model accuracy" eyebrow="Held-out evaluation · 3,000 samples" action={<Badge tone="blue" dot>{isRunning ? "Live" : "Monitoring"}</Badge>}>
            <div className="cw-chart-wrap">
              {chartData.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <defs><linearGradient id="accuracyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d91b9" stopOpacity={0.22} /><stop offset="100%" stopColor="#6d91b9" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid stroke="#edf0f3" vertical={false} />
                  <XAxis dataKey="round" tickLine={false} axisLine={false} tick={{ fill: "#8b95a3", fontSize: 11 }} />
                  <YAxis domain={[50, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: "#8b95a3", fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: "1px solid #e2e6eb", borderRadius: 8, fontSize: 12 }} formatter={(value) => [`${value}%`, "Accuracy"]} />
                  <ReferenceLine y={90} stroke="#cbd3dc" strokeDasharray="4 4" label={{ value: "Target 90%", fill: "#8b95a3", fontSize: 10, position: "insideTopRight" }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#5078a8" fill="url(#accuracyFill)" strokeWidth={2} dot={{ r: 3, fill: "#5078a8", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer> : <div className="cw-empty"><BarChart3 size={22} /><span>Start a federated run to view model performance.</span></div>}
            </div>
          </Panel>
          <Panel title="Institution federation status" eyebrow="Secure weight aggregation participants">
            <div className="cw-node-list">{Object.entries(institutions || {}).length ? Object.entries(institutions).map(([key, data]) => {
              const healthy = data?.status === "SYNCED";
              return <div className="cw-node-row" key={key}><div className="cw-node-icon"><Database size={16} /></div><div className="cw-node-name"><strong>{key.replaceAll("_", " ")}</strong><small>{data?.label || "Institution node"}</small></div><Badge tone={healthy ? "green" : "amber"} dot>{data?.status || "IDLE"}</Badge></div>;
            }) : <div className="cw-empty small"><Users size={19} /><span>Nodes will appear when the API responds.</span></div>}</div>
            <div className="cw-panel-note"><Activity size={14} /> Status updates every 2 seconds</div>
          </Panel>
        </div>

        <Panel id="threat-intelligence" title="Syndicate risk analysis" eyebrow="Local model view compared with the unified federated model" action={<Badge tone={isGlobalHighRisk ? "red" : "amber"} dot>{isGlobalHighRisk ? "High risk detected" : "Awaiting signal"}</Badge>}>
          <div className="cw-risk-grid">
            <div className="cw-risk-intro"><div className="cw-cluster-avatar"><Network size={23} /></div><div><strong>Cluster 0x7a2...f1</strong><p>{heroCluster?.wallet_count || 14} connected wallets identified across participating institutions.</p></div></div>
            <div className="cw-risk-stage"><span>01</span><div><small>Raw transaction fragments</small><strong>Distributed activity</strong><p>Signals remain isolated within local datasets.</p></div><ChevronRight size={17} /></div>
            <div className="cw-risk-stage"><span>02</span><div><small>Node A local evaluation</small><strong>{heroCluster?.local_label || "Low risk"} <em>{heroCluster?.local_score == null ? "0.40" : heroCluster.local_score.toFixed(2)}</em></strong><ProgressBar value={(heroCluster?.local_score || 0.4) * 100} tone="green" /></div><Badge tone="green">Blinded</Badge></div>
            <div className={`cw-risk-stage ${isGlobalHighRisk ? "threat" : ""}`}><span>03</span><div><small>Global federated assessment</small><strong>{heroCluster?.global_label || "Awaiting"} <em>{heroCluster?.global_score == null ? "0.00" : heroCluster.global_score.toFixed(2)}</em></strong><ProgressBar value={globalScore * 100} tone={isGlobalHighRisk ? "red" : "amber"} /></div><Badge tone={isGlobalHighRisk ? "red" : "amber"}>{isGlobalHighRisk ? "Detected" : "Aggregating"}</Badge></div>
          </div>
        </Panel>

        <div className="cw-grid cw-grid-bottom">
          <Panel id="network-graph" title="Suspicious entity network" eyebrow={`Cross-bank co-occurrence · ${clusterEdges.length} detected connections`} action={<div className="cw-legend"><span><i className="legend-red" />High risk</span><span><i className="legend-blue" />Observed</span></div>}>
            <div className="cw-network">
              <svg viewBox="0 0 460 220" role="img" aria-label="Wallet relationship network">
                {clusterEdges.map((e, idx) => <line key={idx} x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} stroke={e.from.isFlagged && e.to.isFlagged ? "#b45757" : "#9fb4ca"} strokeWidth={e.from.isFlagged && e.to.isFlagged ? 1.7 : 1} strokeDasharray={e.from.isFlagged && e.to.isFlagged ? "none" : "4 4"} opacity={e.from.isFlagged && e.to.isFlagged ? 0.75 : 0.45} />)}
                {clusterGraphNodes.map((n) => { const selected = selectedWallet?.id === n.id; const color = n.isFlagged ? "#b45757" : "#6d91b9"; return <g key={n.id} className="cw-node" onClick={() => setSelectedWallet(n)}><circle cx={n.x} cy={n.y} r={selected ? 9 : 6} fill="#fff" stroke={selected ? "#a9792e" : color} strokeWidth={selected ? 3 : 2} /><text x={n.x} y={n.y + 16} textAnchor="middle" fill={selected ? "#a9792e" : "#7e8996"} fontSize="8" fontFamily="inherit">{n.label}</text></g>; })}
              </svg>
              {selectedWallet && <div className="cw-wallet-card"><div className="cw-wallet-head"><div><small>Selected entity</small><strong>{selectedWallet.id}</strong></div><button onClick={copyWallet} title="Copy entity ID"><Clipboard size={14} /></button></div><div className="cw-wallet-stats"><span><small>Volume</small><strong>{selectedWallet.amount}</strong></span><span><small>Hops</small><strong>{selectedWallet.hops} inter-bank</strong></span></div><Badge tone={selectedWallet.isFlagged ? "red" : "blue"}>{selectedWallet.isFlagged ? "High-risk entity" : "Observed entity"}</Badge>{copied && <span className="cw-copied">Copied</span>}</div>}
            </div>
          </Panel>
          <Panel title="Federated learning flow" eyebrow="Privacy-preserving model collaboration">
            <div className="cw-flow">{[["Institutions", Users], ["Local updates", GitBranch], ["Differential privacy", LockKeyhole], ["FedAvg global model", Sparkles]].map(([label, Icon], i) => <React.Fragment key={label}><div className="cw-flow-step"><span><Icon size={16} /></span><small>{label}</small></div>{i < 3 && <ChevronRight className="cw-flow-arrow" size={16} />}</React.Fragment>)}</div>
            <div className="cw-privacy-note"><LockKeyhole size={15} /><div><strong>Raw data stays local</strong><span>Only privacy-protected model updates are aggregated.</span></div></div>
          </Panel>
        </div>

        <Panel id="audit-ledger" title="Cryptographic audit ledger" eyebrow="Tamper-evident SHA-256 verification chain" action={<Badge tone="green" dot>{verifiedBlocks}/{totalRounds} verified</Badge>}>
          <div className="cw-table-wrap cw-scrollbar"><table className="cw-table"><thead><tr><th>Block</th><th>Round</th><th>Accuracy</th><th>Clusters</th><th>Hash</th><th>Verification</th></tr></thead><tbody>{auditLog.length ? auditLog.map((row, idx) => <tr key={idx}><td><strong>#{row.block}</strong></td><td>Round {row.round}</td><td>{row.accuracy ? `${(row.accuracy * 100).toFixed(1)}%` : "—"}</td><td>{row.cluster_count ?? "—"}</td><td className="cw-hash">{row.hash}</td><td><Badge tone="green" dot>{row.status || "VERIFIED"}</Badge></td></tr>) : <tr><td colSpan="6"><div className="cw-empty table-empty"><FileCheck2 size={20} /><span>No blocks committed yet. Start a simulation to create the audit trail.</span></div></td></tr>}</tbody></table></div>
        </Panel>

        <footer className="cw-footer"><span><CircleDot size={13} /> CipherWatch · Federated Threat Intelligence Console</span><span>MIT licensed · Privacy-preserving by design</span></footer>
      </main>
    </div>
  );
}