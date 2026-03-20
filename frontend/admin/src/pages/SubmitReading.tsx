// import { useState, useRef, useCallback } from 'react'
// import { Paper, Title, Text, Button, Alert, Stack, Badge, Stepper } from '@mantine/core'
// import Webcam from 'react-webcam'
// import jsQR from 'jsqr'
// import Tesseract from 'tesseract.js'
// import api from '../utils/api'

// interface MeterDetails {
//   id: number
//   serial_no: string
//   installation_address: string
//   customers: { full_name: string; account_no: string; customer_type: string }
// }

// interface LastReading {
//   current_reading: number
//   reading_date: string
// }

// export default function SubmitReading() {
//   const [step, setStep] = useState(0)
//   const [scanning, setScanning] = useState(false)
//   const [meterDetails, setMeterDetails] = useState<MeterDetails | null>(null)
//   const [lastReading, setLastReading] = useState<LastReading | null>(null)
//   const [manualReading, setManualReading] = useState('')
//   const [ocrValue, setOcrValue] = useState<number | null>(null)
//   const [ocrRunning, setOcrRunning] = useState(false)
//   const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
//   const [submitting, setSubmitting] = useState(false)
//   const [error, setError] = useState('')
//   const [successReading, setSuccessReading] = useState<any>(null)

//   const webcamRef = useRef<Webcam>(null)
//   const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

//   // Step 1 — scan QR
//   const startScanning = () => {
//     setScanning(true)
//     setError('')
//     scanIntervalRef.current = setInterval(() => {
//       const video = webcamRef.current?.video
//       if (!video || video.readyState !== 4) return

//       const canvas = document.createElement('canvas')
//       canvas.width = video.videoWidth
//       canvas.height = video.videoHeight
//       const ctx = canvas.getContext('2d')
//       if (!ctx) return
//       ctx.drawImage(video, 0, 0)
//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
//       const code = jsQR(imageData.data, imageData.width, imageData.height)

//       if (code?.data) {
//         stopScanning()
//         loadMeter(code.data.trim())
//       }
//     }, 500)
//   }

//   const stopScanning = () => {
//     setScanning(false)
//     if (scanIntervalRef.current) {
//       clearInterval(scanIntervalRef.current)
//       scanIntervalRef.current = null
//     }
//   }

//   const loadMeter = async (serialNo: string) => {
//     setError('')
//     try {
//       const [meterRes, lastRes] = await Promise.all([
//         api.get(`/meters/scan/${serialNo}`),
//         api.get(`/meters/scan/${serialNo}`).then(r =>
//           api.get(`/readings/meter/${r.data.data.id}/last`)
//         )
//       ])
//       setMeterDetails(meterRes.data.data)
//       setLastReading(lastRes.data.data)
//       setStep(1)
//     } catch {
//       setError(`Meter "${serialNo}" not found. Try again.`)
//     }
//   }

//   // Step 2 — capture photo + OCR
//   const capturePhoto = useCallback(async () => {
//     const dataUrl = webcamRef.current?.getScreenshot()
//     if (!dataUrl) return
//     setPhotoDataUrl(dataUrl)
//     setOcrRunning(true)
//     setError('')

//     try {
//       const result = await Tesseract.recognize(dataUrl, 'eng', {
//         logger: () => {}
//       })
//       const raw = result.data.text.replace(/[^0-9.]/g, '').trim()
//       const parsed = parseFloat(raw)
//       if (!isNaN(parsed)) {
//         setOcrValue(parsed)
//       } else {
//         setOcrValue(null)
//         setError('OCR could not extract a number. Please check the photo or enter manually.')
//       }
//     } catch {
//       setOcrValue(null)
//       setError('OCR failed. You can still submit with manual reading only.')
//     } finally {
//       setOcrRunning(false)
//       setStep(2)
//     }
//   }, [webcamRef])

//   // Step 3 — submit
//   const handleSubmit = async () => {
//     if (!manualReading) {
//       setError('Please enter the current reading')
//       return
//     }
//     if (!meterDetails) return
//     setSubmitting(true)
//     setError('')

//     try {
//       const res = await api.post('/readings', {
//         meter_id: meterDetails.id,
//         current_reading: parseFloat(manualReading),
//         manual_value: parseFloat(manualReading),
//         ocr_value: ocrValue ?? undefined,
//         photo_url: photoDataUrl ?? undefined,
//         reading_date: new Date().toISOString().split('T')[0]
//       })
//       setSuccessReading(res.data.data)
//       setStep(3)
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to submit reading')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleReset = () => {
//     setStep(0)
//     setMeterDetails(null)
//     setLastReading(null)
//     setManualReading('')
//     setOcrValue(null)
//     setPhotoDataUrl(null)
//     setSuccessReading(null)
//     setError('')
//   }

//   const STATUS_COLORS: Record<string, string> = {
//     verified: 'green', flagged_ocr_mismatch: 'orange',
//     flagged_anomaly: 'red', flagged_both: 'red', pending_review: 'yellow'
//   }

//   return (
//     <div className="p-4 max-w-lg mx-auto">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">Submit Reading</Title>
//         <Text size="sm" className="text-text-300 mt-1">Scan meter QR code to begin</Text>
//       </div>

//       <Stepper active={step} radius="md" mb="xl" size="sm">
//         <Stepper.Step label="Scan QR" />
//         <Stepper.Step label="Take Photo" />
//         <Stepper.Step label="Enter Reading" />
//         <Stepper.Step label="Done" />
//       </Stepper>

//       {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

//       {/* Step 0 — Scan QR */}
//       {step === 0 && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="sm" className="text-text-400 mb-4 text-center">
//             Point your camera at the QR code on the meter
//           </Text>
//           <div className="rounded-xl overflow-hidden mb-4 bg-black">
//             <Webcam
//               ref={webcamRef}
//               audio={false}
//               screenshotFormat="image/jpeg"
//               videoConstraints={{ facingMode: 'environment' }}
//               className="w-full"
//             />
//           </div>
//           {!scanning ? (
//             <Button fullWidth radius="md" onClick={startScanning}
//               className="bg-primary-500 hover:bg-primary-600">
//               Start Scanning
//             </Button>
//           ) : (
//             <Button fullWidth radius="md" variant="outline" onClick={stopScanning}
//               className="border-primary-500 text-primary-600">
//               Stop Scanning
//             </Button>
//           )}
//           <Text size="xs" className="text-text-200 text-center mt-3">
//             Or enter serial number manually:
//           </Text>
//           <div className="flex gap-2 mt-2">
//             <input id="manual-serial" type="text" placeholder="MTR-GT-00001"
//               className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" />
//             <Button radius="md" size="sm"
//               className="bg-primary-500 hover:bg-primary-600"
//               onClick={() => {
//                 const val = (document.getElementById('manual-serial') as HTMLInputElement)?.value
//                 if (val) loadMeter(val)
//               }}>
//               Load
//             </Button>
//           </div>
//         </Paper>
//       )}

//       {/* Step 1 — Customer info + take photo */}
//       {step === 1 && meterDetails && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <div className="bg-gray-50 rounded-xl p-4 mb-4">
//             <Text size="xs" className="text-text-300 uppercase tracking-wide mb-2">Meter Details</Text>
//             <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
//             <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
//             <Text size="xs" className="text-text-300">{meterDetails.customers?.account_no}</Text>
//             {lastReading && (
//               <Text size="xs" className="text-text-300 mt-1">
//                 Last reading: {lastReading.current_reading} m³ on {lastReading.reading_date}
//               </Text>
//             )}
//           </div>
//           <Text size="sm" className="text-text-400 mb-3 text-center">
//             Take a clear photo of the meter face
//           </Text>
//           <div className="rounded-xl overflow-hidden mb-4 bg-black">
//             <Webcam
//               ref={webcamRef}
//               audio={false}
//               screenshotFormat="image/jpeg"
//               videoConstraints={{ facingMode: 'environment' }}
//               className="w-full"
//             />
//           </div>
//           <Button fullWidth radius="md" loading={ocrRunning}
//             onClick={capturePhoto}
//             className="bg-primary-500 hover:bg-primary-600">
//             {ocrRunning ? 'Reading meter...' : 'Capture Photo'}
//           </Button>
//           <Button fullWidth radius="md" variant="subtle" mt="xs"
//             onClick={() => setStep(2)}>
//             Skip photo, enter manually
//           </Button>
//         </Paper>
//       )}

//       {/* Step 2 — Enter reading */}
//       {step === 2 && meterDetails && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <div className="bg-gray-50 rounded-xl p-4 mb-4">
//             <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
//             <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
//             {lastReading && (
//               <Text size="xs" className="text-text-300">
//                 Previous reading: {lastReading.current_reading} m³
//               </Text>
//             )}
//           </div>

//           {photoDataUrl && (
//             <img src={photoDataUrl} alt="Meter" className="w-full rounded-xl mb-4 max-h-40 object-cover" />
//           )}

//           {ocrValue !== null && (
//             <div className="bg-primary-50 rounded-xl p-3 mb-4">
//               <Text size="xs" className="text-primary-700 font-semibold">OCR extracted: {ocrValue} m³</Text>
//               <Text size="xs" className="text-primary-600">Verify this matches what you see on the meter</Text>
//             </div>
//           )}

//           <Stack gap="sm">
//             <div>
//               <label className="block text-sm font-medium text-text-500 mb-1">
//                 Current Reading (m³)
//               </label>
//               <input
//                 type="number"
//                 step="0.01"
//                 placeholder={ocrValue ? String(ocrValue) : 'Enter reading'}
//                 value={manualReading}
//                 onChange={e => setManualReading(e.target.value)}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
//               />
//             </div>
//             {manualReading && lastReading && (
//               <div className="bg-gray-50 rounded-lg p-3">
//                 <Text size="xs" className="text-text-300">Units consumed</Text>
//                 <Text fw={700} className="text-text-600">
//                   {(parseFloat(manualReading) - lastReading.current_reading).toFixed(2)} m³
//                 </Text>
//               </div>
//             )}
//             <Button fullWidth radius="md" size="lg" loading={submitting}
//               onClick={handleSubmit}
//               className="bg-primary-500 hover:bg-primary-600">
//               Submit Reading
//             </Button>
//           </Stack>
//         </Paper>
//       )}

//       {/* Step 3 — Success */}
//       {step === 3 && successReading && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white text-center">
//           <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
//             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
//               <polyline points="20 6 9 17 4 12" />
//             </svg>
//           </div>
//           <Text fw={700} size="lg" className="text-text-700 mb-1">Reading Submitted</Text>
//           <Badge
//             size="md" radius="md" variant="light"
//             color={STATUS_COLORS[successReading.status] || 'green'}
//             mb="md">
//             {successReading.status.replace(/_/g, ' ')}
//           </Badge>
//           <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
//             <div className="flex justify-between mb-2">
//               <Text size="sm" className="text-text-300">Previous</Text>
//               <Text size="sm" fw={600} className="text-text-600">{successReading.previous_reading} m³</Text>
//             </div>
//             <div className="flex justify-between mb-2">
//               <Text size="sm" className="text-text-300">Current</Text>
//               <Text size="sm" fw={600} className="text-text-600">{successReading.current_reading} m³</Text>
//             </div>
//             <div className="flex justify-between">
//               <Text size="sm" className="text-text-300">Consumed</Text>
//               <Text size="sm" fw={700} className="text-primary-600">{successReading.units_consumed} m³</Text>
//             </div>
//           </div>
//           {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both'].includes(successReading.status) && (
//             <Alert color="orange" radius="md" variant="light" mb="md">
//               This reading has been flagged for admin review.
//             </Alert>
//           )}
//           <Button fullWidth radius="md" onClick={handleReset}
//             className="bg-primary-500 hover:bg-primary-600">
//             Submit Another Reading
//           </Button>
//         </Paper>
//       )}
//     </div>
//   )
// }













// import { useState, useRef, useCallback } from 'react'
// import { Paper, Title, Text, Button, Alert, Stack, Badge, Stepper } from '@mantine/core'
// import Webcam from 'react-webcam'
// import jsQR from 'jsqr'
// import api from '../utils/api'
// import supabase from '../utils/supabase'

// interface MeterDetails {
//   id: number
//   serial_no: string
//   installation_address: string
//   customers: { full_name: string; account_no: string; customer_type: string }
// }

// interface LastReading {
//   current_reading: number
//   reading_date: string
// }

// export default function SubmitReading() {
//   const [step, setStep] = useState(0)
//   const [scanning, setScanning] = useState(false)
//   const [meterDetails, setMeterDetails] = useState<MeterDetails | null>(null)
//   const [lastReading, setLastReading] = useState<LastReading | null>(null)
//   const [manualReading, setManualReading] = useState('')
//   const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
//   const [photoUrl, setPhotoUrl] = useState<string | null>(null)
//   const [uploading, setUploading] = useState(false)
//   const [submitting, setSubmitting] = useState(false)
//   const [error, setError] = useState('')
//   const [successReading, setSuccessReading] = useState<any>(null)

//   const webcamRef = useRef<Webcam>(null)
//   const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

//   // Step 0 — scan QR
//   const startScanning = () => {
//     setScanning(true)
//     setError('')
//     scanIntervalRef.current = setInterval(() => {
//       const video = webcamRef.current?.video
//       if (!video || video.readyState !== 4) return

//       const canvas = document.createElement('canvas')
//       canvas.width = video.videoWidth
//       canvas.height = video.videoHeight
//       const ctx = canvas.getContext('2d')
//       if (!ctx) return
//       ctx.drawImage(video, 0, 0)
//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
//       const code = jsQR(imageData.data, imageData.width, imageData.height)

//       if (code?.data) {
//         stopScanning()
//         loadMeter(code.data.trim())
//       }
//     }, 500)
//   }

//   const stopScanning = () => {
//     setScanning(false)
//     if (scanIntervalRef.current) {
//       clearInterval(scanIntervalRef.current)
//       scanIntervalRef.current = null
//     }
//   }

//   const loadMeter = async (serialNo: string) => {
//     setError('')
//     try {
//       const meterRes = await api.get(`/meters/scan/${serialNo}`)
//       const meter = meterRes.data.data
//       setMeterDetails(meter)

//       const lastRes = await api.get(`/readings/meter/${meter.id}/last`)
//       setLastReading(lastRes.data.data)
//       setStep(1)
//     } catch {
//       setError(`Meter "${serialNo}" not found. Try again.`)
//     }
//   }

//   // Step 1 — capture photo and upload to Supabase Storage
//   const captureAndUpload = useCallback(async () => {
//     const dataUrl = webcamRef.current?.getScreenshot()
//     if (!dataUrl) return

//     setPhotoDataUrl(dataUrl)
//     setUploading(true)
//     setError('')

//     try {
//       // convert base64 to blob
//       const res = await fetch(dataUrl)
//       const blob = await res.blob()

//       const fileName = `${meterDetails?.serial_no}_${Date.now()}.jpg`

//       const { data, error: uploadError } = await supabase.storage
//         .from('meter-photos')
//         .upload(fileName, blob, {
//           contentType: 'image/jpeg',
//           upsert: false
//         })

//       if (uploadError) throw new Error(uploadError.message)

//       const { data: urlData } = supabase.storage
//         .from('meter-photos')
//         .getPublicUrl(data.path)

//       setPhotoUrl(urlData.publicUrl)
//       setStep(2)
//     } catch (err: any) {
//       setError(err.message || 'Failed to upload photo. Try again.')
//     } finally {
//       setUploading(false)
//     }
//   }, [webcamRef, meterDetails])

//   const retakePhoto = () => {
//     setPhotoDataUrl(null)
//     setPhotoUrl(null)
//     setStep(1)
//   }

//   // Step 2 — submit reading
//   const handleSubmit = async () => {
//     if (!manualReading) {
//       setError('Please enter the current reading')
//       return
//     }
//     if (!meterDetails) return

//     setSubmitting(true)
//     setError('')

//     try {
//       const res = await api.post('/readings', {
//         meter_id: meterDetails.id,
//         current_reading: parseFloat(manualReading),
//         manual_value: parseFloat(manualReading),
//         photo_url: photoUrl ?? null,
//         reading_date: new Date().toISOString().split('T')[0]
//       })
//       setSuccessReading(res.data.data)
//       setStep(3)
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to submit reading')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleReset = () => {
//     setStep(0)
//     setMeterDetails(null)
//     setLastReading(null)
//     setManualReading('')
//     setPhotoDataUrl(null)
//     setPhotoUrl(null)
//     setSuccessReading(null)
//     setError('')
//   }

//   const STATUS_COLORS: Record<string, string> = {
//     verified: 'green', flagged_ocr_mismatch: 'orange',
//     flagged_anomaly: 'red', flagged_both: 'red', pending_review: 'yellow'
//   }

//   return (
//     <div className="p-4 max-w-lg mx-auto">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">Submit Reading</Title>
//         <Text size="sm" className="text-text-300 mt-1">Scan meter QR code to begin</Text>
//       </div>

//       <Stepper active={step} radius="md" mb="xl" size="sm">
//         <Stepper.Step label="Scan QR" />
//         <Stepper.Step label="Take Photo" />
//         <Stepper.Step label="Enter Reading" />
//         <Stepper.Step label="Done" />
//       </Stepper>

//       {error && (
//         <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>
//       )}

//       {/* Step 0 — Scan QR */}
//       {step === 0 && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="sm" className="text-text-400 mb-4 text-center">
//             Point your camera at the QR code on the meter
//           </Text>
//           <div className="rounded-xl overflow-hidden mb-4 bg-black">
//             <Webcam
//               ref={webcamRef}
//               audio={false}
//               screenshotFormat="image/jpeg"
//               videoConstraints={{ facingMode: 'environment' }}
//               className="w-full"
//             />
//           </div>
//           {!scanning ? (
//             <Button fullWidth radius="md" onClick={startScanning}
//               className="bg-primary-500 hover:bg-primary-600">
//               Start Scanning
//             </Button>
//           ) : (
//             <Button fullWidth radius="md" variant="outline" onClick={stopScanning}
//               className="border-primary-500 text-primary-600">
//               Stop Scanning
//             </Button>
//           )}
//           <Text size="xs" className="text-text-200 text-center mt-3">
//             Or enter serial number manually:
//           </Text>
//           <div className="flex gap-2 mt-2">
//             <input
//               id="manual-serial"
//               type="text"
//               placeholder="MTR-GT-00001"
//               className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//             />
//             <Button radius="md" size="sm"
//               className="bg-primary-500 hover:bg-primary-600"
//               onClick={() => {
//                 const val = (document.getElementById('manual-serial') as HTMLInputElement)?.value
//                 if (val) loadMeter(val.trim())
//               }}>
//               Load
//             </Button>
//           </div>
//         </Paper>
//       )}

//       {/* Step 1 — Take photo */}
//       {step === 1 && meterDetails && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <div className="bg-gray-50 rounded-xl p-4 mb-4">
//             <Text size="xs" className="text-text-300 uppercase tracking-wide mb-2">Meter Details</Text>
//             <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
//             <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
//             <Text size="xs" className="text-text-300">{meterDetails.customers?.account_no}</Text>
//             {lastReading && (
//               <Text size="xs" className="text-text-300 mt-1">
//                 Last reading: {lastReading.current_reading} m³ on {lastReading.reading_date}
//               </Text>
//             )}
//           </div>

//           <Text size="sm" className="text-text-400 mb-3 text-center">
//             Take a clear photo of the meter face showing the reading
//           </Text>

//           <div className="rounded-xl overflow-hidden mb-4 bg-black">
//             <Webcam
//               ref={webcamRef}
//               audio={false}
//               screenshotFormat="image/jpeg"
//               videoConstraints={{ facingMode: 'environment' }}
//               className="w-full"
//             />
//           </div>

//           <Button fullWidth radius="md" loading={uploading}
//             onClick={captureAndUpload}
//             className="bg-primary-500 hover:bg-primary-600">
//             {uploading ? 'Uploading photo...' : 'Capture Photo'}
//           </Button>

//           <Button fullWidth radius="md" variant="subtle" mt="xs"
//             onClick={() => setStep(2)}>
//             Skip photo
//           </Button>
//         </Paper>
//       )}

//       {/* Step 2 — Enter reading */}
//       {step === 2 && meterDetails && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <div className="bg-gray-50 rounded-xl p-4 mb-4">
//             <Text fw={600} className="text-text-700">{meterDetails.serial_no}</Text>
//             <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
//             {lastReading && (
//               <Text size="xs" className="text-text-300">
//                 Previous reading: {lastReading.current_reading} m³
//               </Text>
//             )}
//           </div>

//           {/* Photo preview */}
//           {photoDataUrl && (
//             <div className="mb-4">
//               <img
//                 src={photoDataUrl}
//                 alt="Meter"
//                 className="w-full rounded-xl max-h-48 object-cover"
//               />
//               <div className="flex justify-between items-center mt-2">
//                 <Text size="xs" className="text-green-600 font-semibold">
//                   Photo uploaded successfully
//                 </Text>
//                 <button
//                   onClick={retakePhoto}
//                   className="text-xs text-primary-500 underline"
//                 >
//                   Retake
//                 </button>
//               </div>
//             </div>
//           )}

//           {!photoDataUrl && (
//             <Alert color="yellow" radius="md" variant="light" mb="md">
//               No photo attached. Admin may flag this reading for review.
//             </Alert>
//           )}

//           <Stack gap="sm">
//             <div>
//               <label className="block text-sm font-medium text-text-500 mb-1">
//                 Current Reading (m³)
//               </label>
//               <input
//                 type="number"
//                 step="0.01"
//                 placeholder="Enter reading from meter"
//                 value={manualReading}
//                 onChange={e => setManualReading(e.target.value)}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-lg text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
//               />
//             </div>

//             {manualReading && lastReading && (
//               <div className="bg-gray-50 rounded-lg p-3">
//                 <Text size="xs" className="text-text-300">Units consumed</Text>
//                 <Text fw={700} className="text-text-600">
//                   {(parseFloat(manualReading) - lastReading.current_reading).toFixed(2)} m³
//                 </Text>
//               </div>
//             )}

//             <Button fullWidth radius="md" size="lg" loading={submitting}
//               onClick={handleSubmit}
//               className="bg-primary-500 hover:bg-primary-600">
//               Submit Reading
//             </Button>
//           </Stack>
//         </Paper>
//       )}

//       {/* Step 3 — Success */}
//       {step === 3 && successReading && (
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white text-center">
//           <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
//             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
//               <polyline points="20 6 9 17 4 12" />
//             </svg>
//           </div>
//           <Text fw={700} size="lg" className="text-text-700 mb-1">Reading Submitted</Text>
//           <Badge
//             size="md" radius="md" variant="light"
//             color={STATUS_COLORS[successReading.status] || 'green'}
//             mb="md">
//             {successReading.status.replace(/_/g, ' ')}
//           </Badge>

//           <div className="bg-gray-50 rounded-xl p-4 text-left mb-4">
//             <div className="flex justify-between mb-2">
//               <Text size="sm" className="text-text-300">Meter</Text>
//               <Text size="sm" fw={600} className="text-text-600">{meterDetails?.serial_no}</Text>
//             </div>
//             <div className="flex justify-between mb-2">
//               <Text size="sm" className="text-text-300">Previous</Text>
//               <Text size="sm" fw={600} className="text-text-600">{successReading.previous_reading} m³</Text>
//             </div>
//             <div className="flex justify-between mb-2">
//               <Text size="sm" className="text-text-300">Current</Text>
//               <Text size="sm" fw={600} className="text-text-600">{successReading.current_reading} m³</Text>
//             </div>
//             <div className="flex justify-between">
//               <Text size="sm" className="text-text-300">Consumed</Text>
//               <Text size="sm" fw={700} className="text-primary-600">{successReading.units_consumed} m³</Text>
//             </div>
//           </div>

//           {photoDataUrl && (
//             <div className="mb-4">
//               <img src={photoDataUrl} alt="Meter evidence"
//                 className="w-full rounded-xl max-h-40 object-cover" />
//               <Text size="xs" className="text-text-300 mt-1">Photo saved as evidence</Text>
//             </div>
//           )}

//           {['flagged_anomaly'].includes(successReading.status) && (
//             <Alert color="orange" radius="md" variant="light" mb="md">
//               Consumption is unusually high — flagged for admin review.
//             </Alert>
//           )}

//           <Button fullWidth radius="md" onClick={handleReset}
//             className="bg-primary-500 hover:bg-primary-600">
//             Submit Another Reading
//           </Button>
//         </Paper>
//       )}
//     </div>
//   )
// }













import { useState, useRef, useCallback } from 'react'
import { Title, Text, Button, Alert, Badge } from '@mantine/core'
import Webcam from 'react-webcam'
import jsQR from 'jsqr'
import api from '../utils/api'
import supabase from '../utils/supabase'

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

const steps = ['Scan QR', 'Take Photo', 'Enter Reading', 'Done']

export default function SubmitReading() {
  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [meterDetails, setMeterDetails] = useState<MeterDetails | null>(null)
  const [lastReading, setLastReading] = useState<LastReading | null>(null)
  const [manualReading, setManualReading] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successReading, setSuccessReading] = useState<any>(null)
  const [manualSerial, setManualSerial] = useState('')

  const webcamRef = useRef<Webcam>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      const meterRes = await api.get(`/meters/scan/${serialNo}`)
      const meter = meterRes.data.data
      setMeterDetails(meter)
      const lastRes = await api.get(`/readings/meter/${meter.id}/last`)
      setLastReading(lastRes.data.data)
      setStep(1)
    } catch {
      setError(`Meter "${serialNo}" not found. Try again.`)
    }
  }

  const captureAndUpload = useCallback(async () => {
    const dataUrl = webcamRef.current?.getScreenshot()
    if (!dataUrl) return
    setPhotoDataUrl(dataUrl)
    setUploading(true)
    setError('')
    try {
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const fileName = `${meterDetails?.serial_no}_${Date.now()}.jpg`
      const { data, error: uploadError } = await supabase.storage
        .from('meter-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
      if (uploadError) throw new Error(uploadError.message)
      const { data: urlData } = supabase.storage
        .from('meter-photos')
        .getPublicUrl(data.path)
      setPhotoUrl(urlData.publicUrl)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Try again.')
    } finally {
      setUploading(false)
    }
  }, [webcamRef, meterDetails])

  const handleSubmit = async () => {
    if (!manualReading) { setError('Please enter the current reading'); return }
    if (!meterDetails) return
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/readings', {
        meter_id: meterDetails.id,
        current_reading: parseFloat(manualReading),
        manual_value: parseFloat(manualReading),
        photo_url: photoUrl ?? null,
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
    setPhotoDataUrl(null)
    setPhotoUrl(null)
    setSuccessReading(null)
    setError('')
    setManualSerial('')
  }

  const STATUS_COLORS: Record<string, string> = {
    verified: 'green', flagged_ocr_mismatch: 'orange',
    flagged_anomaly: 'red', flagged_both: 'red', pending_review: 'yellow'
  }

  return (
    <div className="min-h-screen bg-back-500">
      {/* sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <Title order={4} className="text-text-700 font-bold">Submit Reading</Title>
        {/* step indicator */}
        <div className="flex items-center gap-1 mt-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-secondary-300 text-white' :
                i === step ? 'bg-primary-500 text-white' :
                'bg-gray-100 text-text-300'
              }`}>
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 transition-colors ${i < step ? 'bg-secondary-300' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
          <Text size="xs" className="text-text-300 ml-2">{steps[step]}</Text>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {error && (
          <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>
        )}

        {/* ── Step 0: Scan QR ── */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-primary-500 px-4 py-3">
                <Text size="sm" fw={600} className="text-white">Point camera at meter QR code</Text>
              </div>
              <div className="bg-black aspect-square relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'environment', aspectRatio: 1 }}
                  className="w-full h-full object-cover"
                />
                {/* scanning overlay */}
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary-400 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-lg" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                {!scanning ? (
                  <Button fullWidth radius="md" size="md" onClick={startScanning}
                    className="bg-primary-500 hover:bg-primary-600">
                    Start Scanning
                  </Button>
                ) : (
                  <Button fullWidth radius="md" size="md" variant="outline" onClick={stopScanning}
                    className="border-primary-500 text-primary-600">
                    Stop
                  </Button>
                )}
              </div>
            </div>

            {/* manual entry */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <Text size="sm" fw={500} className="text-text-500 mb-3">Or enter serial number manually</Text>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="MTR-GT-00001"
                  value={manualSerial}
                  onChange={e => setManualSerial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && manualSerial && loadMeter(manualSerial.trim())}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <Button radius="sm" size="sm" px="lg"
                  onClick={() => manualSerial && loadMeter(manualSerial.trim())}
                  className="bg-primary-500 hover:bg-primary-600 ">
                  Load
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Take Photo ── */}
        {step === 1 && meterDetails && (
          <div className="flex flex-col gap-4">
            {/* meter info card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <Text fw={700} className="text-text-700">{meterDetails.serial_no}</Text>
                  <Text size="sm" className="text-text-500 truncate">{meterDetails.customers?.full_name}</Text>
                  <Text size="xs" className="text-text-300">{meterDetails.customers?.account_no}</Text>
                  {lastReading && (
                    <div className="mt-2 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                      <Text size="xs" className="text-text-400">
                        Last: <span className="font-semibold text-text-600">{lastReading.current_reading} m³</span>
                        <span className="text-text-200 ml-1">on {lastReading.reading_date}</span>
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* camera */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-primary-500 px-4 py-3">
                <Text size="sm" fw={600} className="text-white">Take a clear photo of the meter face</Text>
                <Text size="xs" className="text-primary-100 mt-0.5">Make sure the numbers are visible</Text>
              </div>
              <div className="bg-black aspect-square">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'environment', aspectRatio: 1 }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col gap-2">
                <Button fullWidth radius="md" size="md" loading={uploading}
                  onClick={captureAndUpload}
                  className="bg-primary-500 hover:bg-primary-600">
                  {uploading ? 'Uploading...' : 'Capture Photo'}
                </Button>
                <Button fullWidth radius="md" size="sm" variant="subtle"
                  onClick={() => setStep(2)}>
                  Skip photo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Enter Reading ── */}
        {step === 2 && meterDetails && (
          <div className="flex flex-col gap-4">
            {/* meter info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <Text fw={700} className="text-text-700">{meterDetails.serial_no}</Text>
                  <Text size="sm" className="text-text-500">{meterDetails.customers?.full_name}</Text>
                </div>
                {lastReading && (
                  <div className="text-right">
                    <Text size="xs" className="text-text-300">Previous</Text>
                    <Text fw={700} className="text-text-600">{lastReading.current_reading} m³</Text>
                  </div>
                )}
              </div>
            </div>

            {/* photo preview */}
            {photoDataUrl ? (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={photoDataUrl} alt="Meter"
                  className="w-full max-h-48 object-cover" />
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <Text size="xs" className="text-green-600 font-medium">Photo uploaded</Text>
                  </div>
                  <button onClick={() => { setPhotoDataUrl(null); setPhotoUrl(null); setStep(1) }}
                    className="text-xs text-primary-500 font-medium">
                    Retake
                  </button>
                </div>
              </div>
            ) : (
              <Alert color="yellow" radius="md" variant="light">
                No photo — reading may be flagged for review
              </Alert>
            )}

            {/* reading input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <label className="block text-sm font-semibold text-text-600 mb-3">
                Current Reading (m³)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={manualReading}
                onChange={e => setManualReading(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-3xl text-text-700 font-bold text-center focus:outline-none focus:border-primary-400 transition-colors"
              />

              {manualReading && lastReading && (
                <div className="mt-3 bg-primary-50 rounded-xl p-3 flex justify-between items-center">
                  <Text size="sm" className="text-primary-700">Units consumed</Text>
                  <Text fw={700} className="text-primary-600 text-lg">
                    {Math.max(0, parseFloat(manualReading) - lastReading.current_reading).toFixed(2)} m³
                  </Text>
                </div>
              )}
            </div>

            <Button fullWidth radius="xl" size="lg" loading={submitting}
              onClick={handleSubmit}
              className="bg-primary-500 hover:bg-primary-600 shadow-sm">
              Submit Reading
            </Button>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && successReading && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                successReading.status === 'verified' ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                {successReading.status === 'verified' ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>

              <Text fw={700} size="lg" className="text-text-700 mb-1">
                {successReading.status === 'verified' ? 'Reading Submitted' : 'Reading Flagged'}
              </Text>
              <Badge size="md" radius="md" variant="light"
                color={STATUS_COLORS[successReading.status] || 'green'} mb="md">
                {successReading.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            {/* summary */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[
                ['Meter', meterDetails?.serial_no],
                ['Customer', meterDetails?.customers?.full_name],
                ['Previous reading', `${successReading.previous_reading} m³`],
                ['Current reading', `${successReading.current_reading} m³`],
                ['Units consumed', `${successReading.units_consumed} m³`],
                ['Date', successReading.reading_date],
              ].map(([label, value], i) => (
                <div key={label}
                  className={`flex justify-between px-4 py-3 ${i !== 5 ? 'border-b border-gray-50' : ''}`}>
                  <Text size="sm" className="text-text-300">{label}</Text>
                  <Text size="sm" fw={600} className={
                    label === 'Units consumed' ? 'text-primary-600' : 'text-text-600'
                  }>{value}</Text>
                </div>
              ))}
            </div>

            {photoDataUrl && (
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={photoDataUrl} alt="Evidence" className="w-full max-h-40 object-cover" />
                <div className="px-4 py-2.5">
                  <Text size="xs" className="text-text-300">Photo saved as evidence</Text>
                </div>
              </div>
            )}

            {['flagged_anomaly', 'flagged_both'].includes(successReading.status) && (
              <Alert color="orange" radius="md" variant="light">
                Flagged for admin review — consumption is unusually high.
              </Alert>
            )}

            <Button fullWidth radius="xl" size="lg" onClick={handleReset}
              className="bg-primary-500 hover:bg-primary-600">
              Submit Another Reading
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
