const CORRECT_PIN = "199199";
const PIN_LENGTH = 6;
const SESSION_KEY = "copy-paster-unlocked";

const $ = (id) => document.getElementById(id);

let unlockPromise = null;

export function waitForUnlock() {
  if (!unlockPromise) {
    unlockPromise = sessionStorage.getItem(SESSION_KEY) === "1"
      ? Promise.resolve(revealApp())
      : startPinEntry();
  }
  return unlockPromise;
}

function revealApp() {
  document.body.classList.remove("is-locked");
  $("app").classList.remove("hidden");
  $("pin-lock").classList.add("hidden");
}

function startPinEntry() {
  return new Promise((resolve) => {
    const overlay = $("pin-lock");
    const dotsEl = $("pin-dots");
    const dots = [...dotsEl.querySelectorAll(".pin-dot")];
    const statusEl = $("pin-status");
    const keypad = overlay.querySelector(".pin-keypad");

    let value = "";
    let busy = false;

    function renderDots() {
      dots.forEach((dot, i) => {
        dot.classList.toggle("pin-dot--filled", i < value.length);
      });
    }

    function setStatus(message, isSuccess = false) {
      statusEl.textContent = message;
      statusEl.classList.toggle("pin-lock__status--success", isSuccess);
    }

    function haptic(pattern) {
      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    }

    function resetEntry() {
      value = "";
      renderDots();
    }

    function finishUnlock() {
      revealApp();
      overlay.classList.remove("pin-lock--exit");
      window.removeEventListener("keydown", onKeyDown);
      resolve();
    }

    function unlock() {
      sessionStorage.setItem(SESSION_KEY, "1");
      dotsEl.classList.add("pin-dots--success");
      setStatus("Unlocked", true);
      haptic(15);
      document.body.classList.remove("is-locked");
      $("app").classList.remove("hidden");

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        finishUnlock();
        return;
      }

      overlay.classList.add("pin-lock--exit");
      let finished = false;
      const once = () => {
        if (finished) return;
        finished = true;
        finishUnlock();
      };
      overlay.addEventListener("animationend", once, { once: true });
      window.setTimeout(once, 400);
    }

    function reject() {
      busy = true;
      dotsEl.classList.add("pin-dots--error");
      setStatus("Wrong PIN. Try again.");
      haptic([40, 40, 40]);

      window.setTimeout(() => {
        dotsEl.classList.remove("pin-dots--error");
        resetEntry();
        setStatus("");
        busy = false;
      }, 450);
    }

    function appendDigit(digit) {
      if (busy || value.length >= PIN_LENGTH) return;
      value += digit;
      renderDots();
      haptic(8);

      if (value.length === PIN_LENGTH) {
        busy = true;
        window.setTimeout(() => {
          if (value === CORRECT_PIN) {
            unlock();
          } else {
            reject();
          }
        }, 80);
      }
    }

    function deleteDigit() {
      if (busy || value.length === 0) return;
      value = value.slice(0, -1);
      renderDots();
      setStatus("");
    }

    function onKeyDown(event) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key >= "0" && event.key <= "9") {
        event.preventDefault();
        appendDigit(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        deleteDigit();
      }
    }

    keypad.addEventListener("click", (event) => {
      const key = event.target.closest(".pin-key");
      if (!key || key.classList.contains("pin-key--spacer")) return;

      if (key.dataset.action === "delete") {
        deleteDigit();
        return;
      }

      if (key.dataset.digit) {
        appendDigit(key.dataset.digit);
      }
    });

    window.addEventListener("keydown", onKeyDown);
    renderDots();
  });
}

waitForUnlock();
