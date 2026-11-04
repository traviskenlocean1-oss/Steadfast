// Paragon's video lightbox drives a Vimeo iframe through Vimeo.Player. Steadfast's films are local MP4s, so the build
// swaps the iframe for a <video> and this stand-in gives it the same small API (on/play/pause/setVolume/setCurrentTime/unload).
window.Vimeo = {
  Player: class {
    constructor(video) { this.v = video; }
    on(event, fn) { this.v.addEventListener(event, fn); }
    ready() { return Promise.resolve(); }
    play() { return this.v.play().catch(() => {}); }
    pause() { this.v.pause(); return Promise.resolve(); }
    setVolume(x) { this.v.volume = x; this.v.muted = x === 0; return Promise.resolve(); }
    setCurrentTime(t) { try { this.v.currentTime = t; } catch (e) {} return Promise.resolve(); }
    unload() { this.v.pause(); return Promise.resolve(); }
  },
};
