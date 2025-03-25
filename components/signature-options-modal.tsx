"use client"

import type React from "react"

import {useState, useRef} from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Upload, Type, Square} from "lucide-react"

interface SignatureOptionsModalProps {
    isOpen: boolean
    onClose: () => void
    onSignatureSelect: (type: string, value: string | File | null) => void
}

export function SignatureOptionsModal({isOpen, onClose, onSignatureSelect}: SignatureOptionsModalProps) {
    const [activeTab, setActiveTab] = useState("upload")
    const [textSignature, setTextSignature] = useState("")
    const [uploadedSignature, setUploadedSignature] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        setUploadedSignature(file)

        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setPreviewUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            setPreviewUrl(null)
        }
    }

    const handleApply = () => {
        switch (activeTab) {
            case "upload":
                onSignatureSelect("upload", uploadedSignature)
                break
            case "text":
                onSignatureSelect("text", textSignature)
                break
            case "none":
                onSignatureSelect("none", null)
                break
        }
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Signature</DialogTitle>
                    <DialogDescription>Choose how you want to add your signature to the document.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="h-4 w-4"/>
                            <span>Upload</span>
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2">
                            <Type className="h-4 w-4"/>
                            <span>Text</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="signature-upload">Upload Signature Image</Label>
                            <Input
                                id="signature-upload"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            {previewUrl && (
                                <div className="mt-4 border rounded-md p-4 flex justify-center">
                                    <img
                                        src={previewUrl || "/placeholder.svg"}
                                        alt="Signature preview"
                                        className="max-h-24 object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-signature">Type Your Signature</Label>
                            <Input
                                id="text-signature"
                                value={textSignature}
                                onChange={(e) => setTextSignature(e.target.value)}
                                placeholder="Type your name"
                            />

                            {textSignature && (
                                <div className="mt-4 border rounded-md p-4 flex justify-center">
                                    <p className="text-xl font-signature">{textSignature}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply}>Apply</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}