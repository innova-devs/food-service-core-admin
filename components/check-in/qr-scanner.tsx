"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ScanIcon } from "lucide-react"

interface QrScannerProps {
  onScan: (data: string) => void
  isProcessing?: boolean
}

export function QrScanner({ onScan, isProcessing = false }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as unknown as { BarcodeDetector: new (options: { formats: string[] }) => { detect: (source: ImageData) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
          formats: ["qr_code"],
        })
        const barcodes = await barcodeDetector.detect(imageData)
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          onScan(barcodes[0].rawValue)
          return
        }
      }
    } catch {
      // BarcodeDetector not supported or error, continue scanning
    }

    animationRef.current = requestAnimationFrame(scanQRCode)
  }, [onScan, isProcessing])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            animationRef.current = requestAnimationFrame(scanQRCode)
          }
        }
      } catch (err) {
        const error = err as Error
        setError(error.message || "Failed to access camera")
      }
    }

    startCamera()

    return () => {
      stopScanning()
    }
  }, [scanQRCode, stopScanning])

  useEffect(() => {
    if (isProcessing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    } else if (streamRef.current && !animationRef.current) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }, [isProcessing, scanQRCode])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/10 p-8">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-64 w-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 h-8 w-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 h-8 w-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
            
            {/* Scanning line animation */}
            {!isProcessing && (
              <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-[scan_2s_ease-in-out_infinite]" />
            )}
          </div>
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium">Procesando...</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
        <ScanIcon className="h-4 w-4" />
        <span className="text-sm">Escanea el codigo QR de la reserva</span>
      </div>
    </div>
  )
}
