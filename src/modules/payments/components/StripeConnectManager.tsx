'use client'

import { useState } from 'react'
import { getAccountSessionClientSecret } from '@/modules/payments/actions'
import { ConnectOnboarding } from './ConnectOnboarding'

interface StripeConnectManagerProps {
    hasRequirementsDue: boolean
    payoutsEnabled: boolean
    hasStripeAccount: boolean
}

export function StripeConnectManager({ hasRequirementsDue, payoutsEnabled, hasStripeAccount }: StripeConnectManagerProps) {
    const [isOpen, setIsOpen] = useState(false)

    if (isOpen) {
        return (
            <div className="border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
                <ConnectOnboarding />
            </div>
        )
    }

    const isUrgent = (hasStripeAccount && hasRequirementsDue) || (hasStripeAccount && !payoutsEnabled)

    return (
        <div className="space-y-4">
            {isUrgent ? (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                        Información requerida
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                        Necesitamos actualizar algunos datos legales o fiscales para poder enviarte el dinero de tus reservas.
                    </p>
                </div>
            ) : !hasStripeAccount ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        Vananbi utiliza <strong>Stripe</strong> para enviar tus ganancias de forma segura directamente a tu cuenta bancaria. 
                        No es necesario que lo configures hasta que recibas fondos.
                    </p>
                </div>
            ) : (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                            Cuenta de cobro verificada
                        </span>
                    </div>
                </div>
            )}
            
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
                {hasStripeAccount ? 'Gestionar Datos de Cobro' : 'Configurar Cuenta Bancaria'}
            </button>
        </div>
    )
}
