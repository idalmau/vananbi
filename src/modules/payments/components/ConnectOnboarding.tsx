'use client'

import { useState, useEffect } from 'react'
import { loadConnectAndInitialize, StripeConnectInstance } from '@stripe/connect-js'
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from '@stripe/react-connect-js'

import { getAccountSessionClientSecret } from '@/modules/payments/actions'

export function ConnectOnboarding() {
    const [stripeConnectInstance, setStripeConnectInstance] = useState<StripeConnectInstance>()

    useEffect(() => {
        const fetchConnectInstance = async () => {
             const instance = await loadConnectAndInitialize({
                  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
                  locale: 'es',
                  fetchClientSecret: async () => {
                      const res = await getAccountSessionClientSecret()
                      if (res.error) throw new Error(res.error)
                      return res.clientSecret!
                  },
                  appearance: {
                      overlays: 'dialog',
                      variables: {
                          colorPrimary: '#000000', 
                          colorBackground: '#ffffff',
                          colorText: '#18181b', 
                          colorDanger: '#ef4444',
                          fontFamily: 'inherit',
                          borderRadius: '12px'
                      }
                  }
             })
             setStripeConnectInstance(instance)
        }

        fetchConnectInstance()
    }, [])

    if (!stripeConnectInstance) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 rounded-full border-4 border-gray-200 border-t-black"></div>
            </div>
        )
    }

    return (
        <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding 
                onExit={() => {
                    // Refresh to reflect the updated state in the dashboard
                    window.location.reload()
                }}
            />
        </ConnectComponentsProvider>
    )
}
