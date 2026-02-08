import { CreditCard, CalendarDays, Percent } from 'lucide-react'
import { HostMetrics } from '@/modules/booking/metrics'

export function StatsCards({ metrics }: { metrics: HostMetrics }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(metrics.totalRevenue / 100)}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                        <CalendarDays className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reservas</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalBookings}</h3>
                    </div>
                </div>
            </div>



            <div className="bg-white dark:bg-zinc-900 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Percent className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ocupación (30d)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.occupancyRate}%</h3>
                    </div>
                </div>
            </div>
        </div>
    )
}
