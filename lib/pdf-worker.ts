import { pdfjs } from "react-pdf"

// The workerSrc property shall be specified.
// This needs to be set only once, so placing this in a shared file is a good idea
const setPdfWorker = () => {
    // Use CDN URL for the worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.2.146/pdf.worker.min.js`
}

export default setPdfWorker