"use client";

import {PdfPreview} from "@/components/pdf-preview"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {AlertCircle} from "lucide-react"
import {Separator} from "@/components/ui/separator"
import {useFileStore} from "@/store/fileStore";

export default function PreviewPage() {
    const {fileUrl, signatureFields} = useFileStore();

    if (!fileUrl || !signatureFields) {
        return (
            <div className="container mx-auto py-10 px-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        Missing PDF or signature fields data. Please go back and complete the previous steps.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold mb-4">Document Preview</h1>
            <p className="text-muted-foreground mb-2">Review your document with signature fields</p>
            <Separator className="my-6"/>
            <PdfPreview pdfUrl={fileUrl} signatureFields={signatureFields}/>
        </div>
    )
}

