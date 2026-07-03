const AI_MODELS = [
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", icon: "✨", primary: true },
  { id: "chatgpt-fallback", label: "ChatGPT (fallback provider)", icon: "🟢" },
  { id: "claude-fallback", label: "Claude (fallback provider)", icon: "🟠" },
  { id: "llama-meta-fallback", label: "Llama / Meta AI (gratis, fallback)", icon: "🦙" }
];

Pages.renderAI = function (root) {
  root.innerHTML = `
    <div class="chat-shell fade-in">
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-bar">
        <div class="chat-input-box">
          <div class="chat-model-row">
            <div class="dropdown-wrap" id="modelDropdown">
              <button class="model-select-btn" id="modelBtn">
                <span class="emoji" id="modelIcon">✨</span>
                <span id="modelLabel">Gemini 3.1 Flash Lite</span>
                <span>▾</span>
              </button>
              <div class="dropdown-panel" id="modelPanel"></div>
            </div>
            <button class="btn btn-sm" id="clearChatBtn">🗑️ Bersihkan</button>
          </div>

          <div class="file-previews" id="filePreviews"></div>

          <div class="chat-input-row">
            <div class="upload-wrap">
              <button class="chat-icon-btn" id="uploadBtn">📎</button>
              <div class="upload-menu" id="uploadMenu">
                <div class="dropdown-item" data-upload="image">🖼️ <span>Gambar</span></div>
                <div class="dropdown-item" data-upload="file">📄 <span>Semua File</span></div>
                <div class="dropdown-item" data-upload="folder">🗂️ <span>Folder (PC/Laptop)</span></div>
              </div>
              <input type="file" id="fileInputImage" accept="image/*" multiple style="display:none;" />
              <input type="file" id="fileInputAny" multiple style="display:none;" />
              <input type="file" id="fileInputFolder" webkitdirectory directory multiple style="display:none;" />
            </div>
            <textarea id="chatText" rows="1" data-i18n-placeholder="chat_placeholder" placeholder="Tulis pesan..."></textarea>
            <button class="chat-icon-btn send" id="sendBtn">🚀</button>
          </div>
        </div>
        <div class="drop-zone" id="dropZone" style="display:none;">📥 Lepaskan file di sini...</div>
      </div>
    </div>
  `;
  I18N.apply();

  const state = {
    history: JSON.parse(localStorage.getItem("machineapi_chat_history") || "[]"),
    files: [],
    model: AI_MODELS[0]
  };

  const messagesEl = document.getElementById("chatMessages");
  const modelPanel = document.getElementById("modelPanel");
  modelPanel.innerHTML = AI_MODELS.map((m) =>
    `<div class="dropdown-item" data-model="${m.id}"><span class="emoji">${m.icon}</span> <span>${m.label}</span></div>`
  ).join("");

  App.toggleDropdown("modelDropdown", "modelBtn");
  modelPanel.querySelectorAll("[data-model]").forEach((item) => {
    item.addEventListener("click", () => {
      const m = AI_MODELS.find((x) => x.id === item.dataset.model);
      state.model = m;
      document.getElementById("modelIcon").textContent = m.icon;
      document.getElementById("modelLabel").textContent = m.label;
      document.getElementById("modelDropdown").classList.remove("open");
    });
  });

  function renderHistory() {
    messagesEl.innerHTML = "";
    for (const turn of state.history) {
      appendMessage(turn.role, turn.text, turn.files || [], false);
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendMessage(role, text, files = [], animate = true) {
    const bubble = Utils.el("div", { class: `msg ${role}${animate ? " fade-in" : ""}` });
    if (files.length) {
      const fileRow = Utils.el("div", { class: "msg-files" });
      files.forEach((f) => fileRow.appendChild(Utils.el("span", { class: "msg-file-chip" }, `📎 ${f.name}`)));
      bubble.appendChild(fileRow);
    }
    bubble.appendChild(Utils.el("div", {}, text));
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  renderHistory();

  document.getElementById("clearChatBtn").addEventListener("click", () => {
    state.history = [];
    localStorage.removeItem("machineapi_chat_history");
    renderHistory();
    Utils.toast("🗑️ Riwayat chat dibersihkan");
  });

  const uploadBtn = document.getElementById("uploadBtn");
  const uploadMenu = document.getElementById("uploadMenu");
  uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    uploadMenu.classList.toggle("open");
  });
  document.addEventListener("click", () => uploadMenu.classList.remove("open"));

  document.querySelector('[data-upload="image"]').addEventListener("click", () => document.getElementById("fileInputImage").click());
  document.querySelector('[data-upload="file"]').addEventListener("click", () => document.getElementById("fileInputAny").click());
  document.querySelector('[data-upload="folder"]').addEventListener("click", () => document.getElementById("fileInputFolder").click());

  ["fileInputImage", "fileInputAny", "fileInputFolder"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => handleFiles(e.target.files));
  });

  const dropZone = document.getElementById("dropZone");
  window.addEventListener("dragover", (e) => { e.preventDefault(); dropZone.style.display = "block"; dropZone.classList.add("drag-over"); });
  window.addEventListener("dragleave", (e) => { if (e.clientY < 10) { dropZone.style.display = "none"; dropZone.classList.remove("drag-over"); } });
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.display = "none";
    dropZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
  });

  function renderFilePreviews() {
    const wrap = document.getElementById("filePreviews");
    wrap.innerHTML = "";
    state.files.forEach((f, idx) => {
      const item = Utils.el("div", { class: "file-preview-item" });
      if (f.mimeType?.startsWith("image/")) {
        item.appendChild(Utils.el("img", { src: `data:${f.mimeType};base64,${f.base64}` }));
      } else {
        item.textContent = f.name.slice(0, 10);
      }
      const removeBtn = Utils.el("button", {
        class: "file-preview-remove",
        onclick: () => { state.files.splice(idx, 1); renderFilePreviews(); }
      }, "✕");
      item.appendChild(removeBtn);
      wrap.appendChild(item);
    });
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        state.files.push({ name: file.name, mimeType: file.type || "application/octet-stream", base64 });
        renderFilePreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  const textarea = document.getElementById("chatText");
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
  });
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });
  document.getElementById("sendBtn").addEventListener("click", sendChat);

  async function sendChat() {
    const text = textarea.value.trim();
    if (!text && state.files.length === 0) return;

    const userFiles = [...state.files];
    appendMessage("user", text, userFiles);
    state.history.push({ role: "user", text, files: userFiles.map((f) => ({ name: f.name })) });

    textarea.value = "";
    textarea.style.height = "auto";
    state.files = [];
    renderFilePreviews();

    const typingBubble = Utils.el("div", { class: "msg assistant fade-in" });
    typingBubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    messagesEl.appendChild(typingBubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const { json } = await Utils.apiCall("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: state.history.slice(-20).map((h) => ({ role: h.role, text: h.text })),
        files: userFiles
      })
    });

    typingBubble.remove();

    const replyText = json.status ? json.result.text : `⚠️ ${json.error}`;
    appendMessage("assistant", replyText);
    state.history.push({ role: "assistant", text: replyText });

    localStorage.setItem("machineapi_chat_history", JSON.stringify(state.history.slice(-100)));
  }
};
