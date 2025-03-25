"use client"

import React, {useState, useEffect, useRef} from "react"
import dynamic from "next/dynamic"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"
import {Skeleton} from "@/components/ui/skeleton"
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    Check,
    ZoomIn,
    ZoomOut,
    Loader2,
    Download,
    Pen,
    AlarmSmoke
} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import {SignatureOptionsModal} from "./signature-options-modal"
import {SignatureDisplay} from "./signature-display"
import fontkit from '@pdf-lib/fontkit';

// Import PDF.js worker
import "@/lib/pdf-worker"
import {useFileStore} from "@/store/fileStore";
import {useRouter} from "next/navigation";

// Dynamically import react-pdf to avoid SSR issues
const PDFDocument = dynamic(() => import("react-pdf").then((mod) => mod.Document), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]"/>,
})

const PDFPage = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[800px]"/>,
})

interface SignatureFieldData {
    id: string
    pageNumber: number
    position: { x: number; y: number }
    size: { width: number; height: number }
    signatureType?: string
    signatureValue?: string
}

export function PdfPreview({
                               pdfUrl,
                               signatureFields: initialSignatureFields,
                           }: {
    pdfUrl: string
    signatureFields: SignatureFieldData[]
}) {
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [scale, setScale] = useState(1)
    const [loading, setLoading] = useState(true)
    const [pageWidth, setPageWidth] = useState<number | null>(null)
    const [pageHeight, setPageHeight] = useState<number | null>(null)
    const [signatureFields, setSignatureFields] = useState<SignatureFieldData[]>(initialSignatureFields)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [finalizing, setFinalizing] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const {reset} = useFileStore()
    const {toast} = useToast()
    const router = useRouter()

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

    const handlePageRendered = ({width, height}: { width: number; height: number }) => {
        setPageWidth(width)
        setPageHeight(height)
    }

    const handleSignatureClick = (fieldId: string) => {
        setSelectedFieldId(fieldId)
        setIsModalOpen(true)
    }

    const handleSignatureSelect = (type: string, value: string | File | null) => {
        if (!selectedFieldId) return

        setSignatureFields((fields) =>
            fields.map((field) => {
                if (field.id === selectedFieldId) {
                    let signatureValue = ""

                    if (type === "upload" && value instanceof File) {
                        const reader = new FileReader()
                        reader.onload = () => {
                            setSignatureFields((currentFields) =>
                                currentFields.map((f) =>
                                    f.id === selectedFieldId ? {
                                        ...f,
                                        signatureType: type,
                                        signatureValue: reader.result as string
                                    } : f,
                                ),
                            )
                        }
                        reader.readAsDataURL(value)
                    } else if (type === "text" && typeof value === "string") {
                        signatureValue = value
                    }

                    return {
                        ...field,
                        signatureType: type,
                        signatureValue: type === "text" ? signatureValue : field.signatureValue,
                    }
                }
                return field
            }),
        )
    }

    const downloadBlob = async (urlData: string, filename: string) => {
        const response = await fetch(urlData);
        const blob = await response.blob();
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const handleFinalizeDocument = async () => {
        try {
            setFinalizing(true);

            // Load the original PDF
            const response = await fetch(pdfUrl);
            const pdfBlob = await response.blob();
            const pdfArrayBuffer = await pdfBlob.arrayBuffer();

            // Import jsPDF dynamically to ensure it's only loaded on the client side
            const {jsPDF} = await import("jspdf");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "pt",
            });

            // Load the PDF into jsPDF (this approach works better for modifying existing PDFs)
            // Note: jsPDF's addPage and other methods might be needed here

            // Alternative approach using pdf-lib which is more reliable for PDF manipulation
            const {PDFDocument, rgb, StandardFonts} = await import("pdf-lib");
            const existingPdfBytes = await pdfBlob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes);

            pdfDoc.registerFontkit(fontkit);

            let signatureFont;
            try {
                const fontResponse = await fetch('https://fonts.gstatic.com/s/dancingscript/v24/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3Sup5.ttf');
                const fontBytes = await fontResponse.arrayBuffer();
                signatureFont = await pdfDoc.embedFont(fontBytes);

            } catch {
                signatureFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            }

            // Add signatures to each page
            for (const field of signatureFields) {
                if (!field.signatureType || field.signatureType === "none") continue;

                const page = pdfDoc.getPages()[field.pageNumber - 1];
                const {width, height} = page.getSize();

                if (field.signatureType === "text" && field.signatureValue) {
                    page.drawText(field.signatureValue, {
                        x: field.position.x,
                        y: height - field.position.y - 30, // Adjust for PDF coordinate system
                        size: 22,
                        font: signatureFont,
                        color: rgb(0, 0, 0),
                    });
                } else if (field.signatureType === "upload" && field.signatureValue) {
                    const imageBytes = await fetch(field.signatureValue).then(res => res.arrayBuffer());
                    let image;

                    if (field.signatureValue.includes("image/png")) {
                        image = await pdfDoc.embedPng(imageBytes);
                    } else if (field.signatureValue.includes("image/jpeg")) {
                        image = await pdfDoc.embedJpg(imageBytes);
                    }

                    if (image) {
                        page.drawImage(image, {
                            x: field.position.x,
                            y: height - field.position.y - field.size.height, // Adjust for PDF coordinate system
                            width: field.size.width,
                            height: field.size.height,
                        });
                    }
                }
            }

            // Save the modified PDF
            const modifiedPdfBytes = await pdfDoc.save();
            const blob = new Blob([modifiedPdfBytes], {type: "application/pdf"});
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement("a");
            a.href = url;
            a.download = "signed_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: "Document finalized!",
                description: "Your signed document has been downloaded.",
            });
        } catch (error) {
            console.error("Error finalizing document:", error);
            toast({
                title: "Error finalizing document",
                description: "There was a problem creating your signed PDF.",
                variant: "destructive",
            });
        } finally {
            setFinalizing(false);
        }
    };

    // Get the current page's signature fields
    const currentPageFields = signatureFields.filter((field) => field.pageNumber === pageNumber)

    // Get pages that have signature fields
    const pagesWithSignatures = [...new Set(signatureFields.map((field) => field.pageNumber))].sort((a, b) => a - b)

    // Function to navigate to a specific page
    const goToPage = (page: number) => {
        if (page >= 1 && page <= (numPages || 1)) {
            setPageNumber(page)
        }
    }

    const handleReset = () => {
        reset()
        router.push("/")
    }

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
                                <Button variant="outline" size="sm"
                                        onClick={() => downloadBlob(pdfUrl, "Original File")}>
                                    <Download className="h-4 w-4 mr-1"/> Download Original
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Download the original PDF document</p>
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

            {/* Signature page navigation */}
            {pagesWithSignatures.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">Jump to signature:</span>
                    {pagesWithSignatures.map((page) => (
                        <Button
                            key={page}
                            variant={pageNumber === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="gap-1"
                        >
                            <Pen className="h-3 w-3"/> Page {page}
                        </Button>
                    ))}
                </div>
            )}

            <Card className="relative overflow-auto bg-slate-800 p-4">
                {loading && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4"/>
                        <p className="text-muted-foreground">Loading PDF document...</p>
                    </div>
                )}

                <div
                    className="relative mx-auto"
                    style={{
                        width: pageWidth ? pageWidth * scale : "auto",
                        height: pageHeight ? pageHeight * scale : "auto",
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

                        {/* Signature fields overlay */}
                        {currentPageFields.map((field) => (
                            <div
                                key={field.id}
                                className="absolute border-2 border-primary bg-primary/10 rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-primary/20 transition-colors"
                                style={{
                                    left: field.position.x * scale,
                                    top: field.position.y * scale,
                                    width: field.size.width * scale,
                                    height: field.size.height * scale,
                                    zIndex: 10,
                                }}
                                onClick={() => handleSignatureClick(field.id)}
                            >
                                <SignatureDisplay
                                    type={field.signatureType || "none"}
                                    value={field.signatureValue || null}
                                    className="w-full h-full"
                                />
                            </div>
                        ))}
                    </PDFDocument>
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Badge variant={currentPageFields.length > 0 ? "default" : "outline"} className="h-6">
                        {currentPageFields.length} signature {currentPageFields.length === 1 ? "field" : "fields"} on
                        this page
                    </Badge>
                    <Badge variant="outline" className="h-6">
                        {signatureFields.length} total {signatureFields.length === 1 ? "field" : "fields"}
                    </Badge>
                    {pagesWithSignatures.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1 sm:mt-0">
                            Signatures on pages: {pagesWithSignatures.join(", ")}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" onClick={handleReset}>
                                    <AlarmSmoke className="h-4 w-4 mr-1"/> Reset
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reset all the current progress, and upload new file</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button onClick={handleFinalizeDocument} className="gap-2" disabled={finalizing}>
                        {finalizing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin"/> Processing...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4"/> Finalize & Download
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Signature options modal */}
            <SignatureOptionsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSignatureSelect={handleSignatureSelect}
            />

            {/* Hidden canvas for PDF rendering */}
            <canvas ref={canvasRef} className="hidden"/>
        </div>
    )
}