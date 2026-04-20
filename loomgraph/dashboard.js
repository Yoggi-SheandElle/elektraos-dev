const API = (typeof window !== "undefined" && window.LOOMGRAPH_API) || "";
const TENANT = "yossra";
const KEY_STORE = "loomgraph.key";

const GEO_CACHE = {};
const HUB = { lat: 51.47, lng: -0.45, city: "Fly.io LHR" };

function fallbackGeo(domain) {
  if (domain.endsWith(".ma")) return { lat: 33.57, lng: -7.59, city: "Morocco" };
  if (domain.endsWith(".co.uk") || domain.endsWith(".uk")) return { lat: 51.51, lng: -0.128, city: "UK" };
  if (domain.endsWith(".fr")) return { lat: 48.86, lng: 2.35, city: "France" };
  if (domain.endsWith(".dev")) return { lat: 37.77, lng: -122.42, city: "US (GitHub Pages)" };
  return { lat: 40.71, lng: -74.0, city: "Global" };
}

const $ = (id) => document.getElementById(id);
const state = {
  sites: [], approvals: [], edges: [],
  selected: null, globe: null, started: Date.now(),
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "onclick") node.onclick = v;
    else if (k.startsWith("data-")) node.setAttribute(k, v);
    else node.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function log(kind, msg) {
  const t = new Date().toTimeString().slice(0, 8);
  const line = el("div", { class: "log-line" }, [
    el("span", { class: "log-time" }, [t]),
    el("span", { class: `log-${kind}` }, [msg]),
  ]);
  $("activity-log").prepend(line);
  const lines = $("activity-log").children;
  while (lines.length > 50) $("activity-log").removeChild(lines[lines.length - 1]);
}

function geoFor(domain) {
  return GEO_CACHE[domain] || fallbackGeo(domain);
}

async function loadGeoForSite(site) {
  if (GEO_CACHE[site.domain]) return;
  try {
    const g = await api(`/sites/${site.id}/geo`);
    if (g && g.lat != null && g.lng != null) {
      GEO_CACHE[site.domain] = {
        lat: g.lat, lng: g.lng,
        city: [g.city, g.country].filter(Boolean).join(", ") || "Unknown",
        ip: g.ip, org: g.org,
      };
    } else {
      GEO_CACHE[site.domain] = fallbackGeo(site.domain);
    }
  } catch {
    GEO_CACHE[site.domain] = fallbackGeo(site.domain);
  }
}

function authKey() { return sessionStorage.getItem(KEY_STORE); }
function setAuthKey(k) {
  if (k) sessionStorage.setItem(KEY_STORE, k);
  else sessionStorage.removeItem(KEY_STORE);
  updateAuthHint();
}
function updateAuthHint() {
  const k = authKey();
  $("btn-auth").textContent = k ? "lock" : "authenticate";
  $("auth-hint").textContent = k ? "authenticated - approve/reject enabled" : "read-only - click authenticate to approve";
}

async function api(path, opts = {}) {
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  const k = authKey();
  if (k) headers["X-Loomgraph-Key"] = k;
  const r = await fetch(API + path, { ...opts, headers });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function loadSites() {
  state.sites = await api(`/sites?tenant_id=${TENANT}`);
  $("stat-sites").textContent = state.sites.length;
  $("sites-count").textContent = state.sites.length;
  renderSitesList();
}
async function loadApprovals() {
  state.approvals = await api("/approvals/pending");
  $("stat-pending").textContent = state.approvals.length;
  $("approvals-count").textContent = state.approvals.length;
  renderApprovals();
}
async function loadEdges() {
  let all = [];
  for (const s of state.sites) {
    try {
      const es = await api(`/graph/edges/${s.id}?limit=100`);
      all = all.concat(es.map((e) => ({ ...e, source_site_id: s.id })));
    } catch {}
  }
  state.edges = all;
  $("stat-edges").textContent = all.length;
}

function statusClass(s) {
  if (s.status === "onboarding") return "onboarding";
  if (s.last_score != null && s.last_score >= 0.7) return "healthy";
  return "stale";
}

function renderSitesList() {
  const ul = $("sites-list");
  clear(ul);
  state.sites.forEach((s) => {
    const meta = [
      el("span", { class: `site-status ${statusClass(s)}` }, [s.status]),
      el("span", { class: "mono" }, [`id=${s.id}`]),
    ];
    if (s.last_score != null) {
      meta.push(el("span", { class: "mono" }, [`score=${(s.last_score * 100).toFixed(0)}`]));
    }
    const li = el("li", {
      class: "site-item" + (state.selected === s.id ? " active" : ""),
      onclick: () => selectSite(s.id),
    }, [
      el("div", { class: "site-domain" }, [s.domain]),
      el("div", { class: "site-meta" }, meta),
    ]);
    ul.appendChild(li);
  });
}

function renderApprovals() {
  const ul = $("approvals-list");
  clear(ul);
  if (state.approvals.length === 0) {
    ul.appendChild(el("li", {
      style: "padding:20px;text-align:center;color:var(--text-faint);font-size:11px;",
    }, ["no pending approvals"]));
    return;
  }
  state.approvals.forEach((a) => {
    const li = el("li", { class: "approval-item" }, [
      el("div", { class: "approval-top" }, [
        el("span", { class: "approval-agent" }, [String(a.agent_name || "")]),
        el("span", { class: "approval-change mono" }, [String(a.change_type || "")]),
      ]),
      el("div", { class: "approval-rationale" }, [a.rationale || "(no rationale)"]),
      el("div", { class: "approval-actions" }, [
        el("button", { class: "btn btn-approve", onclick: () => decide(a.id, "approve") }, ["approve"]),
        el("button", { class: "btn btn-reject",  onclick: () => decide(a.id, "reject") }, ["reject"]),
      ]),
    ]);
    ul.appendChild(li);
  });
}

async function decide(id, kind) {
  if (!authKey()) { openAuthModal(); return; }
  try {
    await api(`/approvals/${id}/${kind}`, { method: "POST", body: JSON.stringify({ decided_by: "dashboard" }) });
    log("ok", `${kind} approval ${id}`);
    await loadApprovals();
  } catch (e) {
    log("err", `${kind} ${id} failed: ${e.message}`);
  }
}

function selectSite(id) {
  state.selected = id;
  renderSitesList();
  const s = state.sites.find((x) => x.id === id);
  if (s && state.globe) {
    const g = geoFor(s.domain);
    state.globe.pointOfView({ lat: g.lat, lng: g.lng, altitude: 1.4 }, 1200);
  }
}

function buildGlobe() {
  const el0 = $("globe");
  const globe = Globe()(el0)
    .globeImageUrl("https://unpkg.com/three-globe@2.31.0/example/img/earth-night.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe@2.31.0/example/img/earth-topology.png")
    .backgroundColor("rgba(0,0,0,0)")
    .atmosphereColor("#00e5ff")
    .atmosphereAltitude(0.22)
    .showAtmosphere(true);

  globe.pointsData([])
    .pointAltitude(0.04)
    .pointRadius(0.5)
    .pointColor((p) => p.isHub ? "#ff3df5" : "#00e5ff")
    .pointLabel(() => "")
    .onPointClick((p) => { if (p && p.siteId) selectSite(p.siteId); })
    .onPointHover(showTooltip);

  globe.ringsData([])
    .ringColor(() => (t) => `rgba(0, 229, 255, ${1 - t})`)
    .ringMaxRadius(4)
    .ringPropagationSpeed(2)
    .ringRepeatPeriod(1500);

  globe.arcsData([])
    .arcColor(() => ["rgba(0, 229, 255, 0.0)", "rgba(0, 229, 255, 0.8)", "rgba(255, 61, 245, 0.8)"])
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(2600)
    .arcStroke(0.35)
    .arcAltitudeAutoScale(0.4);

  const controls = globe.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.enableDamping = true;

  const resize = () => globe.width(el0.clientWidth).height(el0.clientHeight);
  window.addEventListener("resize", resize);
  resize();

  globe.pointOfView({ lat: 40, lng: -10, altitude: 2.2 });
  return globe;
}

function showTooltip(pt) {
  const tt = $("tooltip");
  if (!pt) { tt.classList.remove("visible"); return; }
  clear(tt);
  tt.appendChild(el("div", { class: "tt-domain" }, [String(pt.label || "")]));
  const rows = [
    ["type", pt.isHub ? "hub" : "site"],
    ["location", String(pt.city || "")],
  ];
  if (pt.status) rows.push(["status", String(pt.status)]);
  if (pt.score != null) rows.push(["score", (pt.score * 100).toFixed(0)]);
  if (pt.ip) rows.push(["ip", String(pt.ip)]);
  if (pt.org) rows.push(["host", String(pt.org)]);
  for (const [k, v] of rows) {
    tt.appendChild(el("div", { class: "tt-row" }, [
      el("span", {}, [k]),
      el("b", {}, [v]),
    ]));
  }
  tt.classList.add("visible");
  const c = state.globe.getScreenCoords(pt.lat, pt.lng, pt.alt || 0.04);
  if (c) {
    const rect = $("globe").getBoundingClientRect();
    tt.style.left = (rect.left + c.x + 16) + "px";
    tt.style.top  = (rect.top + c.y - 20) + "px";
  }
}

function renderGlobe() {
  if (!state.globe) return;
  const hubPoint = { ...HUB, label: "loomgraph.fly.dev", isHub: true };
  const sitePoints = state.sites.map((s) => {
    const g = geoFor(s.domain);
    return {
      lat: g.lat, lng: g.lng, city: g.city,
      label: s.domain, siteId: s.id, status: s.status, score: s.last_score,
      ip: g.ip, org: g.org,
    };
  });
  state.globe.pointsData([hubPoint, ...sitePoints]);
  state.globe.ringsData([{ ...HUB }, ...sitePoints]);
  const arcs = sitePoints.map((p) => ({
    startLat: HUB.lat, startLng: HUB.lng, endLat: p.lat, endLng: p.lng,
  }));
  state.globe.arcsData(arcs);
}

function openAuthModal() { $("auth-modal").classList.remove("hidden"); $("auth-key").focus(); }
function closeAuthModal() { $("auth-modal").classList.add("hidden"); $("auth-key").value = ""; }

async function refreshAll() {
  try {
    await loadSites();
    await Promise.all(state.sites.map(loadGeoForSite));
    await loadApprovals();
    await loadEdges();
    renderGlobe();
    log("info", `refreshed: ${state.sites.length} sites, ${state.approvals.length} pending`);
  } catch (e) {
    log("err", `refresh failed: ${e.message}`);
  }
}

function tickUptime() {
  const s = Math.floor((Date.now() - state.started) / 1000);
  const m = Math.floor(s / 60);
  $("stat-uptime").textContent = m < 1 ? `${s}s` : `${m}m`;
}

async function init() {
  log("info", "boot");
  state.globe = buildGlobe();
  updateAuthHint();

  $("btn-refresh").onclick = refreshAll;
  $("btn-auth").onclick = () => {
    if (authKey()) { setAuthKey(null); log("info", "locked"); }
    else openAuthModal();
  };
  $("auth-cancel").onclick = closeAuthModal;
  $("auth-submit").onclick = () => {
    const k = $("auth-key").value.trim();
    if (k) { setAuthKey(k); log("ok", "authenticated"); closeAuthModal(); }
  };
  $("auth-key").addEventListener("keydown", (e) => { if (e.key === "Enter") $("auth-submit").click(); });

  await refreshAll();
  setInterval(refreshAll, 30000);
  setInterval(tickUptime, 1000);
}

init();
