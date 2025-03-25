"use client"

import type React from "react"

import {useState, useRef, useEffect} from "react"
import dynamic from "next/dynamic"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {SignatureField} from "@/components/signature-field"
import {Card} from "@/components/ui/card"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Badge} from "@/components/ui/badge"
import {Skeleton} from "@/components/ui/skeleton"
import {ChevronLeft, ChevronRight, FileText, Save, ZoomIn, ZoomOut, Loader2, AlarmSmoke, Check} from "lucide-react"
import {useFileStore} from "@/store/fileStore";
import {SignatureFieldData} from "@/store/fileStore";

// Import PDF.js worker
import "@/lib/pdf-worker"

// Dynamically import react-pdf to avoid SSR issues
const PDFDocument = dynamic(() => import("react-pdf").then((mod) => mod.Document), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]"/>,
})

const PDFPage = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]"/>,
})

export function PdfEditor({pdfUrl}: { pdfUrl: string }) {
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1)
    const [pageHeight, setPageHeight] = useState<number | null>(null)
    const [pageWidth, setPageWidth] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [isProcess, setProcess] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const {signatureFields, setSignatureFields, reset} = useFileStore();

    // Set up PDF.js worker
    useEffect(() => {
        const setupPdfjs = async () => {
            const {pdfjs} = await import("react-pdf")
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js`
        }
        setupPdfjs()
    }, [])

    const onDocumentLoadSuccess = ({numPages}: { numPages: number }) => {
        setNumPages(numPages)
        setLoading(false)
    }

    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Check if a signature field already exists for this page
        const hasSignatureOnCurrentPage = signatureFields.some((field) => field.pageNumber === pageNumber)

        if (hasSignatureOnCurrentPage) {
            return
        }

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Add a new signature field
            const newField: SignatureFieldData = {
                id: `sig-${Date.now()}`,
                pageNumber,
                position: {x, y},
                size: {width: 200, height: 80},
            }

            setSignatureFields([...signatureFields, newField])
        }
    }

    const handleFieldUpdate = (
        id: string,
        position: { x: number; y: number },
        size: { width: number; height: number },
    ) => {
        setSignatureFields((fields) => fields.map((field) => (field.id === id ? {...field, position, size} : field)))
    }

    const handleFieldDelete = (id: string) => {
        setSignatureFields((fields) => fields.filter((field) => field.id !== id))
    }

    const handleSubmit = () => {
        setProcess(true)
        router.push("/preview");
    }

    const handleReset = () => {
        router.push("/");
        reset()
    }

    const handlePageRendered = ({width, height}: { width: number; height: number }) => {
        setPageWidth(width)
        setPageHeight(height)
    }

    const currentPageFields = signatureFields.filter((field) => field.pageNumber === pageNumber)
    const hasSignatureOnCurrentPage = currentPageFields.length > 0

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1"/> Previous
                    </Button>
                    <div className="flex items-center space-x-2 px-2 bg-muted rounded-md h-9">
                        <span className="text-sm">Page {pageNumber}</span>
                        {numPages && <span className="text-sm text-muted-foreground">of {numPages}</span>}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageNumber((prev) => Math.min(prev + 1, numPages || 1))}
                        disabled={!numPages || pageNumber >= numPages}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1"/>
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => handleReset()}>
                                    <AlarmSmoke className="h-4 w-4 mr-1"/> Reset
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
                                <Button variant="outline" size="sm" asChild>
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-4 w-4 mr-1"/> Open PDF
                                    </a>
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
                                    <ZoomIn className="h-4 w-4"/>
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

            <Card className="relative overflow-auto bg-slate-800 p-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4"/>
                        <p className="text-muted-foreground">Loading PDF document...</p>
                    </div>
                )}

                <div
                    ref={containerRef}
                    className="relative mx-auto"
                    onClick={handlePageClick}
                    style={{
                        width: pageWidth ? pageWidth * scale : "auto",
                        height: pageHeight ? pageHeight * scale : "auto",
                        cursor: hasSignatureOnCurrentPage ? "default" : "crosshair",
                    }}
                >
                    <PDFDocument
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="mx-auto"
                        loading={<Skeleton className="w-full h-[800px]"/>}
                        error={
                            <div className="flex flex-col items-center justify-center p-12">
                                <p className="text-destructive">Failed to load PDF document</p>
                            </div>
                        }
                    >
                        <PDFPage
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onRenderSuccess={handlePageRendered}
                            loading={<Skeleton className="w-full h-[800px]"/>}
                        />
                    </PDFDocument>

                    {currentPageFields.map((field) => (
                        <SignatureField
                            key={field.id}
                            id={field.id}
                            position={field.position}
                            size={field.size}
                            scale={scale}
                            onUpdate={(position, size) => handleFieldUpdate(field.id, position, size)}
                            onDelete={() => handleFieldDelete(field.id)}
                        />
                    ))}
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Badge variant={hasSignatureOnCurrentPage ? "default" : "outline"} className="h-6">
                        {currentPageFields.length} signature {currentPageFields.length === 1 ? "field" : "fields"} on
                        this page
                    </Badge>
                    <Badge variant="outline" className="h-6">
                        {signatureFields.length} total {signatureFields.length === 1 ? "field" : "fields"}
                    </Badge>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        {hasSignatureOnCurrentPage
                            ? "Drag to move • Drag corner to resize"
                            : "Click on the document to add a signature field"}
                    </p>
                    <Button onClick={handleSubmit} disabled={signatureFields.length === 0 || isProcess}>
                        {isProcess ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin"/> Processing...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4x"/> Proceed to signing
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}