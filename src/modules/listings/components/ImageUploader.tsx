'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { uploadListingImage, deleteListingImage } from '../actions'
import { ListingImage } from '../types'

interface ImageUploaderProps {
    listingId: string
    currentImages: ListingImage[]
}

export function ImageUploader({ listingId, currentImages }: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = Array.from(e.dataTransfer.files)
        await handleFiles(files)
    }

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            await handleFiles(files)
        }
    }

    const handleFiles = async (files: File[]) => {
        const validFiles = files.filter(file => file.type.startsWith('image/'))
        if (validFiles.length === 0) return

        setIsUploading(true)

        // Upload sequentially or parallel
        for (const file of validFiles) {
            const formData = new FormData()
            formData.append('file', file)
            await uploadListingImage(listingId, formData)
        }

        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDelete = async (imageId: string, storagePath: string) => {
        if (!confirm('¿Estás seguro de eliminar esta imagen?')) return
        await deleteListingImage(imageId, listingId, storagePath)
    }

    return (
        <div className="space-y-6">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${isDragging
                        ? 'border-black bg-gray-50 dark:border-white dark:bg-zinc-800'
                        : 'border-gray-300 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-600'
                    }
                `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                    {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        <Upload className="h-8 w-8" />
                    )}
                    <p className="text-sm font-medium">
                        {isUploading ? 'Subiendo...' : 'Arrastra tus fotos aquí o haz clic para seleccionar'}
                    </p>
                    <p className="text-xs">JPG, PNG (max 5MB)</p>
                </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {currentImages.map((image) => (
                    <div key={image.id} className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-900">
                        <Image
                            src={image.url}
                            alt="Listing image"
                            fill
                            className="object-cover"
                            unoptimized // For user uploaded content if external, but Supabase Storage is usually fine. Adding unoptimized just in case.
                        />
                        <button
                            onClick={() => handleDelete(image.id, image.storage_path)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
