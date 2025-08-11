import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import StreamingMonaco from './StreamingMonaco'
import CodeBlock from './CodeBlock'

export default function StreamingMessageView({ text }) {
    const [parts, setParts] = useState([])
    const [isInCode, setIsInCode] = useState(false)
    const [currentLang, setCurrentLang] = useState('')
    const [currentCode, setCurrentCode] = useState('')
    const [isStreaming, setIsStreaming] = useState(true)
    const [tokens, setTokens] = useState([])
    const [lastLength, setLastLength] = useState(0)
    const containerRef = useRef(null)
    const prevTextRef = useRef('')

    // Detect streaming state
    useEffect(() => {
        const timer = setTimeout(() => {
            if (text === prevTextRef.current) {
                setIsStreaming(false)
            }
        }, 1000)

        if (text !== prevTextRef.current) {
            setIsStreaming(true)
        }

        prevTextRef.current = text
        return () => clearTimeout(timer)
    }, [text])

    // Handle token animation
    useEffect(() => {
        if (text.length > lastLength) {
            const newText = text.slice(lastLength)
            const newTokens = newText.split('').map((char, idx) => ({
                id: `${Date.now()}-${lastLength + idx}`,
                content: char
            }))

            setTokens(prev => [...prev, ...newTokens])
            setLastLength(text.length)
        } else if (text.length < lastLength) {
            setTokens([])
            setLastLength(0)
        }
    }, [text, lastLength])

    // Parse markdown and code blocks
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
                if (content.slice(i, i + 3) === '```') {
                    if (mdContent) {
                        newParts.push({ type: 'markdown', content: mdContent })
                        mdContent = ''
                    }

                    i += 3
                    let langEnd = i
                    while (langEnd < content.length && content[langEnd] !== '\n') {
                        langEnd++
                    }
                    lang = content.slice(i, langEnd).trim() || 'plaintext'
                    i = langEnd + 1

                    inCode = true
                    codeContent = ''
                } else {
                    mdContent += content[i]
                    i++
                }
            } else {
                if (content.slice(i, i + 3) === '```') {
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

        if (mdContent) {
            newParts.push({ type: 'markdown', content: mdContent })
        }

        setParts(newParts)
        setIsInCode(inCode)
        setCurrentLang(lang)
        setCurrentCode(codeContent)
    }, [text])

    // Render function for animated tokens
    const renderAnimatedTokens = () => {
        return tokens.map((token, index) => (
            <motion.span
                key={token.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.2,
                    ease: "easeOut",
                }}
                className="inline"
            >
                {token.content}
            </motion.span>
        ))
    }

    return (
        <motion.div
            className="md max-w-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Only show completed parts for markdown and code blocks */}
            {parts.length > 0 && parts.map((part, index) => (
                part.type === 'code' ? (
                    <motion.div
                        key={`code-${index}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="my-4"
                    >
                        <CodeBlock className={`language-${part.lang}`}>
                            {part.content}
                        </CodeBlock>
                    </motion.div>
                ) : null // Don't render markdown parts here
            ))}

            {/* For active code block */}
            {isInCode && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="my-4"
                >
                    <StreamingMonaco
                        language={currentLang}
                        value={currentCode}
                    />
                </motion.div>
            )}

            {/* Animated tokens for text content */}
            <div className="streaming-text">
                {renderAnimatedTokens()}

                {/* Blinking cursor only during active streaming */}
                {isStreaming && (
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-block w-0.5 h-4 bg-orange-400 align-middle"
                    />
                )}

                <span ref={containerRef} />
            </div>
        </motion.div>
    )
}


