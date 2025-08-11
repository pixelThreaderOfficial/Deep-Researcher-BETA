import React, { useEffect, useRef, memo } from 'react'
import Editor from '@monaco-editor/react'

function StreamingMonacoImpl({ language = 'plaintext', value = '', height = 300 }) {
    const editorRef = useRef(null)
    const initialRef = useRef(true)

    useEffect(() => {
        if (!editorRef.current) return
        const model = editorRef.current.getModel?.()
        if (!model) return
        const prev = model.getValue()
        if (prev !== value) {
            model.setValue(value)
        }
    }, [value])

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
            <Editor
                height={`${height}px`}
                defaultLanguage={language}
                defaultValue={value}
                onMount={(editor) => {
                    editorRef.current = editor
                    // ensure initial value set exactly once
                    if (initialRef.current) {
                        const model = editor.getModel?.()
                        if (model && model.getValue() !== value) model.setValue(value)
                        initialRef.current = false
                    }
                }}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' }}
                theme="vs-dark"
            />
        </div>
    )
}

const StreamingMonaco = memo(StreamingMonacoImpl)
export default StreamingMonaco


