"use client";

import type React from "react";
import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {
    FileUpIcon,
    Loader2,
} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import SimplePdfViewer from "./simple-pdf-viewer";
import {uploadPdf} from "@/app/actions";
import {useFileStore} from "@/store/fileStore";

export function UploadForm() {
    const {file, fileUrl, setFile, setFileData, reset} = useFileStore();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (fileUrl) {
            router.prefetch("/editor");
        }
    }, [fileUrl, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        try {
            setUploading(true);
            setProgress(0);
            setFileData({fileUrl: null});

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => (prev >= 95 ? prev : prev + 5));
            }, 200);

            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadPdf(formData);

            clearInterval(progressInterval);
            if (result.success) {
                setProgress(100);
                setFileData({
                    fileUrl: result.url,
                    fileName: file.name,
                    fileSize: file.size,
                });
            } else {
                alert("Failed to upload file");
                setProgress(0);
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Please try again.");
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    // If file is uploaded, show preview and continue button
    if (fileUrl) {
        return (
            <div className="flex flex-col space-y-4">
                <SimplePdfViewer pdfUrl={fileUrl} reset={() => reset()}/>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Upload PDF Document</CardTitle>
                <CardDescription>Upload a PDF file to add signature fields</CardDescription>
            </CardHeader>
            <form ref={formRef} onSubmit={handleSubmit}>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="pdf-upload">PDF File</Label>
                            <Input
                                id="pdf-upload"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] || null);
                                }}
                                className="cursor-pointer"
                                disabled={uploading}
                            />
                            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}

                            {uploading && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center justify-between">
                                        <Label>Uploading</Label>
                                        <span className="text-xs text-muted-foreground">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2"/>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="submit" disabled={!file || uploading} className="w-full">
                                    {uploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            Upload PDF
                                            <FileUpIcon className="ml-2 h-4 w-4"/>
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Upload your PDF to continue</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardFooter>
            </form>
        </Card>
    );
}