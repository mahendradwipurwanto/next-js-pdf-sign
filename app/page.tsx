import {UploadForm} from "@/components/upload-form"
import {Separator} from "@/components/ui/separator"

export default function Home() {
    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-2">PDF Signature App</h1>
            <p className="text-muted-foreground mb-6">Upload a PDF document to add signature fields</p>
            <Separator className="my-6"/>
            <UploadForm/>
        </div>
    )
}

