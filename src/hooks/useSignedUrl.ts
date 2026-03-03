import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolves a photo_url to a signed URL for private storage buckets.
 * If the value is already a full URL (legacy), it extracts the file path.
 * Returns a short-lived signed URL (1 hour).
 */
export const useSignedUrl = (
  photoUrl: string | null | undefined,
  bucket = "membres-photos",
  expiresIn = 3600
) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!photoUrl) {
      setSignedUrl(null);
      return;
    }

    let filePath = photoUrl;

    // If it's a full Supabase URL, extract the path after /object/public/<bucket>/
    const publicMatch = photoUrl.match(
      /\/object\/(?:public|sign)\/[^/]+\/(.+)/
    );
    if (publicMatch) {
      filePath = decodeURIComponent(publicMatch[1]);
    }

    // If it starts with http but isn't a Supabase URL, use as-is (external)
    if (filePath.startsWith("http")) {
      setSignedUrl(filePath);
      return;
    }

    const getSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (data && !error) {
        setSignedUrl(data.signedUrl);
      } else {
        setSignedUrl(null);
      }
    };

    getSignedUrl();
  }, [photoUrl, bucket, expiresIn]);

  return signedUrl;
};
