// Page through the two introductory sections. Keep native scrolling inside tall sections.
(() => {
  const reports = document.querySelector("#reports");
  const research = document.querySelector("#research");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const edge = 8;
  let wheelTarget = null;
  let turnStarted = -Infinity;
  let wheelDirection = 0;
  let lastWheel = -Infinity;
  let touch = null;

  function nextStop(direction) {
    const y = window.scrollY;
    const reportsTop = reports.getBoundingClientRect().top + y;
    const researchTop = research.getBoundingClientRect().top + y;
    if (direction > 0) {
      const next = y < reportsTop - edge ? reportsTop : researchTop;
      if (y < next - edge && next <= y + document.documentElement.clientHeight + edge) return next;
    } else {
      if (Math.abs(y - researchTop) <= edge) return reportsTop;
      if (Math.abs(y - reportsTop) <= edge) return 0;
    }
    return null;
  }

  function turn(top) {
    window.scrollTo({ top, behavior: reducedMotion.matches ? "instant" : "smooth" });
  }

  function nativeGesture(event) {
    return event.defaultPrevented || document.querySelector("dialog[open]") ||
      event.target.closest?.("video, input, select, textarea, [contenteditable=true]");
  }

  window.addEventListener("wheel", event => {
    if (!event.cancelable || event.ctrlKey || event.shiftKey || nativeGesture(event) ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const direction = Math.sign(event.deltaY);
    const now = performance.now();
    const tail = direction === wheelDirection && now - lastWheel < 180;
    lastWheel = now;
    if (tail || (wheelTarget !== null && direction === wheelDirection &&
        Math.abs(window.scrollY - wheelTarget) > edge && now - turnStarted < 900)) {
      event.preventDefault();
      return;
    }
    wheelDirection = 0;
    wheelTarget = null;
    const top = nextStop(direction);
    if (top === null) return;
    event.preventDefault();
    wheelDirection = direction;
    wheelTarget = top;
    turnStarted = now;
    turn(top);
  }, { passive: false });

  window.addEventListener("touchstart", event => {
    touch = null;
    if (event.touches.length !== 1 || nativeGesture(event)) return;
    const point = event.touches[0];
    const reportsY = reports.getBoundingClientRect().top;
    let shortcut = null;
    if (window.scrollY <= edge) shortcut = reports;
    else if (Math.abs(reportsY) <= edge) shortcut = research;
    touch = { x: point.clientX, y: point.clientY, up: nextStop(-1), down: nextStop(1),
      shortcut, started: performance.now(), turned: false };
  }, { passive: true });

  window.addEventListener("touchmove", event => {
    if (!touch || !event.cancelable || event.touches.length !== 1) return;
    const dx = touch.x - event.touches[0].clientX;
    const dy = touch.y - event.touches[0].clientY;
    if (Math.abs(dx) >= Math.abs(dy)) return;
    const top = dy > 0 ? touch.down : touch.up;
    if (top === null) return;
    event.preventDefault();
    if (!touch.turned && Math.abs(dy) >= 16) {
      touch.turned = true;
      turn(top);
    }
  }, { passive: false });

  // On a tall mobile chapter, a short flick at its start advances; a longer drag reads it.
  window.addEventListener("touchend", event => {
    if (touch?.shortcut && !touch.turned && event.touches.length === 0) {
      const point = event.changedTouches[0];
      const dy = touch.y - point.clientY;
      if (dy >= 16 && dy <= 72 && dy > Math.abs(touch.x - point.clientX) &&
          performance.now() - touch.started < 550) {
        if (event.cancelable) event.preventDefault();
        const section = touch.shortcut;
        requestAnimationFrame(() => turn(section.getBoundingClientRect().top + window.scrollY));
      }
    }
    touch = null;
  }, { passive: false });
  window.addEventListener("touchcancel", () => { touch = null; }, { passive: true });
})();
