export const sendSuccess = (res, data, statusCode = 200, message = 'success') => {
  res.status(statusCode).json({ success: true, message, data })
}

export const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  res.status(statusCode).json({ success: false, message, data: null })
}