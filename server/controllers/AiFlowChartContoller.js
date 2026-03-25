const https = require("https");
const Post = require("../models/post");
const { GEMINI_API_KEY, GEMINI_MODEL } = require("../utils/config");

const SYSTEM_PROMPT = `You generate flowchart JSON from a user query.
Return only raw JSON, without markdown or explanation.

Schema:
{
  "title": "Short descriptive title",
  "nodes": [
    { "id": "n1", "type": "start", "label": "Start" },
    { "id": "n2", "type": "step", "label": "Action step" },
    { "id": "n3", "type": "decision", "label": "Question?" },
    { "id": "n4", "type": "step", "label": "Yes path action" },
    { "id": "n5", "type": "step", "label": "No path action" },
    { "id": "n6", "type": "end", "label": "End" }
  ],
  "edges": [
    { "from": "n1", "to": "n2", "label": "" },
    { "from": "n2", "to": "n3", "label": "" },
    { "from": "n3", "to": "n4", "label": "Yes" },
    { "from": "n3", "to": "n5", "label": "No" },
    { "from": "n4", "to": "n6", "label": "" },
    { "from": "n5", "to": "n6", "label": "" }
  ]
}

Rules:
- 6-10 nodes total
- Start with type "start" and end with type "end"
- Decision nodes must have exactly 2 outgoing edges labeled "Yes" and "No"
- Keep labels short and clear
- Return only the JSON object.`;

const MAX_TITLE_LEN = 60;
const FALLBACK_SIGNATURE_LABELS = [
  "Read post title",
  "Need deeper detail?",
  "Use direct answer path",
];
const GEMINI_RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["title", "nodes", "edges"],
  properties: {
    title: { type: "STRING" },
    nodes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["id", "type", "label"],
        properties: {
          id: { type: "STRING" },
          type: { type: "STRING" },
          label: { type: "STRING" },
        },
      },
    },
    edges: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["from", "to", "label"],
        properties: {
          from: { type: "STRING" },
          to: { type: "STRING" },
          label: { type: "STRING" },
        },
      },
    },
  },
};

const stripMarkdownFence = (text) => text.replace(/```json|```/gi, "").trim();

const normalizeQuotes = (text) =>
  text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00A0/g, " ");

const extractBalancedObject = (text) => {
  const start = text.indexOf("{");
  if (start === -1) return "";

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return "";
};

const fixJsonStrings = (text) => {
  let output = "";
  let inString = false;
  let escape = false;

  const nextNonWs = (idx) => {
    for (let i = idx; i < text.length; i += 1) {
      if (!/\s/.test(text[i])) return text[i];
    }
    return "";
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        output += ch;
        escape = false;
        continue;
      }

      if (ch === "\\") {
        output += ch;
        escape = true;
        continue;
      }

      if (ch === '"') {
        const next = nextNonWs(i + 1);
        if (next === "," || next === "}" || next === "]" || next === "") {
          output += ch;
          inString = false;
          continue;
        }

        output += '\\"';
        continue;
      }

      if (ch === "\n" || ch === "\r") {
        output += "\\n";
        continue;
      }

      output += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      output += ch;
      continue;
    }

    output += ch;
  }

  if (inString) {
    output += '"';
  }

  return output;
};

const insertMissingCommas = (text) => {
  let output = "";
  let inString = false;
  let escape = false;
  let lastNonWs = "";

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      output += ch;
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
        lastNonWs = '"';
      }
      continue;
    }

    if (ch === '"') {
      if (
        lastNonWs &&
        lastNonWs !== "{" &&
        lastNonWs !== "[" &&
        lastNonWs !== "," &&
        lastNonWs !== ":"
      ) {
        output = output.replace(/\s*$/, "");
        output += ",";
      }
      inString = true;
      output += ch;
      continue;
    }

    output += ch;
    if (!/\s/.test(ch)) {
      lastNonWs = ch;
    }
  }

  return output;
};

const repairJson = (text) => {
  let candidate = normalizeQuotes(stripMarkdownFence(text));
  const balanced = extractBalancedObject(candidate);
  if (balanced) {
    candidate = balanced;
  }

  candidate = fixJsonStrings(candidate);
  candidate = candidate.replace(/,\s*([}\]])/g, "$1");
  candidate = candidate.replace(/}\s*{/g, "},{");
  candidate = candidate.replace(/]\s*{/g, "],{");
  candidate = candidate.replace(/}\s*]/g, "},]");
  candidate = insertMissingCommas(candidate);

  return candidate;
};

const safeParseJson = (rawText) => {
  const cleaned = stripMarkdownFence(rawText);

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const repaired = repairJson(cleaned);
    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw new Error(repairError.message || "Could not parse JSON response.");
    }
  }
};

const clampTitle = (title) => title.slice(0, MAX_TITLE_LEN).trim();

const normalizeChart = (chart, query) => {
  if (!chart || typeof chart !== "object") return null;

  const nodes = Array.isArray(chart.nodes) ? chart.nodes : [];
  const edges = Array.isArray(chart.edges) ? chart.edges : [];
  const title = clampTitle(String(chart.title || query || "Post flowchart"));

  if (!nodes.length || !edges.length) return null;

  const normalizedNodes = nodes
    .map((node, index) => ({
      id: String(node.id || `n${index + 1}`),
      type: String(node.type || "step").toLowerCase(),
      label: String(node.label || "").slice(0, 64) || `Step ${index + 1}`,
    }))
    .filter((node) => node.id && node.label);

  const nodeIds = new Set(normalizedNodes.map((node) => node.id));
  const normalizedEdges = edges
    .map((edge) => ({
      from: String(edge.from || ""),
      to: String(edge.to || ""),
      label: String(edge.label || ""),
    }))
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));

  if (!normalizedNodes.length || !normalizedEdges.length) return null;

  return {
    title,
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
};

const isTemplateFallbackChart = (chart) => {
  if (!chart || !Array.isArray(chart.nodes)) return false;
  const labels = new Set(chart.nodes.map((node) => node.label));
  return FALLBACK_SIGNATURE_LABELS.every((label) => labels.has(label));
};

const extractRawTextFromPayload = (payload) => {
  const candidate = payload?.candidates?.[0];
  if (!candidate) {
    const blockReason =
      payload?.promptFeedback?.blockReason || "No candidates returned.";
    throw new Error(`Gemini returned no candidate content (${blockReason}).`);
  }

  const parts =
    Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
  const rawText = parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();

  if (!rawText) {
    const finishReason = candidate.finishReason || "UNKNOWN";
    throw new Error(
      `Gemini returned empty text content (finishReason: ${finishReason}).`,
    );
  }

  return rawText;
};

const callGeminiModel = (model, query, attempt = "schema") =>
  new Promise((resolve, reject) => {
    const strictQuery =
      attempt === "strict" ?
        `Generate a process flowchart for this query:\n${query}\n\nReturn only valid JSON object with keys title, nodes, edges. Use double quotes for all strings. Do not include extra text.`
      : query;

    const body = JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [
            {
              text: strictQuery,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: attempt === "strict" ? 0 : 0.2,
        topP: attempt === "strict" ? 0.1 : 0.8,
        topK: attempt === "strict" ? 1 : 40,
        maxOutputTokens: 1200,
        responseMimeType: "application/json",
        responseSchema: GEMINI_RESPONSE_SCHEMA,
      },
    });

    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/${encodeURIComponent(
          model,
        )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          let payload = null;
          try {
            payload = JSON.parse(responseBody || "{}");
          } catch (_error) {
            payload = {};
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            const providerMsg =
              payload?.error?.message ||
              `Gemini request failed (${res.statusCode}).`;
            reject(new Error(providerMsg));
            return;
          }

          try {
            const rawText = extractRawTextFromPayload(payload);

            const parsed = safeParseJson(rawText);
            const normalized = normalizeChart(parsed, query);
            if (!normalized) {
              reject(new Error("Gemini returned invalid flowchart JSON."));
              return;
            }

            resolve(normalized);
          } catch (error) {
            reject(new Error(`Gemini parsing failed: ${error.message}`));
          }
        });
      },
    );

    req.on("error", (error) => reject(error));
    req.write(body);
    req.end();
  });

const generateFromGemini = async (query) => {
  const models = [
    GEMINI_MODEL,
    "gemini-2.0-flash",
    // "gemini-1.5-flash",
    // "gemini-1.5-pro",
  ].filter(Boolean);

  let lastError = null;

  for (const model of models) {
    for (const attempt of ["schema", "strict"]) {
      try {
        return await callGeminiModel(model, query, attempt);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error("Gemini request failed.");
};

const generatePostFlowchart = async (req, res) => {
  const { id } = req.params;

  const post = await Post.findById(id).select("title flowchart");
  if (!post) {
    return res
      .status(404)
      .send({ message: `Post with ID: '${id}' does not exist in database.` });
  }

  const query = (post.title || "").trim();
  if (!query) {
    return res.status(400).send({ message: "Post title is empty." });
  }

  const cachedChart = post.flowchart?.chart;
  const isCachedForCurrentTitle =
    post.flowchart?.sourceTitle === query && cachedChart?.nodes?.length > 0;
  const cachedIsTemplateFallback = isTemplateFallbackChart(cachedChart);

  if (isCachedForCurrentTitle && !cachedIsTemplateFallback) {
    return res.status(200).json({
      cached: true,
      source: "db",
      query,
      chart: cachedChart,
      generatedAt: post.flowchart.generatedAt,
    });
  }

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .send({ message: "Missing GEMINI_API_KEY in server environment." });
  }

  let chart = null;
  try {
    chart = await generateFromGemini(query);
  } catch (error) {
    return res
      .status(502)
      .send({ message: `Gemini generation failed: ${error.message}` });
  }

  post.flowchart = {
    sourceTitle: query,
    chart,
    generatedAt: new Date(),
  };
  await post.save();

  return res.status(200).json({
    cached: false,
    source: "gemini",
    query,
    chart,
    generatedAt: post.flowchart.generatedAt,
  });
};

module.exports = {
  generatePostFlowchart,
};
