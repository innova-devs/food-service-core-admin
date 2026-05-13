/**
 * Alerta sonora de máximo volumen para ambientes ruidosos (restaurante).
 * Usa onda cuadrada + compresor dinámico para maximizar la percepción sonora
 * sin clipping ni silenciamiento por políticas del navegador.
 */

let intervalId: ReturnType<typeof setInterval> | null = null
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AC =
      window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext
        }
      ).webkitAudioContext
    if (!AC) return null
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AC()
    }
    return audioContext
  } catch {
    return null
  }
}

async function playChimeOnce(): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
    } catch {
      return
    }
  }
  if (ctx.state !== "running") return

  const t0 = ctx.currentTime

  // Compresor dinámico: maximiza el volumen percibido sin distorsión
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.setValueAtTime(-3, t0)
  compressor.knee.setValueAtTime(6, t0)
  compressor.ratio.setValueAtTime(4, t0)
  compressor.attack.setValueAtTime(0.001, t0)
  compressor.release.setValueAtTime(0.1, t0)
  compressor.connect(ctx.destination)

  function tone(freq: number, start: number, dur: number): void {
    const o = ctx!.createOscillator()
    const g = ctx!.createGain()
    // Onda cuadrada: 3-4× más perceptible que sinusoidal a igual amplitud
    o.type = "square"
    o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(0.7, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    o.connect(g)
    g.connect(compressor)
    o.start(start)
    o.stop(start + dur + 0.01)
  }

  tone(698, t0, 0.15)
  tone(932, t0 + 0.17, 0.15)
  tone(784, t0 + 0.34, 0.25)
}

export function startSupportAlertLoop(): void {
  stopSupportAlertLoop()
  void playChimeOnce()
  intervalId = setInterval(() => void playChimeOnce(), 8200)
}

export function stopSupportAlertLoop(): void {
  if (intervalId != null) {
    clearInterval(intervalId)
    intervalId = null
  }
}
