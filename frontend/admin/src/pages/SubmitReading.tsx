import { useState, useRef, useCallback } from 'react'
import { Paper, Title, Text, Button, Alert, Stack, Badge, Stepper } from '@mantine/core'
import Webcam from 'react-webcam'
import jsQR from 'jsqr'
import Tesseract from 'tesseract.js'
import api from '../utils/api'

interface MeterDetails {
  id: number
  serial_no: string
  installation_address: string
  customers: { full_name: string; account_no: string; customer_type: string }
}

interface LastReading {
  current_reading: number
  reading_date: string
}

export default function SubmitReading() {
  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [meterDetails, setMeterDetails] = useState<MeterDetails | null>(null)
  const [lastReading, setLastReading] = useState<LastReading | null>(null)
  const [manualReading, setManualReading] = useState('')
  const [ocrValue, setOcrValue] = useState<number | null>(null)
  const [ocrRunning, setOcrRunning] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successReading, setSuccessReading] = useState<any>(null)

  const webcamRef = useRef<Webcam>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Step 1 — scan QR
  const startScanning = () => {
    setScanning(true)
    setError('')
    scanIntervalRef.current = setInterval(() => {
      const video = webcamRef.current?.video
      if (!video || video.readyState !== 4) return

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code?.data) {
        stopScanning()
        loadMeter(code.data.trim())
      }
    }, 500)
  }

  const stopScanning = () => {
    setScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }

  const loadMeter = async (serialNo: string) => {
    setError('')
    try {
      const [meterRes, lastRes] = await Promise.all([
        api.get(`/meters/scan/${serialNo}`),
        api.get(`/meters/scan/${serialNo}`).then(r =>
          api.get(`/readings/meter/${r.data.data.id}/last`)
        )
      ])
      setMeterDetails(meterRes.data.data)
      setLastReading(lastRes.data.data)
      setStep(1)
    } catch {
      setError(`Meter "${serialNo}" not found. Try again.`)
    }
  }

  // Step 2 — capture photo + OCR
  const capturePhoto = useCallback(async () => {
    const dataUrl = webcamRef.current?.getScreenshot()
    if (!dataUrl) return
    setPhotoDataUrl(dataUrl)
    setOcrRunning(true)
    setError('')

    try {
      const result = await Tesseract.recognize(dataUrl, 'eng', {
        logger: () => {}
      })
      const raw = result.data.text.replace(/[^0-9.]/g, '').trim()
      const parsed = parseFloat(raw)
      if (!isNaN(parsed)) {
        setOcrValue(parsed)
      } else {
        setOcrValue(null)
        setError('OCR could not extract a number. Please check the photo or enter manually.')
      }
    } catch {
      setOcrValue(null)
      setError('OCR failed. You can still submit with manual reading only.')
    } finally {
      setOcrRunning(false)
      setStep(2)
    }
  }, [webcamRef])

  // Step 3 — submit
  const handleSubmit = async () => {
    if (!manualReading) {
      setError('Please enter the current reading')
      return
    }
    if (!meterDetails) return
    setSubmitting(true)
    setError('')

    try {
      const res = await api.post('/readings', {
        meter_id: meterDetails.id,
        current_reading: parseFloat(manualReading),
        manual_value: parseFloat(manualReading),
        ocr_value: ocrValue ?? undefined,
        photo_url: photoDataUrl ?? undefined,
        reading_date: new Date().toISOString().split('T')[0]
      })
      setSuccessReading(res.data.data)
      setStep(3)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit reading')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setStep(0)
    setMeterDetails(null)
    setLastReading(null)
    setManualReading('')
    setOcrValue(null)
    setPhotoDataUrl(null)
    setSuccessReading(null)
    setError('')
  }

  const STATUS_COLORS: Record<string, string> = {
    verified: 'green', flagged_ocr_mismatch: 'orange',
    flagged_anomaly: 'red', flagged_both: 'red', pending_review: 'yellow'
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Submit Reading</Title>
        <Text size="sm" className="text-text-300 mt-1">Scan meter QR code to begin</Text>
      </div>

      <Stepper active={step} radius="md" mb="xl" size="sm">
        <Stepper.Step label="Scan QR" />
        <Stepper.Step label="Take Photo" />
        <Stepper.Step label="Enter Reading" />
        <Stepper.Step label="Done" />
      </Stepper>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {/* Step 0 — Scan QR */}
      {step === 0 && (
        <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
          <Text size="sm" className="text-text-400 mb-4 text-center">
            Point your camera at the QR code on the meter
          </Text>
          <div className="rounded-xl overflow-hidden mb-4 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full"
            />
          </div>
          {!scanning ? (
            <Button fullWidth radius="md" onClick={startScanning}
              className="bg-primary-500 hover:bg-primary-600">
              Start Scanning
            </Button>
          ) : (
            <Button fullWidth radius="md" variant="outline" onClick={stopScanning}
              className="border-primary-500 text-primary-600">
              Stop Scanning
            </Button>
          )}
          <Text size="xs" className="text-text-200 text-center mt-3">
            Or enter serial number manually:
          </Text>
          <div className="flex gap-2 mt-2">
            <input id="manual-serial" type="text" placeholder="MTR-GT-00001"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            <Button radius="md" size="sm"
              className="bg-primary-500 hover:bg-primary-600"
              onClick={() => {
                const val = (document.getElementById('manual-serial') as HTMLInputElement)?.value
                if (val) loadMeter(val)
              }}>
              Load
            </Button>
          </div>
        </Paper>
      )}

      {/* Step 1 — Customer info + take photo */}
      {step === 1 && meterDetails && (
        <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-2">Meter Details</Text>
            <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
            <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
            <Text size="xs" className="text-text-300">{meterDetails.customers?.account_no}</Text>
            {lastReading && (
              <Text size="xs" className="text-text-300 mt-1">
                Last reading: {lastReading.current_reading} m³ on {lastReading.reading_date}
              </Text>
            )}
          </div>
          <Text size="sm" className="text-text-400 mb-3 text-center">
            Take a clear photo of the meter face
          </Text>
          <div className="rounded-xl overflow-hidden mb-4 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full"
            />
          </div>
          <Button fullWidth radius="md" loading={ocrRunning}
            onClick={capturePhoto}
            className="bg-primary-500 hover:bg-primary-600">
            {ocrRunning ? 'Reading meter...' : 'Capture Photo'}
          </Button>
          <Button fullWidth radius="md" variant="subtle" mt="xs"
            onClick={() => setStep(2)}>
            Skip photo, enter manually
          </Button>
        </Paper>
      )}

      {/* Step 2 — Enter reading */}
      {step === 2 && meterDetails && (
        <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
            <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
            {lastReading && (
              <Text size="xs" className="text-text-300">
                Previous reading: {lastReading.current_reading} m³
              </Text>
            )}
          </div>

          {photoDataUrl && (
            <img src={photoDataUrl} alt="Meter" className="w-full rounded-xl mb-4 max-h-40 object-cover" />
          )}

          {ocrValue !== null && (
            <div className="bg-primary-50 rounded-xl p-3 mb-4">
              <Text size="xs" className="text-primary-700 font-semibold">OCR extracted: {ocrValue} m³</Text>
              <Text size="xs" className="text-primary-600">Verify this matches what you see on the meter</Text>
            </div>
          )}

          <Stack gap="sm">
            <div>
              <label className="block text-sm font-medium text-text-500 mb-1">
                Current Reading (m³)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={ocrValue ? String(ocrValue) : 'Enter reading'}
                value={manualReading}
                onChange={e => setManualReading(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            {manualReading && lastReading && (
              <div className="bg-gray-50 rounded-lg p-3">
                <Text size="xs" className="text-text-300">Units consumed</Text>
                <Text fw={700} className="text-text-600">
                  {(parseFloat(manualReading) - lastReading.current_reading).toFixed(2)} m³
                </Text>
              </div>
            )}
            <Button fullWidth radius="md" size="lg" loading={submitting}
              onClick={handleSubmit}
              className="bg-primary-500 hover:bg-primary-600">
              Submit Reading
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Step 3 — Success */}
      {step === 3 && successReading && (
        <Paper shadow="xs" radius="lg" p="lg" className="bg-white text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <Text fw={700} size="lg" className="text-text-700 mb-1">Reading Submitted</Text>
          <Badge
            size="md" radius="md" variant="light"
            color={STATUS_COLORS[successReading.status] || 'green'}
            mb="md">
            {successReading.status.replace(/_/g, ' ')}
          </Badge>
          <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
            <div className="flex justify-between mb-2">
              <Text size="sm" className="text-text-300">Previous</Text>
              <Text size="sm" fw={600} className="text-text-600">{successReading.previous_reading} m³</Text>
            </div>
            <div className="flex justify-between mb-2">
              <Text size="sm" className="text-text-300">Current</Text>
              <Text size="sm" fw={600} className="text-text-600">{successReading.current_reading} m³</Text>
            </div>
            <div className="flex justify-between">
              <Text size="sm" className="text-text-300">Consumed</Text>
              <Text size="sm" fw={700} className="text-primary-600">{successReading.units_consumed} m³</Text>
            </div>
          </div>
          {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both'].includes(successReading.status) && (
            <Alert color="orange" radius="md" variant="light" mb="md">
              This reading has been flagged for admin review.
            </Alert>
          )}
          <Button fullWidth radius="md" onClick={handleReset}
            className="bg-primary-500 hover:bg-primary-600">
            Submit Another Reading
          </Button>
        </Paper>
      )}
    </div>
  )
}
