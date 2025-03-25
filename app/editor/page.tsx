"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {PdfEditor} from "@/components/pdf-editor"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"
import {useFileStore} from "@/store/fileStore";
import {Skeleton} from "@/components/ui/skeleton";
import {Separator} from "@/components/ui/separator";

export default function EditorPage() {
    const router = useRouter();
    const {fileUrl, hydrated} = useFileStore();

    useEffect(() => {
        // Redirect to upload page if no PDF is present
        if (hydrated && !fileUrl) {
            router.replace("/");
        }
    }, [fileUrl, hydrated, router]);

    if (!hydrated) {
        // Skeleton loader while Zustand is hydrating
        return (
            <div className="container mx-auto py-10 px-4">
                <Skeleton className="h-8 w-2/3 mb-4"/>
                <Skeleton className="h-6 w-1/2 mb-6"/>
                <Skeleton className="h-[600px] w-full"/>
            </div>
        );
    }

    if (!fileUrl) {
        return (
            <div className="container mx-auto py-10 px-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>No PDF URL provided. Please upload a PDF file first.</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold mb-4">Place Signature Fields</h1>
            <p className="text-muted-foreground mb-6">Click on the document where you need signatures</p>
            <Separator className="my-6"/>
            <PdfEditor pdfUrl={fileUrl}/>
        </div>
    )
}

