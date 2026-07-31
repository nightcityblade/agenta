import {fileURLToPath} from "node:url"

import {defineConfig} from "vitest/config"

export default defineConfig({
    oxc: {jsx: {runtime: "automatic"}},
    resolve: {
        alias: {
            "@/oss": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: [
            "src/components/AgentChatSlice/assets/attachments.test.ts",
            "src/components/AgentChatSlice/assets/attachmentTransport.test.ts",
            "src/components/AgentChatSlice/assets/files.test.ts",
            "src/components/AgentChatSlice/assets/inFlightSubmit.test.ts",
            "src/components/AgentChatSlice/assets/transcriptToMessages.test.ts",
            "src/components/AgentChatSlice/hooks/useAttachmentUploads.test.ts",
        ],
        reporters: ["default", "junit"],
        outputFile: {
            junit: "./test-results/junit.xml",
        },
    },
})
