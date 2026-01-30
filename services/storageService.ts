
import { supabase } from "./supabase";

export const storageService = {
  /**
   * Uploads a Base64 image to Supabase Storage and returns the storage path and a temporary signed URL.
   * Works with both Public and Private buckets.
   */
  async uploadImage(userId: string, base64Image: string, fileName: string): Promise<{ path: string, signedUrl: string } | null> {
    try {
      // 1. Efficient Base64 to Blob conversion using fetch
      // This avoids the stack overflow or freezing issues of atob() on large strings
      const res = await fetch(base64Image);
      const blob = await res.blob();

      const filePath = `${userId}/${fileName}.jpg`;

      // 2. Upload to 'user-uploads' bucket
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // 3. Create Signed URL (valid for 1 hour for immediate session use)
      const { data, error: signError } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(filePath, 3600);

      if (signError || !data?.signedUrl) {
        throw signError || new Error("Could not sign URL");
      }

      return { path: filePath, signedUrl: data.signedUrl };
    } catch (error) {
      console.error('Storage service error:', error);
      return null;
    }
  },

  /**
   * Generates a signed URL for a given storage path.
   * Essential for Private buckets where public URLs don't work.
   */
  async getSignedUrl(path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }
};
