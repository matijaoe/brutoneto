export default defineEventHandler((event) => {
  return sendRedirect(event, '/api', 302)
})
