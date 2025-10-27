/**
 * Auth Logger - Comprehensive logging for OAuth and Supabase auth debugging
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
  error?: Error | null
}

class AuthLogger {
  private logs: LogEntry[] = []
  private isDevelopment = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, component, message, data, error } = entry
    let output = `[${timestamp}] [${level}] [${component}] ${message}`

    if (data) {
      output += `\nData: ${JSON.stringify(data, null, 2)}`
    }

    if (error) {
      output += `\nError: ${error.message}\nStack: ${error.stack}`
    }

    return output
  }

  private log(level: LogLevel, component: string, message: string, data?: any, error?: Error | null) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      data,
      error: error || null,
    }

    this.logs.push(entry)

    // Only log to console in development
    if (this.isDevelopment) {
      const formatted = this.formatLog(entry)
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted)
          break
      }
    }
  }

  debug(component: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, component, message, data)
  }

  info(component: string, message: string, data?: any) {
    this.log(LogLevel.INFO, component, message, data)
  }

  warn(component: string, message: string, data?: any) {
    this.log(LogLevel.WARN, component, message, data)
  }

  error(component: string, message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, component, message, data, error)
  }

  // OAuth specific logging
  oauthStart(provider: string, redirectUrl: string) {
    this.info('OAuth', `Starting ${provider} OAuth flow`, {
      provider,
      redirectUrl,
      timestamp: new Date().toISOString(),
    })
  }

  oauthCallbackDetected(provider: string, hasToken: boolean) {
    this.info('OAuth', `OAuth callback detected for ${provider}`, {
      provider,
      hasToken,
      urlHash: typeof window !== 'undefined' ? window.location.hash.substring(0, 50) : 'N/A',
    })
  }

  oauthSuccess(provider: string, userId: string) {
    this.info('OAuth', `${provider} OAuth successful`, {
      provider,
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  oauthError(provider: string, error: Error | string) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    this.error('OAuth', `${provider} OAuth failed`, errorObj, {
      provider,
      timestamp: new Date().toISOString(),
    })
  }

  // Supabase auth logging
  authSessionCheck(userId: string | null, isAuthenticated: boolean) {
    this.debug('Supabase Auth', 'Session check', {
      userId,
      isAuthenticated,
      timestamp: new Date().toISOString(),
    })
  }

  authSignupStart(email: string, authMethod: 'email' | 'oauth') {
    this.info('Supabase Auth', 'Sign up started', {
      email,
      authMethod,
      timestamp: new Date().toISOString(),
    })
  }

  authSignupSuccess(userId: string, email: string) {
    this.info('Supabase Auth', 'Sign up successful', {
      userId,
      email,
      timestamp: new Date().toISOString(),
    })
  }

  authSignupError(email: string, error: Error | string) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    this.error('Supabase Auth', 'Sign up failed', errorObj, {
      email,
      timestamp: new Date().toISOString(),
    })
  }

  authSigninStart(email: string, authMethod: 'email' | 'oauth') {
    this.info('Supabase Auth', 'Sign in started', {
      email,
      authMethod,
      timestamp: new Date().toISOString(),
    })
  }

  authSigninSuccess(userId: string, email: string) {
    this.info('Supabase Auth', 'Sign in successful', {
      userId,
      email,
      timestamp: new Date().toISOString(),
    })
  }

  authSigninError(email: string, error: Error | string) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    this.error('Supabase Auth', 'Sign in failed', errorObj, {
      email,
      timestamp: new Date().toISOString(),
    })
  }

  // User profile logging
  userProfileCreated(userId: string, email: string, username: string) {
    this.info('User Profile', 'Profile created successfully', {
      userId,
      email,
      username,
      timestamp: new Date().toISOString(),
    })
  }

  userProfileError(userId: string, error: Error | string, context?: string) {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    this.error('User Profile', `Profile operation failed${context ? `: ${context}` : ''}`, errorObj, {
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  // Get all logs
  getAllLogs(): LogEntry[] {
    return [...this.logs]
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level)
  }

  // Get logs by component
  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter((log) => log.component === component)
  }

  // Export logs as JSON (useful for debugging)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }
}

// Export singleton instance
export const authLogger = new AuthLogger()
