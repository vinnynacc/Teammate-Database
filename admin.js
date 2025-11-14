// admin.js
(() => {
  const OWNER = "vinnynacc";
  const REPO  = "Teammate-Database";
  const BRANCH = "main";
  const FILE_PATH = "data/team.json";

  const $ = (s, r=document) => r.querySelector(s);
  const tokenInput = $("#ghToken");
  const tokenStatus = $("#tokenStatus");
  const saveBtn = $("#saveToken");
  const clearBtn = $("#clearToken");
  const form = $("#newTeammate");
  const statusEl = $("#status");

  // Load/save token locally (browser only)
  const TOKEN_KEY = "teammate-db-pat";
  function getToken(){ return localStorage.getItem(TOKEN_KEY) || ""; }
  function setToken(v){ v ? localStorage.setItem(TOKEN_KEY,v) : localStorage.removeItem(TOKEN_KEY); }
  function paintTokenStatus(){
    const has = !!getToken();
    tokenStatus.textContent = has ? "Token saved in this browser." : "No token saved.";
    tokenStatus.className = has ? "ok" : "warn";
  }
  tokenInput.value = getToken();
  paintTokenStatus();

  saveBtn.addEventListener("click", () => {
    setToken(tokenInput.value.trim());
    paintTokenStatus();
  });
  clearBtn.addEventListener("click", () => {
    setToken("");
    tokenInput.value = "";
    paintTokenStatus();
  });

  function headers(){
    const t = getToken();
    if(!t) throw new Error("No token. Paste it and click Save token.");
    return {
      "Authorization": `token ${t}`,
      "Accept": "application/vnd.github+json"
    };
  }

  async function getCurrentFile(){
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: headers() });
    if(!res.ok){
      const msg = await res.text();
      throw new Error(`Fetch team.json failed: ${res.status} ${msg}`);
    }
    const json = await res.json();
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(json.content), c => c.charCodeAt(0))));
    return { sha: json.sha, data: decoded };
  }

  function base64(str){
    // btoa handles ASCII; use TextEncoder for UTF-8 safety
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin);
  }

  function normalizeStates(raw){
    if(!raw) return [];
    return raw
      .split(/[, ]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
  }

  function normalizeNMLS(raw){
    if(!raw) return "";
    const v = String(raw).trim();
    return v.startsWith("NMLS#") ? v : `NMLS#${v}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Working…";
    statusEl.className = "muted";
    try{
      const formData = new FormData(form);
      const entry = {
        // "order" is computed from existing file
        slug: formData.get("slug").trim(),
        name: formData.get("name").trim(),
        role: formData.get("role"),
        jobTitle: formData.get("jobTitle")?.trim() || "",
        nmls: normalizeNMLS(formData.get("nmls")?.trim() || ""),
        phone: formData.get("phone")?.trim() || "",
        email: formData.get("email")?.trim() || "",
        photoFile: formData.get("photoFile").trim(),
        states: normalizeStates(formData.get("states")?.trim() || ""),
        links: {
          apply: formData.get("apply")?.trim() || "",
          calendly: formData.get("calendly")?.trim() || "",
          linkedin: formData.get("linkedin")?.trim() || "",
          reviews: formData.get("reviews")?.trim() || "",
          personalSite: formData.get("personalSite")?.trim() || ""
        }
      };

      // 1) get current file + sha
      const { sha, data } = await getCurrentFile();

      // 2) compute order = max(order)+1 (fallback: length+1)
      const maxOrder = data.reduce((m, t) => Math.max(m, Number(t.order||0)), 0);
      entry.order = (isFinite(maxOrder) ? maxOrder : data.length) + 1;

      // 3) append and commit
      const updated = [...data, entry];
      const body = {
        message: `Add teammate: ${entry.name} (${entry.slug})`,
        content: base64(JSON.stringify(updated, null, 2)),
        sha,
        branch: BRANCH
      };

      const putUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
      const putRes = await fetch(putUrl, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if(!putRes.ok){
        const msg = await putRes.text();
        throw new Error(`Commit failed: ${putRes.status} ${msg}`);
      }

      statusEl.textContent = "Teammate added and committed to main ✅";
      statusEl.className = "ok";
      form.reset();
    }catch(err){
      statusEl.textContent = err.message || String(err);
      statusEl.className = "err";
    }
  });
})();
