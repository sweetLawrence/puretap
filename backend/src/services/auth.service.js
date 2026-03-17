import supabase from '../config/supabase.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const register = async ({ full_name, phone, email, password, role }) => {
  const existing = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing.data) throw new Error('Email already registered')

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from('users')
    .insert({ full_name, phone, email, password_hash, role, is_active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export const login = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) throw new Error('Invalid email or password')
  if (!user.is_active) throw new Error('Account is deactivated')

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) throw new Error('Invalid email or password')

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )

  const refresh_token_hash = await bcrypt.hash(refreshToken, 10)

  await supabase
    .from('users')
    .update({ refresh_token_hash, last_login_at: new Date() })
    .eq('id', user.id)

  const { password_hash, refresh_token_hash: _, ...safeUser } = user

  return { accessToken, refreshToken, user: safeUser }
}

export const refresh = async (refreshToken) => {
  let decoded
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
  } catch {
    throw new Error('Invalid or expired refresh token')
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .single()

  if (error || !user) throw new Error('User not found')

  const isValid = await bcrypt.compare(refreshToken, user.refresh_token_hash)
  if (!isValid) throw new Error('Invalid refresh token')

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )

  return { accessToken }
}

export const logout = async (userId) => {
  await supabase
    .from('users')
    .update({ refresh_token_hash: null })
    .eq('id', userId)
}