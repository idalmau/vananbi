
import Link from 'next/link'
import { createClient } from '@/shared/lib/supabase/server'

import { ScrollToTop } from '@/shared/components/ScrollToTop'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <main className="flex-grow">
        <div className="relative isolate pt-14 dark:bg-black">
          <div className="mx-auto max-w-7xl px-6 pt-4 pb-12 sm:pt-8 sm:pb-16 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                Encuentra estancias únicas, <span className="text-blue-600">pensadas para ti</span>.
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Descubre vans locales que ofrecen más que solo un lugar para dormir. Experimenta la cultura y comodidad de hosts verificados.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {user?.user_metadata?.role === 'host' ? (
                  <Link href="/dashboard" className="rounded-full bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-gray-200 active:scale-95 transition-transform">
                    Ir a mis anuncios
                  </Link>
                ) : (
                  <Link href="/search" className="rounded-full bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95 transition-transform">
                    Empezar a explorar
                  </Link>
                )}
                {(!user || user.user_metadata?.role !== 'host') && (
                  <Link href="/signup?role=host" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-600 active:scale-95 transition-transform inline-block">
                    Conviértete en Host <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Decorative background blur */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl overflow-hidden py-12 px-6 sm:py-16 lg:px-8">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; 2026 Vananbi, Inc. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
