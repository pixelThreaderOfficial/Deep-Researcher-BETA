import React, { memo, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

function CodeBlockImpl({ className = '', inline, streaming = false, children, ...props }) {
    const raw = String(children || '')
    const value = raw.replace(/\n$/, '')
    const isSingleLine = !/\n/.test(value)
    const match = /language-(\w+)/.exec(className || '')

    // Inline or single-line: render simple code element (never Monaco)
    if (inline || isSingleLine) {
        return (
            <code className="px-1 py-0.5 rounded bg-gray-800/60 border border-gray-700" {...props}>
                {value}
            </code>
        )
    }

    const language = match ? match[1] : 'plaintext'
    const editorRef = useRef(null)

    useEffect(() => {
        if (streaming && editorRef.current) {
            const model = editorRef.current.getModel?.()
            const prev = model?.getValue?.() ?? ''
            if (prev !== value) {
                model?.setValue?.(value)
            }
        }
    }, [value, streaming])

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
            <Editor
                height="300px"
                defaultLanguage={language}
                // Use defaultValue and imperative updates during streaming to avoid re-mounts
                {...(streaming ? { defaultValue: value } : { value })}
                onMount={(editor) => { editorRef.current = editor }}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' }}
                theme="vs-dark"
            />
        </div>
    )
}

// Memoize to avoid re-mounting Monaco on unrelated re-renders
const CodeBlock = memo(CodeBlockImpl, (prev, next) => {
    const prevText = String(prev.children || '')
    const nextText = String(next.children || '')
    return prev.inline === next.inline && prev.streaming === next.streaming && prev.className === next.className && prevText === nextText
})

export default CodeBlock


