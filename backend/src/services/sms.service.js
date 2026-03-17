import axios from 'axios'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export const sendMessage = async (chat_id, message) => {
  if (!chat_id) throw new Error('No telegram chat_id provided')

  const { data } = await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id,
    text: message,
    parse_mode: 'HTML'
  })

  return data
}