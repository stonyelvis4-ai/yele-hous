import { authenticateAdmin, logoutAdminSession, verifyAdminSession } from './api'

const ADMIN_SESSION_KEY = 'yele-admin-session'

type NavigateFn = (path: string, options?: { replace?: boolean }) => void

interface AdminSession {
  id?: string
  email: string
  fullName?: string
  loggedAt: string
}

function setSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
}

function readSession() {
  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AdminSession
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    return null
  }
}

export function getAdminSession() {
  return readSession()
}

export async function loginAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password.trim()) {
    return false
  }

  const admin = await authenticateAdmin(normalizedEmail, password.trim())

  setSession({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    loggedAt: new Date().toISOString()
  })

  return true
}

export async function syncAdminSession() {
  try {
    const admin = await verifyAdminSession()
    setSession({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      loggedAt: new Date().toISOString()
    })
    return true
  } catch {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    return false
  }
}

export async function logoutAdmin() {
  try {
    await logoutAdminSession()
  } catch {
    // If the API is unavailable, we still clear local session state.
  }
  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function isAdminAuthenticated() {
  const session = readSession()
  return !!session && !!session.email
}

export function requireAdminAuth(navigate?: NavigateFn) {
  if (isAdminAuthenticated()) return true

  if (navigate) {
    navigate('/admin/login', { replace: true })
  } else {
    window.history.replaceState({}, '', '/admin/login')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return false
}
