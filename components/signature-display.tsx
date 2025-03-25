"use client"

import {useEffect, useState} from "react"

interface SignatureDisplayProps {
    type: string
    value: string | null
    className?: string
}

export function SignatureDisplay({type, value, className = ""}: SignatureDisplayProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null)

    useEffect(() => {
        if (type === "upload" && value) {
            setImageUrl(value)
        } else {
            setImageUrl(null)
        }
    }, [type, value])

    if (type === "upload" && imageUrl) {
        return (
            <div className={`flex justify-center items-center ${className}`}>
                <img src={imageUrl || "/placeholder.svg"} alt="Signature"
                     className="max-w-full max-h-full object-contain"/>
            </div>
        )
    }

    if (type === "text" && value) {
        return (
            <div className={`flex justify-center items-center ${className}`}>
                <p className="text-xl font-signature">{value}</p>
            </div>
        )
    }

    // Default "none" type or fallback
    return (
        <div className={`flex justify-center items-center ${className}`}>
            <p className="font-medium text-primary">Signature Required</p>
        </div>
    )
}