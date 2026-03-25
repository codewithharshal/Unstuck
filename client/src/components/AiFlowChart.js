import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import backendUrl from "../backendUrl";

const SVG_W = 680;
const NODE_W = 186;
const NODE_H = 52;
const DIA_W = 210;
const DIA_H = 78;
const YGAP = 120;
const XGAP = 55;
const PAD_TOP = 44;

const PALETTE = {
  start: { fill: "#1D9E75", stroke: "#0F6E56", text: "#fff" },
  end: { fill: "#D85A30", stroke: "#993C1D", text: "#fff" },
  step: { fill: "#185FA5", stroke: "#0C447C", text: "#fff" },
  decision: { fill: "#BA7517", stroke: "#7A4910", text: "#fff" },
};

function computeLayout(nodes, edges) {
  if (!nodes?.length) return { pos: {}, svgH: 300 };

  const startNode = nodes.find((n) => n.type === "start") || nodes[0];
  const adj = {};

  nodes.forEach((n) => {
    adj[n.id] = [];
  });
  edges.forEach((e) => {
    if (adj[e.from]) adj[e.from].push(e.to);
  });

  const level = { [startNode.id]: 0 };
  const queue = [startNode.id];
  const visited = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);

    (adj[cur] || []).forEach((to) => {
      if (level[to] === undefined) level[to] = level[cur] + 1;
      queue.push(to);
    });
  }

  nodes.forEach((n, i) => {
    if (level[n.id] === undefined) level[n.id] = i;
  });

  const byLevel = {};
  nodes.forEach((n) => {
    const nodeLevel = level[n.id];
    (byLevel[nodeLevel] = byLevel[nodeLevel] || []).push(n.id);
  });

  const pos = {};
  const maxLevel = Math.max(...Object.keys(byLevel).map(Number));

  Object.entries(byLevel).forEach(([l, ids]) => {
    const count = ids.length;
    ids.forEach((id, i) => {
      const nd = nodes.find((n) => n.id === id);
      const w = nd?.type === "decision" ? DIA_W : NODE_W;
      const h = nd?.type === "decision" ? DIA_H : NODE_H;
      const totalW = count * w + (count - 1) * XGAP;
      const x0 = (SVG_W - totalW) / 2;
      const x = x0 + i * (w + XGAP);
      const y = PAD_TOP + parseInt(l, 10) * YGAP;
      pos[id] = { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
    });
  });

  const svgH = PAD_TOP + maxLevel * YGAP + DIA_H + 32;
  return { pos, svgH };
}

function wrapText(text, maxChars) {
  const words = (text || "").split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
      return;
    }

    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  return lines;
}

function FlowNode({ node, pos }) {
  const c = PALETTE[node.type] || PALETTE.step;

  if (node.type === "start" || node.type === "end") {
    return (
      <g>
        <rect
          x={pos.x}
          y={pos.y}
          width={pos.w}
          height={pos.h}
          rx={pos.h / 2}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth="1.5"
        />
        <text
          x={pos.cx}
          y={pos.cy}
          textAnchor="middle"
          dominantBaseline="central"
          fill={c.text}
          fontSize="13"
          fontWeight="600"
        >
          {node.label}
        </text>
      </g>
    );
  }

  if (node.type === "decision") {
    const points = `${pos.cx},${pos.y} ${pos.x + pos.w},${pos.cy} ${pos.cx},${pos.y + pos.h} ${pos.x},${pos.cy}`;
    const lines = wrapText(node.label, 18);

    return (
      <g>
        <polygon
          points={points}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth="1.5"
        />
        {lines.map((line, i) => (
          <text
            key={`${node.id}-txt-${i}`}
            x={pos.cx}
            y={pos.cy + (i - (lines.length - 1) / 2) * 15}
            textAnchor="middle"
            dominantBaseline="central"
            fill={c.text}
            fontSize="11.5"
            fontWeight="600"
          >
            {line}
          </text>
        ))}
      </g>
    );
  }

  const lines = wrapText(node.label, 22);
  return (
    <g>
      <rect
        x={pos.x}
        y={pos.y}
        width={pos.w}
        height={pos.h}
        rx="8"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="1.5"
      />
      {lines.map((line, i) => (
        <text
          key={`${node.id}-txt-${i}`}
          x={pos.cx}
          y={pos.cy + (i - (lines.length - 1) / 2) * 16}
          textAnchor="middle"
          dominantBaseline="central"
          fill={c.text}
          fontSize="12.5"
          fontWeight="500"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function FlowEdge({ edge, nodes, pos }) {
  const fp = pos[edge.from];
  const tp = pos[edge.to];
  if (!fp || !tp) return null;

  const fromNode = nodes.find((n) => n.id === edge.from);
  let d = "";
  let lx = 0;
  let ly = 0;

  if (fromNode?.type === "decision") {
    const dx = tp.cx - fp.cx;

    if (Math.abs(dx) > 35) {
      const sx = dx > 0 ? fp.x + fp.w : fp.x;
      const sy = fp.cy;
      const ex = tp.cx;
      const ey = tp.y;
      d = `M${sx},${sy} L${ex},${sy} L${ex},${ey}`;
      lx = (sx + ex) / 2;
      ly = sy - 11;
    } else {
      d = `M${fp.cx},${fp.y + fp.h} L${tp.cx},${tp.y}`;
      lx = fp.cx + 8;
      ly = (fp.y + fp.h + tp.y) / 2;
    }
  } else {
    d = `M${fp.cx},${fp.y + fp.h} L${tp.cx},${tp.y}`;
    lx = fp.cx + 8;
    ly = (fp.y + fp.h + tp.y) / 2;
  }

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.5"
        markerEnd="url(#ah)"
      />
      {edge.label ?
        <text
          x={lx}
          y={ly}
          fill="#64748b"
          fontSize="11"
          fontWeight="500"
          textAnchor="middle"
        >
          {edge.label}
        </text>
      : null}
    </g>
  );
}

function FlowchartSVG({ chart }) {
  const { pos, svgH } = computeLayout(chart.nodes, chart.edges);

  return (
    <svg width="100%" viewBox={`0 0 ${SVG_W} ${svgH}`}>
      <defs>
        <marker
          id="ah"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path
            d="M2 2L8 5L2 8"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      {chart.edges.map((edge, i) => (
        <FlowEdge key={`edge-${i}`} edge={edge} nodes={chart.nodes} pos={pos} />
      ))}
      {chart.nodes.map((node) => {
        const nodePos = pos[node.id];
        return nodePos ?
            <FlowNode key={node.id} node={node} pos={nodePos} />
          : null;
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        justifyContent: "center",
        marginTop: 14,
        flexWrap: "wrap",
      }}
    >
      {[
        ["start", "Start / End"],
        ["step", "Process step"],
        ["decision", "Decision"],
      ].map(([type, label]) => (
        <div
          key={type}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              background: PALETTE[type].fill,
              borderRadius:
                type === "decision" ? 2
                : type === "start" ? 7
                : 3,
              transform: type === "decision" ? "rotate(45deg)" : "none",
              flexShrink: 0,
            }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function AIFlowchartGenerator() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const preferredPostId = urlParams.get("postId");
  const autoGenerateFromUrl = urlParams.get("autogen") === "1";

  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [query, setQuery] = useState("");
  const [chart, setChart] = useState(null);
  const [meta, setMeta] = useState(null);
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async (postIdOverride = "") => {
    const targetPostId = postIdOverride || selectedPostId;
    if (!targetPostId || loading || loadingPosts) return;

    const selected = posts.find((post) => post.id === targetPostId);

    setLoading(true);
    setError("");
    setChart(null);
    setMeta(null);
    if (selected?.title) {
      setQuery(selected.title);
    }

    try {
      const res = await fetch(
        `${backendUrl}/api/posts/${targetPostId}/flowchart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Flowchart request failed.");
      }

      if (!data?.chart?.nodes?.length || !data?.chart?.edges?.length) {
        throw new Error("Invalid flowchart data returned by server.");
      }

      setChart(data.chart);
      setMeta({
        cached: Boolean(data.cached),
        source: data.source || "unknown",
        query: data.query || selected?.title || query,
      });
    } catch (requestError) {
      setError(requestError.message || "Could not generate flowchart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoadingPosts(true);

      try {
        const res = await fetch(
          `${backendUrl}/api/posts/?sortby=new&limit=30&page=1`,
        );
        const data = await res.json();
        const list = Array.isArray(data?.results) ? data.results : [];

        if (!isMounted) return;

        setPosts(list);
        if (list.length) {
          const preferredExists =
            preferredPostId ?
              list.find((post) => post.id === preferredPostId)
            : null;

          const nextPost = preferredExists || list[0];
          setSelectedPostId(nextPost.id);
          setQuery(nextPost.title || "");
          setPendingAutoGenerate(Boolean(autoGenerateFromUrl));
        }
      } catch (_error) {
        if (isMounted) {
          setError("Could not load posts. Please refresh and try again.");
        }
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [preferredPostId, autoGenerateFromUrl]);

  useEffect(() => {
    if (!pendingAutoGenerate || !selectedPostId || loadingPosts || loading) {
      return;
    }

    setPendingAutoGenerate(false);
    generate(selectedPostId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoGenerate, selectedPostId, loadingPosts]);

  const onPostChange = (event) => {
    const id = event.target.value;
    setSelectedPostId(id);

    const selected = posts.find((post) => post.id === id);
    setQuery(selected?.title || "");
    setChart(null);
    setMeta(null);
    setError("");
  };

  const hasPosts = posts.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: "#f1f5f9",
              fontSize: "clamp(20px,4vw,30px)",
              fontWeight: 700,
              margin: 0,
            }}
          >
            AI Flowchart Generator
          </h1>
          <p style={{ color: "#64748b", marginTop: 8, fontSize: 14 }}>
            Pick a post title from DB, generate once, and re-use cached JSON for
            everyone.
          </p>
        </div>

        <div
          style={{
            background: "#1e293b",
            borderRadius: 16,
            padding: "1.4rem",
            marginBottom: "1.5rem",
            border: "1px solid #334155",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label
              htmlFor="flow-post-select"
              style={{
                display: "block",
                color: "#94a3b8",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              Select post title (from database)
            </label>
            <select
              id="flow-post-select"
              value={selectedPostId}
              onChange={onPostChange}
              disabled={loadingPosts || !hasPosts}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 9,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
              }}
            >
              {!hasPosts ?
                <option value="">
                  {loadingPosts ? "Loading posts..." : "No posts found"}
                </option>
              : null}
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <input
              value={query}
              readOnly
              placeholder="Selected title will appear here"
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 9,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
              }}
            />
            <button
              onClick={generate}
              disabled={!selectedPostId || loadingPosts || loading}
              style={{
                padding: "11px 20px",
                borderRadius: 9,
                border: "none",
                background:
                  !selectedPostId || loadingPosts || loading ?
                    "#1e3a5f"
                  : "#4f46e5",
                color:
                  !selectedPostId || loadingPosts || loading ?
                    "#475569"
                  : "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Generating..." : "Flow Generate"}
            </button>
          </div>
          <span style={{ color: "#64748b", fontSize: 12 }}>
            Repeated requests for the same unchanged title will serve DB cache.
          </span>
        </div>

        {error ?
          <div
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 10,
              padding: "11px 15px",
              color: "#f87171",
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        : null}

        {loading ?
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 16,
              padding: "3.5rem 2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #334155",
                borderTopColor: "#6366f1",
                margin: "0 auto 16px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
              Generating flowchart from post title...
            </p>
          </div>
        : null}

        {chart && !loading ?
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "1.5rem 1.5rem 1rem",
              border: "1px solid #e2e8f0",
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  color: "#1e293b",
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {chart.title}
              </h2>
              {meta ?
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: meta.cached ? "#065f46" : "#1d4ed8",
                    background: meta.cached ? "#d1fae5" : "#dbeafe",
                    border: `1px solid ${meta.cached ? "#6ee7b7" : "#93c5fd"}`,
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {meta.cached ?
                    "Served from DB cache"
                  : `Generated via ${meta.source}`}
                </span>
              : null}
            </div>

            <FlowchartSVG chart={chart} />
            <Legend />

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <button
                onClick={() =>
                  navigator.clipboard.writeText(JSON.stringify(chart, null, 2))
                }
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Copy JSON
              </button>
              <button
                onClick={() => {
                  setChart(null);
                  setMeta(null);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        : null}

        {!chart && !loading && !error ?
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 12,
            }}
          >
            {[
              [
                "01",
                "Pick DB post",
                "Query is auto-loaded from selected post title",
              ],
              [
                "02",
                "Generate chart",
                "Backend creates chart from title if cache misses",
              ],
              [
                "03",
                "Save JSON",
                "Flowchart JSON is saved on the post document",
              ],
              [
                "04",
                "Reuse cache",
                "Next user gets DB JSON instead of provider call",
              ],
            ].map(([n, title, desc]) => (
              <div
                key={n}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    color: "#6366f1",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  {n}
                </div>
                <div
                  style={{
                    color: "#f1f5f9",
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}
                >
                  {desc}
                </div>
              </div>
            ))}
          </div>
        : null}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
