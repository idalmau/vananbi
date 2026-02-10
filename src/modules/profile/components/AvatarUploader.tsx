'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { uploadAvatar } from '../actions'
import { Camera, Loader2, X } from 'lucide-react'

interface AvatarUploaderProps {
    currentAvatarUrl?: string | null
    userId: string
    size?: number
}

export function AvatarUploader({ currentAvatarUrl, userId, size = 128 }: AvatarUploaderProps) {
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Auto upload on select (or we could add a save button)
        handleUpload(file)
    }

    const handleUpload = async (file: File) => {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadAvatar(formData)

        if (result.success && result.url) {
            setAvatarUrl(result.url)
            setPreviewUrl(null)
        } else {
            alert(result.error || 'Error uploading avatar')
            setPreviewUrl(null)
        }
        setIsUploading(false)
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const displayUrl = previewUrl || avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`

    return (
        <div className="relative group inline-block">
            <div
                className="relative overflow-hidden rounded-full border-4 border-white dark:border-zinc-800 shadow-lg cursor-pointer transition-transform hover:scale-105"
                style={{ width: size, height: size }}
                onClick={triggerFileInput}
            >
                <Image
                    src={displayUrl}
                    alt="Profile Avatar"
                    fill
                    className={`object-cover ${isUploading ? 'opacity-50' : ''}`}
                />

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-8 w-8 text-white" />
                </div>

                {/* Loading State */}
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    )
}
