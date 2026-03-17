import { getProfileById } from '@/modules/profile/service'
import { getListingsByHost } from '@/modules/listings/service'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, MapPin, Calendar, CheckCircle2, Star, MessageSquare } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function HostProfilePage({ params }: { params: { id: string } }) {
    const hostId = (await params).id
    const host = await getProfileById(hostId)
    
    if (!host) {
        notFound()
    }

    const listings = await getListingsByHost(hostId)

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Host Details */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl shadow-gray-200/20 dark:shadow-none">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-40 w-40 rounded-full bg-gray-200 overflow-hidden relative ring-8 ring-gray-50 dark:ring-zinc-800 shadow-inner mb-6">
                                <Image
                                    src={host.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${host.id}`}
                                    alt="Host"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                                    {host.email ? host.email.split('@')[0] : 'Usuario'}
                                </h1>
                                <ShieldCheck className="h-7 w-7 text-blue-500" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Anfitrión</p>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span>Miembro desde {host.created_at ? new Date(host.created_at).getFullYear() : '2024'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-green-600 dark:text-green-500 font-semibold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-2xl text-sm w-fit">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Identidad verificada</span>
                            </div>
                        </div>

                        <div className="my-8 border-t border-gray-100 dark:border-zinc-800"></div>

                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Estadísticas</h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Ratio respuesta</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{host.response_rate || 100}%</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Tiempo resp.</p>
                                    <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{host.response_time || 'pocas horas'}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Idiomas</p>
                                    <div className="flex gap-2 mt-1">
                                        {(host.languages || ['Español']).map(lang => (
                                            <span key={lang} className="text-lg" title={lang}>
                                                {lang === 'Español' ? '🇪🇸' : lang === 'English' ? '🇬🇧' : lang === 'Francés' ? '🇫🇷' : lang}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio & Listings */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6">Sobre mí</h2>
                        <div className="p-8 rounded-3xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800">
                            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                "{host.about || 'Hola! Soy un apasionado de las rutas en camper y me encanta compartir mis vehículos con otros viajeros.'}"
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Vehículos de {host.email ? host.email.split('@')[0] : 'este anfitrión'}</h2>
                            <span className="text-gray-500 font-bold">{listings.length} anuncio{listings.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {listings.length > 0 ? (
                                listings.map(listing => (
                                    <Link 
                                        key={listing.id} 
                                        href={`/listings/${listing.id}`}
                                        className="group bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-zinc-800 hover:shadow-xl transition-all hover:-translate-y-1"
                                    >
                                        <div className="h-48 w-full relative">
                                            <Image
                                                src={listing.image_url || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800'}
                                                alt={listing.title}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                                                <span className="text-xs font-black text-gray-900 dark:text-white">4.9</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-orange-600 transition-colors">{listing.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {listing.location}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-xl font-black text-gray-900 dark:text-white">
                                                    {(listing.price_per_night / 100).toFixed(0)}€ <span className="text-xs font-medium text-gray-500">/ noche</span>
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
                                    <p className="text-gray-500 font-medium">Este anfitrión no tiene anuncios públicos actualmente.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
