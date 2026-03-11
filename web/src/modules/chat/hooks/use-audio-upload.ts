import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"

type UploadAudioResult = {
  publicUrl: string
  key: string
}

export function useAudioUpload() {
  return useMutation({
    mutationFn: async ({
      blob,
      duration,
      conversationId,
    }: {
      blob: Blob
      duration: number
      conversationId: string
    }): Promise<UploadAudioResult> => {
      const rawMime = blob.type || "audio/webm"
      const baseMime = rawMime.split(";")[0] as "audio/webm" | "audio/mp4"

      const { data, error } = await api.uploads["presigned-url"].post({
        contentType: baseMime,
        audioDuration: duration,
        conversationId,
      })

      if (error) throw new Error("Failed to get presigned URL")
      if (!data) throw new Error("No data returned")

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": blob.type || "audio/webm",
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      return {
        publicUrl: data.publicUrl,
        key: data.key,
      }
    },
  })
}
