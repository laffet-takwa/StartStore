import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/context/theme-context'
import { CartProvider } from '@/context/cart-context'
import { I18nProvider } from '@/i18n/context'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { Toaster } from 'sonner'
import { LanguageScreen } from '@/components/common/language-screen'
import { useState } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const [languageSelected, setLanguageSelected] = useState(() => {
    try {
      return !!localStorage.getItem('starstore-language')
    } catch {
      return true
    }
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <I18nProvider>
              {!languageSelected && <LanguageScreen onComplete={() => setLanguageSelected(true)} />}
              {languageSelected && <RouterProvider router={router} />}
            </I18nProvider>
          </CartProvider>
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App