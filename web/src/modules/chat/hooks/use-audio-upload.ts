import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"



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
    }): Promise<{ publicUrl: string; key: string }> => {
      const mimeType = blob.type
      if (!mimeType) throw new Error("Invalid blob type")

      const { data, error } = await api.uploads["presigned-url"].post({
        contentType: mimeType,
        audioDuration: duration,
        conversationId,
      })

      if (error) throw new Error("Failed to get presigned URL")
      if (!data) throw new Error("No data returned")

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": mimeType,
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
