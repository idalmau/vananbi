'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getBookingTrends, MonthlyTrend } from '@/modules/booking/analytics'

interface Listing {
    id: string
    title: string
}

interface BookingTrendsProps {
    listings: Listing[]
    hostId: string
}

export function BookingTrends({ listings, hostId }: BookingTrendsProps) {
    const [year, setYear] = useState(new Date().getFullYear())
    const [listingId, setListingId] = useState<string>('all')
    const [data, setData] = useState<MonthlyTrend[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const trends = await getBookingTrends(hostId, year, listingId)
                setData(trends)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [hostId, year, listingId])

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tendencia de Reservas</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Noches reservadas por mes</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={listingId}
                        onChange={(e) => setListingId(e.target.value)}
                        className="block rounded-md border-gray-300 dark:border-zinc-700 py-2 pl-3 pr-10 text-base focus:border-black focus:outline-none focus:ring-black sm:text-sm dark:bg-zinc-800 dark:text-white"
                    >
                        <option value="all">Todos los vehículos</option>
                        {listings.map((l) => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                    </select>

                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="block rounded-md border-gray-300 dark:border-zinc-700 py-2 pl-3 pr-10 text-base focus:border-black focus:outline-none focus:ring-black sm:text-sm dark:bg-zinc-800 dark:text-white"
                    >
                        {[2024, 2025, 2026].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                            <Bar
                                name={`Año anterior (${year - 1})`}
                                dataKey="previous"
                                fill="#E5E7EB"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                name={`Año actual (${year})`}
                                dataKey="current"
                                fill="#000000"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}
