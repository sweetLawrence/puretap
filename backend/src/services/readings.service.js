import supabase from '../config/supabase.js'

export const getAll = async () => {
  const { data, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (id, serial_no, installation_address),
      users!readings_submitted_by_fkey (id, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getByMeterId = async (meter_id) => {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('meter_id', meter_id)
    .order('reading_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getLastReading = async (meter_id) => {
  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('meter_id', meter_id)
    .order('reading_date', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export const getFlagged = async () => {
  const { data, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (id, serial_no, installation_address),
      users!readings_submitted_by_fkey (id, full_name)
    `)
    .in('status', ['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'])
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export const getById = async (id) => {
  const { data, error } = await supabase
    .from('readings')
    .select(`
      *,
      meters (id, serial_no, installation_address),
      users!readings_submitted_by_fkey (id, full_name)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error('Reading not found')
  return data
}

// export const create = async ({
//   meter_id,
//   submitted_by,
//   current_reading,
//   manual_value,
//   ocr_value,
//   photo_url,
//   reading_date
// }) => {
//   // get last reading to set previous_reading
//   const last = await getLastReading(meter_id)
//   const previous_reading = last ? last.current_reading : 0

//   // validate reading is not going backwards
//   if (current_reading < previous_reading) {
//     throw new Error(`Current reading (${current_reading}) cannot be less than previous reading (${previous_reading})`)
//   }

//   const units_consumed = current_reading - previous_reading

//   // OCR comparison
//   let status = 'verified'
//   let ocr_difference = null

//   if (ocr_value !== null && ocr_value !== undefined) {
//     ocr_difference = Math.abs(manual_value - ocr_value)
//     const ocr_threshold = 5
//     if (ocr_difference > ocr_threshold) {
//       status = 'flagged_ocr_mismatch'
//     }
//   }

//   // anomaly detection — compare against last 3 readings avg
//   if (last) {
//     const { data: recentReadings } = await supabase
//       .from('readings')
//       .select('units_consumed')
//       .eq('meter_id', meter_id)
//       .order('reading_date', { ascending: false })
//       .limit(3)

//     if (recentReadings && recentReadings.length > 0) {
//       const avg =
//         recentReadings.reduce((sum, r) => sum + parseFloat(r.units_consumed), 0) /
//         recentReadings.length

//       const anomaly_threshold = 0.3 // 30% above average
//       if (avg > 0 && units_consumed > avg * (1 + anomaly_threshold)) {
//         status = status === 'flagged_ocr_mismatch' ? 'flagged_both' : 'flagged_anomaly'
//       }
//     }
//   }

//   const { data, error } = await supabase
//     .from('readings')
//     .insert({
//       meter_id,
//       submitted_by,
//       previous_reading,
//       current_reading,
//       units_consumed,
//       manual_value,
//       ocr_value,
//       ocr_difference,
//       photo_url,
//       status,
//       reading_date: reading_date || new Date().toISOString().split('T')[0],
//       created_at: new Date()
//     })
//     .select()
//     .single()

//   if (error) throw new Error(error.message)
//   return data
// }

export const review = async (id, { reviewer_notes, status }, reviewed_by) => {
  const { data, error } = await supabase
    .from('readings')
    .update({
      reviewer_notes,
      status,
      reviewed_by,
      reviewed_at: new Date()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}



export const create = async ({
  meter_id,
  submitted_by,
  current_reading,
  manual_value,
  ocr_value,
  photo_url,
  reading_date
}) => {
  const last = await getLastReading(meter_id)
  const previous_reading = last ? last.current_reading : 0

  if (current_reading < previous_reading) {
    throw new Error(`Current reading (${current_reading}) cannot be less than previous reading (${previous_reading})`)
  }

  const units_consumed = current_reading - previous_reading

  // record ocr difference for audit purposes only — no longer used for flagging
  const ocr_difference = (ocr_value !== null && ocr_value !== undefined)
    ? Math.abs(manual_value - ocr_value)
    : null

  // only check anomaly now
  let status = 'verified'

  if (last) {
    const { data: recentReadings } = await supabase
      .from('readings')
      .select('units_consumed')
      .eq('meter_id', meter_id)
      .order('reading_date', { ascending: false })
      .limit(3)

    if (recentReadings && recentReadings.length > 0) {
      const avg =
        recentReadings.reduce((sum, r) => sum + parseFloat(r.units_consumed), 0) /
        recentReadings.length

      const anomaly_threshold = 0.3
      if (avg > 0 && units_consumed > avg * (1 + anomaly_threshold)) {
        status = 'flagged_anomaly'
      }
    }
  }

  const { data, error } = await supabase
    .from('readings')
    .insert({
      meter_id,
      submitted_by,
      previous_reading,
      current_reading,
      units_consumed,
      manual_value,
      ocr_value: ocr_value || null,
      ocr_difference,
      photo_url: photo_url || null,
      status,
      reading_date: reading_date || new Date().toISOString().split('T')[0],
      created_at: new Date()
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}


