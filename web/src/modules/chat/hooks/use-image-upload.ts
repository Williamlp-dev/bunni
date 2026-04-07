import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"



export function useImageUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      conversationId,
    }: {
      file: File
      conversationId: string
    }): Promise<{ publicUrl: string; key: string }> => {
      const contentType = file.type

      const { data, error } = await api.uploads["presigned-url"].post({
        contentType,
        conversationId,
      })

      if (error) throw new Error("Failed to get presigned URL")
      if (!data) throw new Error("No data returned")

      const uploadResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`)
      }

      return { publicUrl: data.publicUrl, key: data.key }
    },
  })
}
