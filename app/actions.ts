"use server"

import {put} from "@vercel/blob"
import {revalidatePath} from "next/cache"

export async function uploadPdf(formData: FormData) {
    try {
        const file = formData.get("file") as File

        if (!file) {
            return {success: false, error: "No file provided"}
        }

        if (file.type !== "application/pdf") {
            return {success: false, error: "Only PDF files are allowed"}
        }

        const blob = await put(file.name, file, {
            access: "public",
        })

        revalidatePath("/")

        return {
            success: true,
            url: blob.url,
            size: file.size,
            uploadedAt: new Date().toISOString(),
        }
    } catch (error) {
        console.error("Error uploading file:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "An unknown error occurred",
        }
    }
}

