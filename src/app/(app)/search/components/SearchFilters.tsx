'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { VEHICLE_TYPE_OPTIONS, HANDOVER_METHOD_OPTIONS } from '@/modules/listings/types'
import { cn } from '@/shared/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, Filter, X, SlidersHorizontal, Settings2 } from 'lucide-react'

export function SearchFilters() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // Get active filters as arrays
    const activeVehicleTypes = searchParams.get('vehicle_type')?.split(',').filter(Boolean) || []
    const activeHandoverMethods = searchParams.get('handover_method')?.split(',').filter(Boolean) || []

    const updateFilter = useCallback((key: string, values: string[]) => {
        const params = new URLSearchParams(searchParams.toString())
        if (values.length > 0) {
            params.set(key, values.join(','))
        } else {
            params.delete(key)
        }
        router.push(`${pathname}?${params.toString()}`)
    }, [searchParams, router, pathname])

    const toggleItem = (key: string, currentValues: string[], value: string) => {
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value]
        updateFilter(key, newValues)
    }

    const clearFilters = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('vehicle_type')
        params.delete('handover_method')
        router.push(`${pathname}?${params.toString()}`)
    }, [searchParams, router, pathname])

    const totalActiveFilters = activeVehicleTypes.length + activeHandoverMethods.length
    const hasActiveFilters = totalActiveFilters > 0

    return (
        <div className="flex flex-wrap items-center gap-3 mb-8">
            <Popover>
                <PopoverTrigger asChild>
                    <button className={cn(
                        "flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-200 shadow-sm",
                        hasActiveFilters
                            ? "border-black bg-black text-white hover:bg-zinc-800"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    )}>
                        <SlidersHorizontal className={cn("w-4 h-4", hasActiveFilters ? "text-white" : "text-gray-500")} />
                        <span>Filtros</span>
                        {hasActiveFilters && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-white text-black rounded-full text-[10px] font-extrabold">
                                {totalActiveFilters}
                            </span>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-5 rounded-2xl shadow-xl border-gray-100" align="start">
                    <div className="space-y-8">
                        {/* Vehicle Type Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Tipo de vehículo</h3>
                                {activeVehicleTypes.length > 0 && (
                                    <button 
                                        onClick={() => updateFilter('vehicle_type', [])}
                                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {VEHICLE_TYPE_OPTIONS.map(opt => (
                                    <label
                                        key={opt.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-all"
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={activeVehicleTypes.includes(opt.id)}
                                                onChange={() => toggleItem('vehicle_type', activeVehicleTypes, opt.id)}
                                                className="w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black cursor-pointer transition-all checked:bg-black"
                                            />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors">{opt.label}</span>
                                            <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{opt.icon}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Handover Method Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Método de entrega</h3>
                                {activeHandoverMethods.length > 0 && (
                                    <button 
                                        onClick={() => updateFilter('handover_method', [])}
                                        className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {HANDOVER_METHOD_OPTIONS.map(opt => (
                                    <label
                                        key={opt.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer group transition-all"
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={activeHandoverMethods.includes(opt.id)}
                                                onChange={() => toggleItem('handover_method', activeHandoverMethods, opt.id)}
                                                className="w-5 h-5 rounded-md border-gray-300 text-black focus:ring-black cursor-pointer transition-all checked:bg-black"
                                            />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-black transition-colors">{opt.label}</span>
                                            <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">{opt.icon}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer / Results Count could go here if we wanted to make it a Modal with a "Show Results" button */}
                    </div>
                </PopoverContent>
            </Popover>

            {hasActiveFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-400 hover:text-black transition-all ml-1 group"
                >
                    <X className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                    <span className="border-b border-transparent group-hover:border-black">Limpiar todo</span>
                </button>
            )}
        </div>
    )
}
