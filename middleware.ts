import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"

export function middleware(request: NextRequest) {
    // Check if the request is for the PDF.js worker
    if (request.nextUrl.pathname === "/pdf.worker.min.js") {
        // Redirect to the CDN version
        return NextResponse.redirect("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js")
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/pdf.worker.min.js"],
}

