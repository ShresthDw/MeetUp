// Lightweight Web Audio API synthesizer for tactile, responsive UI feedback
class SoundEffects {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  playClick() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04)

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.04)
    } catch (e) {
      // Audio context might be restricted
    }
  }

  playToggle(active = true) {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      const freq = active ? 640 : 420
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq + (active ? 180 : -120), this.ctx.currentTime + 0.06)

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.06)
    } catch (e) {
      // silent
    }
  }

  playMatchFound() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)

        gain.gain.setValueAtTime(0.08, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.25)
      })
    } catch (e) {
      // silent
    }
  }

  playMessage() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(950, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.08)

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.08)
    } catch (e) {
      // silent
    }
  }

  playSkip() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      if (this.ctx.state === 'suspended') this.ctx.resume()

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.1)

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start()
      osc.stop(this.ctx.currentTime + 0.1)
    } catch (e) {
      // silent
    }
  }
}

export const sounds = new SoundEffects()
