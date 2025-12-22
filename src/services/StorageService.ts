import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const StorageService = {
    /**
     * Upload a file to Firebase Storage
     * @param file The file to upload
     * @param path The path in storage (e.g., 'users/123/uploads/')
     * @returns Promise resolving to the download URL
     */
    uploadFile: async (file: File, path: string): Promise<string> => {
        try {
            // Create a unique filename to prevent overwrites
            const timestamp = Date.now();
            const uniqueName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const fullPath = `${path}/${uniqueName}`;

            const storageRef = ref(storage, fullPath);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error("Failed to upload file");
        }
    }
};
