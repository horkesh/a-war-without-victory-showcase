export function installLightbox(root = document) {
  const dialog = root.querySelector("#media-lightbox");
  if (!dialog || dialog.dataset.lightboxReady === "true") return;

  const triggers = [...root.querySelectorAll("[data-lightbox]")];
  const stage = dialog.querySelector("[data-lightbox-stage]");
  const title = dialog.querySelector("#lightbox-title");
  const counter = dialog.querySelector("[data-lightbox-counter]");
  const previous = dialog.querySelector("[data-lightbox-prev]");
  const next = dialog.querySelector("[data-lightbox-next]");
  const close = dialog.querySelector("[data-lightbox-close]");
  let activeGroup = [];
  let activeIndex = 0;
  let opener = null;

  dialog.dataset.lightboxReady = "true";

  const clearStage = () => {
    const video = stage.querySelector("video");
    try { video?.pause(); } catch { /* Media playback may be unavailable in tests. */ }
    stage.replaceChildren();
  };

  const render = () => {
    const trigger = activeGroup[activeIndex];
    const kind = trigger.dataset.lightbox;
    const src = trigger.getAttribute("href") || trigger.dataset.lightboxSrc;
    const label = trigger.dataset.lightboxTitle || "Media preview";
    clearStage();

    if (kind === "video") {
      const video = root.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      const sources = [
        [trigger.dataset.lightboxMp4, "video/mp4"],
        [src, "video/webm"],
      ];
      for (const [sourceUrl, sourceType] of sources) {
        if (!sourceUrl) continue;
        const source = root.createElement("source");
        source.src = sourceUrl;
        source.type = sourceType;
        video.append(source);
      }
      if (trigger.dataset.lightboxPoster) video.setAttribute("poster", trigger.dataset.lightboxPoster);
      video.setAttribute("aria-label", label);
      stage.append(video);
    } else {
      const image = root.createElement("img");
      image.src = src;
      image.alt = label;
      stage.append(image);
    }

    title.textContent = label;
    counter.textContent = `${activeIndex + 1} / ${activeGroup.length}`;
    previous.hidden = activeGroup.length < 2;
    next.hidden = activeGroup.length < 2;
  };

  const open = (trigger) => {
    const groupName = trigger.dataset.lightboxGroup || "default";
    activeGroup = triggers.filter((item) => (item.dataset.lightboxGroup || "default") === groupName);
    activeIndex = Math.max(0, activeGroup.indexOf(trigger));
    opener = trigger;
    render();
    root.body?.classList.add("lightbox-open");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    close?.focus();
  };

  const move = (offset) => {
    if (activeGroup.length < 2) return;
    activeIndex = (activeIndex + offset + activeGroup.length) % activeGroup.length;
    render();
  };

  for (const trigger of triggers) {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(trigger);
    });
  }

  previous?.addEventListener("click", () => move(-1));
  next?.addEventListener("click", () => move(1));
  close?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    clearStage();
    root.body?.classList.remove("lightbox-open");
    opener?.focus();
  });
  root.addEventListener("keydown", (event) => {
    if (!dialog.hasAttribute("open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => installLightbox());
  } else {
    installLightbox();
  }
}
