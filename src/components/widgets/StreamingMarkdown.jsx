import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import StreamingMonaco from './StreamingMonaco'

function splitStreamingMarkdown(text) {
    // Find the last unmatched opening fence ```lang\n ... (without closing ```)
    const fenceRegex = /```([a-zA-Z0-9_-]+)?\n/g
    let match
    const openings = []
    while ((match = fenceRegex.exec(text)) !== null) {
        openings.push({ index: match.index, lang: match[1] || 'plaintext', fenceLen: match[0].length })
    }
    if (openings.length === 0) {
        return { prefix: text, open: null }
    }
    // For each opening, check if there is a closing fence after it
    // We only care about the last opening that doesn't have a matching closing
    for (let i = openings.length - 1; i >= 0; i--) {
        const open = openings[i]
        const after = text.slice(open.index + open.fenceLen)
        const closeIdx = after.indexOf('```')
        if (closeIdx === -1) {
            // Unclosed block
            const code = after
            const prefix = text.slice(0, open.index)
            return { prefix, open: { lang: open.lang, code } }
        }
    }
    // All openings are closed
    return { prefix: text, open: null }
}

function StreamingMarkdownImpl({ text }) {
    const { prefix, open } = useMemo(() => splitStreamingMarkdown(text || ''), [text])

    return (
        <div className="md max-w-none">
            {prefix && (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {prefix}
                </ReactMarkdown>
            )}
            {open && (
                <StreamingMonaco language={open.lang} value={open.code} />
            )}
        </div>
    )
}

const StreamingMarkdown = memo(StreamingMarkdownImpl, (prev, next) => prev.text === next.text)
export default StreamingMarkdown


