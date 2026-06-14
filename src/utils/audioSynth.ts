// Procedural Web Audio API synthesizer for offline music fallback
// This creates relaxing ambient tones matching the track to ensure sound always plays beautifully!

class ProceduralSynth {
  private ctx: AudioContext | null = null;
  private oscs: { [key: number]: OscillatorNode } = {};
  private activeGains: { [key: number]: GainNode } = {};
  private timer: number | null = null;
  private noteIndex = 0;
  private bpm = 84;
  private scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // Pentatonic major C
  
  start() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.stop();
      this.noteIndex = 0;
      this.playStep();
    } catch (e) {
      console.warn("Failed to initialize synth", e);
    }
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Fade out all notes
    Object.keys(this.oscs).forEach((key) => {
      const id = parseInt(key, 10);
      try {
        const gain = this.activeGains[id];
        if (gain && this.ctx) {
          gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
          setTimeout(() => {
            try {
              this.oscs[id]?.stop();
              delete this.oscs[id];
              delete this.activeGains[id];
            } catch (err) {}
          }, 600);
        }
      } catch (err) {}
    });
  }

  private playStep() {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Pick a note from pentatonic scale randomly or sequentially
    const chordChoice = this.noteIndex % 4 === 0;
    const notesToPlay = chordChoice 
      ? [this.scale[this.noteIndex % 5], this.scale[(this.noteIndex + 3) % 8], this.scale[(this.noteIndex + 5) % 10]]
      : [this.scale[Math.floor(Math.random() * this.scale.length)]];

    notesToPlay.forEach((freq, idx) => {
      this.triggerTone(freq, idx === 0 ? 0.35 : 0.15);
    });

    this.noteIndex++;
    // schedule next beat
    const beatLength = (60 / this.bpm) * 1000 * (Math.random() > 0.8 ? 0.5 : 1);
    this.timer = window.setTimeout(() => this.playStep(), beatLength);
  }

  private triggerTone(freq: number, baseVol = 0.2) {
    if (!this.ctx) return;
    const id = Date.now() + Math.random();
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      // Gentle subtle vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 5 + Math.random() * 3;
      lfoGain.gain.value = 2 + Math.random() * 2;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      // Lowpass filter for cozy warm sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(baseVol, this.ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.oscs[id] = osc;
      this.activeGains[id] = gain;

      setTimeout(() => {
        try {
          osc.stop();
          lfo.stop();
          delete this.oscs[id];
          delete this.activeGains[id];
        } catch (e) {}
      }, 2500);
    } catch (e) {
      console.warn("Error triggering synth tone", e);
    }
  }
}

export const fallbackSynth = new ProceduralSynth();
