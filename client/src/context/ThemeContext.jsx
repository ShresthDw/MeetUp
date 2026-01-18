import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

const THEME_STORAGE_KEY = 'meetup_theme'

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  registerThemeBroadcaster: () => () => {},
  isDark: true,
})

function applyThemeToDom(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'light' || savedTheme === 'dark') {
        applyThemeToDom(savedTheme)
        return savedTheme
      }
    } catch {
      // Ignore storage errors
    }
    applyThemeToDom('dark')
    return 'dark' // Default to dark theme
  })

  const broadcastHandlersRef = useRef(new Set())
  const isDark = theme === 'dark'

  const registerThemeBroadcaster = useCallback((handler) => {
    if (typeof handler === 'function') {
      broadcastHandlersRef.current.add(handler)
    }
    return () => {
      broadcastHandlersRef.current.delete(handler)
    }
  }, [])

  useEffect(() => {
    applyThemeToDom(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  const toggleTheme = (options = { broadcast: true }) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyThemeToDom(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Ignore storage errors
    }
    setThemeState(next)

    if (options?.broadcast !== false) {
      broadcastHandlersRef.current.forEach((fn) => {
        try {
          fn(next)
        } catch (err) {
          console.error('Theme broadcaster error:', err)
        }
      })
    }
  }

  const setTheme = (newTheme, options = { broadcast: true }) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      applyThemeToDom(newTheme)
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      } catch {
        // Ignore storage errors
      }
      setThemeState(newTheme)

      if (options?.broadcast !== false) {
        broadcastHandlersRef.current.forEach((fn) => {
          try {
            fn(newTheme)
          } catch (err) {
            console.error('Theme broadcaster error:', err)
          }
        })
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, registerThemeBroadcaster, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
