import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Paperclip, Send, Loader2, Copy, Volume2, RefreshCw, Sparkles } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { FileText, Image as ImageIcon, File } from 'lucide-react'
import StreamingText from './StreamingText'

const ChatArea = ({ messages, onSend, isProcessing }) => {
    const [input, setInput] = useState('')
    const [attachedFiles, setAttachedFiles] = useState([])
    const [isRecording, setIsRecording] = useState(false)
    const [isMultiline, setIsMultiline] = useState(false)
    const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false)
    const messagesContainerRef = useRef(null)
    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)
    const microphoneRef = useRef(null)

    const fileTypes = [
        { id: 'images', name: 'Images', icon: ImageIcon, description: 'PNG, JPG, GIF' },
        { id: 'pdfs', name: 'PDFs', icon: FileText, description: 'PDF files' },
        { id: 'documents', name: 'Documents', icon: FileText, description: 'DOC, DOCX, TXT' },
    ]

    useEffect(() => {
        if (messagesContainerRef.current) {
            const el = messagesContainerRef.current
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
        }
    }, [messages?.length, isProcessing])

    useEffect(() => {
        if (!textareaRef.current) return
        const el = textareaRef.current
        el.style.height = 'auto'
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`
        const hasNewline = input.includes('\n')
        const overflowed = (el.scrollHeight - el.clientHeight) > 6
        const hasAttachments = attachedFiles.length > 0
        setIsMultiline(hasNewline || overflowed || hasAttachments)
    }, [input, attachedFiles.length])

    const getAcceptedFileTypes = (fileTypeName) => {
        switch (fileTypeName) {
            case 'Images':
                return 'image/*'
            case 'PDFs':
                return '.pdf'
            case 'Documents':
                return '.doc,.docx,.txt,.rtf,.odt'
            default:
                return 'image/*,.pdf,.doc,.docx,.txt,.rtf,.odt'
        }
    }

    const triggerFileInput = (fileTypeName = null) => {
        if (!fileInputRef.current) return
        if (fileTypeName) fileInputRef.current.accept = getAcceptedFileTypes(fileTypeName)
        fileInputRef.current.click()
    }

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        const withImportance = files.map((file) => ({ file, importance: 'medium' }))
        setAttachedFiles((prev) => [...prev, ...withImportance])
        e.target.value = ''
    }

    const updateFileImportance = (index, importance) => {
        setAttachedFiles((prev) => prev.map((f, i) => (i === index ? { ...f, importance } : f)))
    }

    const removeFile = (index) => {
        setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            microphoneRef.current = stream
        } catch (err) {
            setIsRecording(false)
        }
    }

    const stopRecording = () => {
        try {
            if (microphoneRef.current) {
                microphoneRef.current.getTracks().forEach((t) => t.stop())
                microphoneRef.current = null
            }
        } catch (err) { }
    }

    const send = () => {
        const text = input.trim()
        if (!text && attachedFiles.length === 0) return
        onSend?.(text, attachedFiles)
        setInput('')
        setAttachedFiles([])
    }

    const hasUserMessage = Array.isArray(messages) && messages.some(m => m.role === 'user')
    const isEmpty = Array.isArray(messages) ? messages.length === 0 : true

    return (
        <div className="flex-1 min-h-0 flex flex-col">

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 custom-scrollbar space-y-4 relative"
            >
                <AnimatePresence>
                    {(!hasUserMessage && isEmpty) && (
                        <motion.div
                            key="greeting-spacer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: '40vh', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 1, ease: 'easeInOut' }}
                            className="w-full"
                        >
                            <div className="h-full w-full flex items-center justify-center text-center">
                                <div>
                                    <h2 className="text-4xl sm:text-6xl font-bold merienda text-gray-100">Good Afternoon, Mr. Rana</h2>
                                    <p className="mt-10 text-gray-400 text-base">Start a conversation or attach files for analysis.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {messages?.map((m, idx) => (
                    <div key={m.id} className={`flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                        {m.role === 'user' ? (
                            <div className="max-w-[85%]" style={{ maxWidth: 'min(900px, 85%)' }}>
                                <div className="rounded-2xl px-4 py-2 bg-gray-800/70 border border-gray-700 text-gray-100 break-all">
                                    {m.content}
                                    {Array.isArray(m.files) && m.files.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {m.files.map((f, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-gray-700/60 border border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-200">
                                                    <File className="w-3.5 h-3.5 text-blue-400" />
                                                    <span className="truncate max-w-40">{f.file?.name || 'attachment'}</span>
                                                    {f.importance && (
                                                        <span className={`px-1.5 py-0.5 rounded ${f.importance === 'high'
                                                            ? 'bg-red-500/30 text-red-300'
                                                            : f.importance === 'medium'
                                                                ? 'bg-yellow-500/30 text-yellow-300'
                                                                : 'bg-blue-500/30 text-blue-300'
                                                            }`}>
                                                            {f.importance}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {m.createdAt && (
                                    <div className="mt-1 text-[10px] text-gray-500 text-right">
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-[85%] text-gray-100 leading-relaxed break-words whitespace-pre-wrap" style={{ maxWidth: 'min(900px, 85%)' }}>
                                {m.streaming ? (
                                    <StreamingText text={m.content} />
                                ) : (
                                    m.content
                                )}
                                {/* Assistant actions */}
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    <button
                                        onClick={() => navigator.clipboard?.writeText(m.content || '')}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 bg-gray-800/60 hover:bg-gray-700 text-gray-200"
                                        title="Copy"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            try {
                                                const u = new SpeechSynthesisUtterance(m.content || '')
                                                window.speechSynthesis?.speak(u)
                                            } catch { }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 bg-gray-800/60 hover:bg-gray-700 text-gray-200"
                                        title="Read aloud"
                                    >
                                        <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => console.log('regenerate requested for message', m.id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 bg-gray-800/60 hover:bg-gray-700 text-gray-200"
                                        title="Regenerate"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => console.log('retouch requested for message', m.id)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 bg-gray-800/60 hover:bg-gray-700 text-gray-200"
                                        title="Retouch"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <AnimatePresence>
                    {isProcessing && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking…
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* spacer */}
                <div />
            </div>

            {/* Composer */}
            <div className="p-3">
                <motion.div
                    initial={{ y: 20, opacity: 0, borderRadius: 999 }}
                    animate={{ y: 0, opacity: 1, borderRadius: isMultiline ? 14 : 999 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.6 }}
                    className={`bg-gray-800/80 border border-gray-700 p-3 overflow-hidden w-full max-w-[900px] mx-auto`}
                >
                    <div className={`flex ${isMultiline ? 'items-end' : 'items-center'} gap-3`}>
                        <DropdownMenu onOpenChange={setIsFileDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className={`inline-flex items-center justify-center p-3 text-gray-400 hover:text-gray-200 hover:bg-gray-600 ${isMultiline ? 'rounded-md' : 'rounded-full'} transition-all duration-200 border ${isFileDropdownOpen ? 'border-gray-700/40 bg-gray-700/20' : 'border-transparent'}`}>
                                    <Paperclip className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50" sideOffset={8}>
                                {fileTypes.map((type) => (
                                    <DropdownMenuItem
                                        key={type.id}
                                        onClick={() => setTimeout(() => triggerFileInput(type.name), 50)}
                                        className="group text-gray-200 hover:text-white focus:text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer px-3 py-2"
                                    >
                                        <type.icon className="w-4 h-4 mr-2" />
                                        <div>
                                            <div className="font-medium group-hover:text-white group-focus:text-white">{type.name}</div>
                                            <div className="text-xs text-gray-400 group-hover:text-gray-200 group-focus:text-gray-200">{type.description}</div>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <textarea
                            ref={textareaRef}
                            className={`flex-1 min-w-0 bg-transparent text-gray-100 resize-none outline-none text-base max-h-[200px] placeholder:text-gray-400 break-all ${isMultiline ? 'py-2 leading-relaxed min-h-[48px]' : 'h-[44px] min-h-[44px] leading-[44px] py-0'} px-0`}
                            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    send()
                                }
                            }}
                            rows={1}
                        />

                        <button
                            onClick={() => {
                                if (!isRecording) { setIsRecording(true); startRecording() }
                                else { setIsRecording(false); stopRecording() }
                            }}
                            className={`inline-flex items-center justify-center p-3 ${isMultiline ? 'rounded-md' : 'rounded-full'} transition-colors duration-200 ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <button
                            onClick={send}
                            disabled={isProcessing || (!input.trim() && attachedFiles.length === 0)}
                            className={`inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white p-3 ${isMultiline ? 'rounded-md' : 'rounded-full'} transition-colors duration-200 disabled:cursor-not-allowed`}
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Hidden file input */}
                    <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.odt" onChange={handleFileChange} />

                    {/* Files */}
                    <AnimatePresence>
                        {attachedFiles.length > 0 && (
                            <motion.div className="mt-3 flex flex-wrap gap-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                {attachedFiles.map((f, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200">
                                        <File className="w-4 h-4 text-blue-400" />
                                        <span className="truncate max-w-36">{f.file.name}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className={`text-xs px-2 py-0.5 rounded-md ${f.importance === 'high' ? 'bg-red-500/30 text-red-300' : f.importance === 'medium' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-blue-500/30 text-blue-300'}`}>{f.importance}</button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                                                <DropdownMenuItem onClick={() => updateFileImportance(idx, 'high')} className="text-red-300 hover:bg-gray-700 cursor-pointer">High</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateFileImportance(idx, 'medium')} className="text-yellow-300 hover:bg-gray-700 cursor-pointer">Medium</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => updateFileImportance(idx, 'low')} className="text-blue-300 hover:bg-gray-700 cursor-pointer">Low</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-400 p-1 rounded-md">✕</button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}

export default ChatArea


