/**
 * Web Audio API synthesizer for the Relax Zone.
 * Zero external audio files, works 100% offline, cross-browser safe.
 */

class RelaxAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private soundscapeNodes: {
    [key: string]: {
      source?: AudioNode;
      gain: GainNode;
      filter?: BiquadFilterNode;
      lfo?: OscillatorNode;
    };
  } = {};
  private activeWakeAlarm: { stop: () => void } | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /* ---------------------- Chimes & Alerts ---------------------- */

  /**
   * Plays a soothing crystalline singing-bowl chime (default 528Hz "Solfeggio" frequency).
   */
  playChime(frequency = 528, duration = 3.0) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const harmonics = [1, 2.01, 3.02, 4.05];
      const harmonicWeights = [0.6, 0.25, 0.1, 0.05];

      const chimeGain = ctx.createGain();
      chimeGain.gain.setValueAtTime(0.35, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      chimeGain.connect(this.masterGain || ctx.destination);

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency * h, now);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(harmonicWeights[i], now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(oscGain);
        oscGain.connect(chimeGain);

        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {
      console.warn("Audio chime playback error:", e);
    }
  }

  /**
   * Plays a soft wooden tap/pacer tick for mindful walking cadence.
   */
  playPacerTick() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio not permitted yet
    }
  }

  /**
   * Plays a gentle progressive wake alarm that slowly fades in over 20 seconds.
   */
  startGentleWakeAlarm(): { stop: () => void } {
    this.stopGentleWakeAlarm();
    try {
      const ctx = this.getContext();
      let isRunning = true;
      let intervalId: NodeJS.Timeout | null = null;
      let step = 0;

      // Chord notes for a soothing morning chime (A4, C#5, E5, A5)
      const notes = [440, 554.37, 659.25, 880];

      const playChord = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;
        // Crescendo volume from 0.05 to 0.4 over 10 repeats
        const targetVol = Math.min(0.4, 0.05 + step * 0.035);
        step++;

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.001, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(targetVol, now + idx * 0.12 + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 2.2);

          osc.connect(gain);
          gain.connect(this.masterGain || ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 2.3);
        });
      };

      playChord();
      intervalId = setInterval(playChord, 3500);

      const stop = () => {
        isRunning = false;
        if (intervalId) clearInterval(intervalId);
      };

      this.activeWakeAlarm = { stop };
      return { stop };
    } catch (e) {
      console.warn("Could not start alarm:", e);
      return { stop: () => {} };
    }
  }

  stopGentleWakeAlarm() {
    if (this.activeWakeAlarm) {
      this.activeWakeAlarm.stop();
      this.activeWakeAlarm = null;
    }
  }

  /* ------------------- Ambient Sound Generators ------------------ */

  private createNoiseBuffer(type: "white" | "pink" | "brown"): AudioBuffer {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * 4; // 4 second loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "white") {
        data[i] = white * 0.3;
      } else if (type === "pink") {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      } else if (type === "brown") {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 1.2; // Gain adjust
      }
    }
    return buffer;
  }

  /**
   * Initializes or updates an ambient channel.
   * Channels: 'rain' | 'ocean' | 'brownNoise' | 'forest' | 'alphaWaves'
   */
  setTrackVolume(channel: "rain" | "ocean" | "brownNoise" | "forest" | "alphaWaves", volume: number) {
    try {
      const ctx = this.getContext();
      const clampedVol = Math.max(0, Math.min(1, volume));

      if (!this.soundscapeNodes[channel]) {
        if (clampedVol === 0) return;
        this.initTrack(channel);
      }

      const node = this.soundscapeNodes[channel];
      if (node) {
        node.gain.gain.setTargetAtTime(clampedVol, ctx.currentTime, 0.1);
      }
    } catch (e) {
      console.warn(`Error setting track volume for ${channel}:`, e);
    }
  }

  private initTrack(channel: "rain" | "ocean" | "brownNoise" | "forest" | "alphaWaves") {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.connect(this.masterGain || ctx.destination);

    if (channel === "rain") {
      const pinkBuffer = this.createNoiseBuffer("pink");
      const noise = ctx.createBufferSource();
      noise.buffer = pinkBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      this.soundscapeNodes.rain = { source: noise, gain, filter };
    } else if (channel === "ocean") {
      const brownBuffer = this.createNoiseBuffer("brown");
      const noise = ctx.createBufferSource();
      noise.buffer = brownBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(1.5, now);

      // LFO for wave surges
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, now); // ~8 second wave cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(220, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      lfo.start();

      this.soundscapeNodes.ocean = { source: noise, gain, filter, lfo };
    } else if (channel === "brownNoise") {
      const brownBuffer = this.createNoiseBuffer("brown");
      const noise = ctx.createBufferSource();
      noise.buffer = brownBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, now);

      noise.connect(filter);
      filter.connect(gain);
      noise.start();

      this.soundscapeNodes.brownNoise = { source: noise, gain, filter };
    } else if (channel === "forest") {
      const pinkBuffer = this.createNoiseBuffer("pink");
      const noise = ctx.createBufferSource();
      noise.buffer = pinkBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(2.0, now);

      // LFO for breeze swelling
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(400, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      lfo.start();

      this.soundscapeNodes.forest = { source: noise, gain, filter, lfo };
    } else if (channel === "alphaWaves") {
      // 10 Hz Binaural beat: 196 Hz base, 206 Hz offset
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      oscL.type = "sine";
      oscR.type = "sine";
      oscL.frequency.setValueAtTime(196, now);
      oscR.frequency.setValueAtTime(206, now);

      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0); // Left channel
      oscR.connect(merger, 0, 1); // Right channel

      merger.connect(gain);
      oscL.start();
      oscR.start();

      this.soundscapeNodes.alphaWaves = { source: oscL, gain };
    }
  }

  setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  stopAllSoundscapes() {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      Object.keys(this.soundscapeNodes).forEach((key) => {
        const node = this.soundscapeNodes[key];
        if (node) {
          node.gain.gain.setTargetAtTime(0, now, 0.1);
        }
      });
    }
  }
}

export const relaxAudio = typeof window !== "undefined" ? new RelaxAudioManager() : (null as unknown as RelaxAudioManager);
