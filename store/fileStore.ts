import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SignatureFieldData {
    id: string;
    pageNumber: number;
    position: { x: number; y: number };
    size: { width: number; height: number };
    signatureType?: string;
    signatureValue?: string;
}

interface FileStore {
    file: File | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    uploadTime: string | null;
    signatureFields: SignatureFieldData[];
    hydrated: boolean;

    setFile: (file: File | null) => void;
    setFileData: (data: Partial<Omit<FileStore, "setFile" | "setFileData" | "reset">>) => void;
    reset: () => void;
    setSignatureFields: (
        fields: SignatureFieldData[] | ((prevFields: SignatureFieldData[]) => SignatureFieldData[])
    ) => void;
}

export const useFileStore = create<FileStore>()(
    persist(
        (set) => ({
            file: null,
            fileUrl: null,
            fileName: null,
            fileSize: null,
            uploadTime: null,
            signatureFields: [],
            hydrated: false,

            setFile: (file) => {
                if (file) {
                    set({
                        file,
                        fileName: file.name,
                        fileSize: file.size,
                        uploadTime: new Date().toISOString(),
                    });
                } else {
                    set({
                        file: null,
                        fileUrl: null,
                        fileName: null,
                        fileSize: null,
                        uploadTime: null,
                    });
                }
            },

            setFileData: (data) => set((state) => ({ ...state, ...data })),

            setSignatureFields: (fields) =>
                set((state) => ({
                    signatureFields: typeof fields === "function" ? fields(state.signatureFields) : fields,
                })),

            reset: () =>
                set({
                    file: null,
                    fileUrl: null,
                    fileName: null,
                    fileSize: null,
                    uploadTime: null,
                    signatureFields: [],
                }),
        }),
        {
            name: "fileStore",
            storage: createJSONStorage(() => sessionStorage), // ✅ Now using sessionStorage

            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.hydrated = true;
                }
            },
        }
    )
);