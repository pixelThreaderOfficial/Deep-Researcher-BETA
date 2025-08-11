import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import StreamingMonaco from './StreamingMonaco'
import CodeBlock from './CodeBlock'

export default function StreamingMessageView({ text }) {
    const [parts, setParts] = useState([])
    const [isInCode, setIsInCode] = useState(false)
    const [currentLang, setCurrentLang] = useState('')
    const [currentCode, setCurrentCode] = useState('')

    useEffect(() => {
        const content = text || ''
        const newParts = []
        let inCode = false
        let lang = ''
        let codeContent = ''
        let mdContent = ''

        let i = 0
        while (i < content.length) {
            if (!inCode) {
                // Look for opening ```
                if (content.slice(i, i + 3) === '```') {
                    // Save any markdown before code block
                    if (mdContent) {
                        newParts.push({ type: 'markdown', content: mdContent })
                        mdContent = ''
                    }

                    // Find language and newline
                    i += 3
                    let langEnd = i
                    while (langEnd < content.length && content[langEnd] !== '\n') {
                        langEnd++
                    }
                    lang = content.slice(i, langEnd).trim() || 'plaintext'
                    i = langEnd + 1 // Skip newline

                    inCode = true
                    codeContent = ''
                } else {
                    mdContent += content[i]
                    i++
                }
            } else {
                // Look for closing ```
                if (content.slice(i, i + 3) === '```') {
                    // Save the code block
                    newParts.push({ type: 'code', lang, content: codeContent })
                    codeContent = ''
                    inCode = false
                    lang = ''
                    i += 3
                } else {
                    codeContent += content[i]
                    i++
                }
            }
        }

        // Handle remaining content
        if (mdContent) {
            newParts.push({ type: 'markdown', content: mdContent })
        }

        setParts(newParts)
        setIsInCode(inCode)
        setCurrentLang(lang)
        setCurrentCode(codeContent)
    }, [text])

    return (
        <div className="md max-w-none">
            {parts.map((part, index) => (
                part.type === 'markdown' ? (
                    <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
                        {part.content}
                    </ReactMarkdown>
                ) : (
                    <CodeBlock key={index} className={`language-${part.lang}`}>
                        {part.content}
                    </CodeBlock>
                )
            ))}

            {isInCode && (
                <StreamingMonaco
                    language={currentLang}
                    value={currentCode}
                />
            )}
        </div>
    )
}


