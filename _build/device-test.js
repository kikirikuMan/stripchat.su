(() => {
  'use strict';
  const box = document.querySelector('[data-device-test]');
  if (!box) return;
  const messages = JSON.parse(box.querySelector('[data-messages]').textContent);
  const start = box.querySelector('[data-start]');
  const stop = box.querySelector('[data-stop]');
  const status = box.querySelector('[data-status]');
  const video = box.querySelector('[data-preview]');
  const mirror = box.querySelector('[data-mirror]');
  const meter = box.querySelector('[data-meter]');
  const meterLabel = box.querySelector('[data-meter-label]');
  const settings = box.querySelector('[data-settings]');
  const audioOnly = box.dataset.deviceTest === 'audio';
  let stream = null;
  let context = null;
  let frame = 0;
  let generation = 0;
  let pending = false;

  function release(message) {
    generation += 1;
    pending = false;
    cancelAnimationFrame(frame);
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (context) context.close().catch(() => {});
    context = null;
    if (video) { video.srcObject = null; video.hidden = true; }
    if (meter) { meter.value = 0; meterLabel.hidden = true; }
    settings.textContent = '';
    settings.hidden = true;
    start.disabled = false;
    stop.disabled = true;
    if (message) status.textContent = message;
  }

  async function begin() {
    if (pending || stream) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      status.textContent = messages.unsupported;
      return;
    }
    pending = true;
    const request = ++generation;
    start.disabled = true;
    stop.disabled = false;
    status.textContent = messages.pending;
    try {
      const acquired = await navigator.mediaDevices.getUserMedia(audioOnly ? {audio: true, video: false} : {video: true, audio: false});
      // A late permission grant must not restart a stopped or hidden test.
      if (request !== generation || document.hidden) {
        acquired.getTracks().forEach(track => track.stop());
        return;
      }
      stream = acquired;
      pending = false;
      for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (request === generation) release(messages.stopped); }, {once: true});
      if (audioOnly) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('AudioContext unavailable');
        context = new AudioContext();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        context.createMediaStreamSource(stream).connect(analyser);
        // No connection to the speakers, recorder, storage or network.
        await context.resume();
        if (request !== generation) return;
        meterLabel.hidden = false;
        const samples = new Uint8Array(analyser.fftSize);
        const update = () => {
          if (request !== generation) return;
          analyser.getByteTimeDomainData(samples);
          let square = 0;
          for (const sample of samples) square += ((sample - 128) / 128) ** 2;
          meter.value = Math.min(100, Math.round(Math.sqrt(square / samples.length) * 250));
          frame = requestAnimationFrame(update);
        };
        update();
      } else {
        video.srcObject = stream;
        video.hidden = false;
        await video.play();
        if (request !== generation) return;
      }
      const track = stream.getTracks()[0];
      const values = track.getSettings();
      const details = [track.label];
      if (values.width && values.height) details.push(`${values.width} × ${values.height}`);
      if (!audioOnly && Number.isFinite(values.frameRate)) {
        const value = new Intl.NumberFormat(document.documentElement.lang, {maximumFractionDigits: 2}).format(values.frameRate);
        details.push(`${messages.configuredFrameRate}: ${value}`);
      }
      settings.textContent = `${messages.settings}: ${details.filter(Boolean).join(' · ')}`;
      settings.hidden = false;
      status.textContent = messages.active;
    } catch (error) {
      if (request !== generation) return;
      const key = {NotAllowedError:'denied', SecurityError:'denied', NotFoundError:'missing', NotReadableError:'busy', AbortError:'busy'}[error.name] || 'error';
      release(messages[key]);
    }
  }
  start.addEventListener('click', begin);
  if (mirror) mirror.addEventListener('change', () => video.classList.toggle('is-mirrored', mirror.checked));
  stop.addEventListener('click', () => release(messages.stopped));
  window.addEventListener('pagehide', () => release(messages.stopped));
  document.addEventListener('visibilitychange', () => { if (document.hidden && (pending || stream)) release(messages.stopped); });
})();
