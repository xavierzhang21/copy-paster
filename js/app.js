import { waitForUnlock } from "./pin-lock.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

let firebaseConfig;
try {
  ({ firebaseConfig } = await import("./firebase-config.js"));
} catch {
  firebaseConfig = null;
}

const $ = (id) => document.getElementById(id);

const setupPanel = $("setup-panel");
const mainContent = $("main-content");
const pasteInput = $("paste-input");
const saveBtn = $("save-btn");
const saveStatus = $("save-status");
const clipList = $("clip-list");
const emptyState = $("empty-state");
const clipCount = $("clip-count");
const syncStatus = $("sync-status");
const deleteAllBtn = $("delete-all-btn");
const confirmModal = $("confirm-modal");
const confirmCancel = $("confirm-cancel");
const confirmDelete = $("confirm-delete");

let db = null;
let unsubscribe = null;

function clipsCollection() {
  return collection(db, "clips");
}

function formatTime(timestamp) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function flashStatus(message, isSuccess = false) {
  saveStatus.textContent = message;
  saveStatus.classList.toggle("status--success", isSuccess);
  if (message) {
    setTimeout(() => {
      saveStatus.textContent = "";
      saveStatus.classList.remove("status--success");
    }, 2500);
  }
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function renderClips(snapshots) {
  const docs = snapshots.docs;

  clipCount.textContent = `${docs.length} clip${docs.length === 1 ? "" : "s"}`;
  emptyState.classList.toggle("hidden", docs.length > 0);
  clipList.innerHTML = "";

  for (const snap of docs) {
    const data = snap.data();
    const text = data.text ?? "";
    const isLong = text.length > 300 || text.split("\n").length > 6;

    const li = document.createElement("li");
    li.className = "clip-item";
    li.innerHTML = `
      <div class="clip-item__header">
        <span class="clip-item__time">${escapeHtml(formatTime(data.createdAt))}</span>
        <div class="clip-item__actions">
          ${isLong ? '<button type="button" class="btn btn--ghost btn--small expand-btn">Expand</button>' : ""}
          <button type="button" class="btn btn--secondary btn--small copy-btn">Copy</button>
          <button type="button" class="btn btn--ghost btn--small delete-btn" title="Delete this clip">✕</button>
        </div>
      </div>
      <pre class="clip-item__body${isLong ? " clip-item__body--collapsed" : ""}">${escapeHtml(text)}</pre>
    `;

    const body = li.querySelector(".clip-item__body");
    const expandBtn = li.querySelector(".expand-btn");

    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const collapsed = body.classList.toggle("clip-item__body--collapsed");
        expandBtn.textContent = collapsed ? "Expand" : "Collapse";
      });
    }

    li.querySelector(".copy-btn").addEventListener("click", async () => {
      await copyToClipboard(text);
      const btn = li.querySelector(".copy-btn");
      const original = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = original;
      }, 1500);
    });

    li.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "clips", snap.id));
    });

    clipList.appendChild(li);
  }
}

function startListener() {
  if (unsubscribe) unsubscribe();

  const q = query(clipsCollection(), orderBy("createdAt", "desc"));

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      syncStatus.textContent = "Live";
      syncStatus.className = "sync-badge sync-badge--live";
      renderClips(snapshot);
    },
    (error) => {
      console.error("Firestore listener error:", error);
      syncStatus.textContent = "Sync error";
      syncStatus.className = "sync-badge sync-badge--error";
    }
  );
}

async function saveClip() {
  const text = pasteInput.value.trim();
  if (!text) {
    flashStatus("Nothing to save — paste some text first.");
    return;
  }

  saveBtn.disabled = true;
  try {
    await addDoc(clipsCollection(), {
      text,
      createdAt: serverTimestamp(),
    });
    pasteInput.value = "";
    flashStatus("Saved!", true);
  } catch (error) {
    console.error("Save error:", error);
    flashStatus("Failed to save. Check Firebase config and rules.");
  } finally {
    saveBtn.disabled = false;
  }
}

async function deleteAllClips() {
  confirmDelete.disabled = true;
  try {
    const snapshot = await getDocs(clipsCollection());
    await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, "clips", d.id))));
    confirmModal.classList.add("hidden");
  } catch (error) {
    console.error("Delete all error:", error);
    alert("Failed to delete. Check your connection and Firebase rules.");
  } finally {
    confirmDelete.disabled = false;
  }
}

function showSetupPanel() {
  setupPanel.classList.remove("hidden");
}

function bindEvents() {
  saveBtn.addEventListener("click", saveClip);

  pasteInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      saveClip();
    }
  });

  deleteAllBtn.addEventListener("click", () => {
    confirmModal.classList.remove("hidden");
  });

  confirmCancel.addEventListener("click", () => {
    confirmModal.classList.add("hidden");
  });

  confirmModal.querySelector(".modal__backdrop").addEventListener("click", () => {
    confirmModal.classList.add("hidden");
  });

  confirmDelete.addEventListener("click", deleteAllClips);
}

function init() {
  bindEvents();

  if (
    !firebaseConfig ||
    firebaseConfig.apiKey === "YOUR_API_KEY" ||
    !firebaseConfig.projectId
  ) {
    showSetupPanel();
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    mainContent.classList.remove("hidden");
    startListener();
  } catch (error) {
    console.error("Firebase init error:", error);
    showSetupPanel();
  }
}

waitForUnlock().then(init);
