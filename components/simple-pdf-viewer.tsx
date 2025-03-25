"use client"

import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import React, { useEffect, useState } from "react";
import {AlarmSmoke, ArrowRight, Loader2, ZoomIn, ZoomOut} from "lucide-react";

import "@/lib/pdf-worker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {Badge} from "@/components/ui/badge";

const PDFDocument = dynamic(() => import("react-pdf").then((mod) => mod.Document), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]" />,
});

const PDFPage = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]" />,
});

export default function SimplePdfViewer({ pdfUrl, reset }: { pdfUrl: string; reset: () => void }) {
    const router = useRouter();
    const [scale, setScale] = useState(1);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState<number>(0);

    useEffect(() => {
        const setupPdfjs = async () => {
            const { pdfjs } = await import("react-pdf");
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js`;
        };
        setupPdfjs();
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const handleContinue = () => {
        if (!pdfUrl) {
            toast({
                title: "Waiting",
                description: "Please upload a PDF file before continuing",
                variant: "destructive",
            });
            return;
        }
        router.push("/editor");
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={reset}>
                                    <AlarmSmoke className="h-4 w-4 mr-1" /> Reset
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reset all the current progress, and upload new file</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={handleContinue}>
                                    Continue to Editor <ArrowRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Open the original PDF in a new tab</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setScale((prev) => prev + 0.1)}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Zoom in</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm"
                                        onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}>
                                    <ZoomOut className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Zoom out</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Badge variant="outline" className="h-9 px-3 flex items-center">
                        {Math.round(scale * 100)}%
                    </Badge>
                </div>
            </div>

            <Card className="relative overflow-y-auto max-h-[800px] bg-slate-800 p-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading PDF document...</p>
                    </div>
                )}

                <div className="relative mx-auto">
                    <PDFDocument
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="mx-auto"
                        loading={<Skeleton className="w-full h-[800px]" />}
                        error={
                            <div className="flex flex-col items-center justify-center p-12">
                                <p className="text-destructive">Failed to load PDF document</p>
                            </div>
                        }
                    >
                        {Array.from(new Array(numPages), (_, index) => (
                            <PDFPage
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                loading={<Skeleton className="w-full h-[800px]" />}
                            />
                        ))}
                    </PDFDocument>
                </div>
            </Card>
        </div>
    );
}