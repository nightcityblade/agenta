import type {FileUIPart, UIMessage} from "ai"
import type {UploadFile} from "antd"

import {attachmentContentUrl} from "./attachmentMedia"
import type {SessionAttachmentResponse} from "./attachmentTransport"

/** Helpers for sending and rendering attachment references without embedding file bytes. */

export type FileKind = "image" | "audio" | "video" | "file"

/** Map an IANA media type to the `FileCard` `type` or a render branch. */
export const fileKind = (mediaType: string): FileKind => {
    if (mediaType.startsWith("image/")) return "image"
    if (mediaType.startsWith("audio/")) return "audio"
    if (mediaType.startsWith("video/")) return "video"
    return "file"
}

/** Convert uploaded tray entries into reference-carrying AI SDK file parts. */
export const filesToParts = (
    files: UploadFile<SessionAttachmentResponse>[],
    sessionId: string,
): FileUIPart[] =>
    files.map((file) => {
        const attachment = file.response?.attachment
        if (!attachment) throw new Error(`Attachment upload is incomplete: ${file.name}`)
        return {
            type: "file",
            mediaType: attachment.media_type,
            filename: attachment.filename,
            url: attachmentContentUrl(sessionId, attachment.attachment_id),
            providerMetadata: {
                agenta: {attachmentId: attachment.attachment_id, size: attachment.size},
            },
        }
    })

/** Preserve the pre-upload voice path by reading recorder files into inline data URLs. */
export const filesToInlineParts = (files: File[]): Promise<FileUIPart[]> =>
    Promise.all(
        files.map(
            (file) =>
                new Promise<FileUIPart>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onerror = () => reject(reader.error)
                    reader.onload = () =>
                        resolve({
                            type: "file",
                            mediaType: file.type || "application/octet-stream",
                            filename: file.name,
                            url: reader.result as string,
                        })
                    reader.readAsDataURL(file)
                }),
        ),
    )

/** The `file` parts of a message, in order. */
export const fileParts = (message: UIMessage): FileUIPart[] =>
    message.parts.filter((part) => part.type === "file") as FileUIPart[]

/** The Agenta attachment id carried by a reference part, if present. */
export const attachmentIdForPart = (part: FileUIPart): string | null => {
    const agenta = part.providerMetadata?.agenta
    if (!agenta || typeof agenta !== "object") return null
    const attachmentId = (agenta as {attachmentId?: unknown}).attachmentId
    return typeof attachmentId === "string" && attachmentId ? attachmentId : null
}

/** A readable label for a file part. */
export const filePartName = (part: FileUIPart): string => part.filename || "attachment"

/** Attachment names visible to delivery notices, keyed by their following assistant message. */
export const attachmentNamesByMessage = (
    messages: UIMessage[],
): Map<string, ReadonlyMap<string, string>> => {
    const result = new Map<string, ReadonlyMap<string, string>>()
    let precedingUserFiles = new Map<string, string>()

    for (const message of messages) {
        if (message.role === "user") {
            precedingUserFiles = new Map()
            for (const part of fileParts(message)) {
                const attachmentId = attachmentIdForPart(part)
                if (attachmentId) precedingUserFiles.set(attachmentId, filePartName(part))
            }
        } else {
            result.set(message.id, precedingUserFiles)
        }
    }

    return result
}
