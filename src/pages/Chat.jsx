import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ChatSidebar from '../components/widgets/ChatSidebar'
import ChatHeader from '../components/widgets/ChatHeader'
import ChatArea from '../components/widgets/ChatArea'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

const Chat = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const initialId = id || 'ch_1'
    const [activeChatId, setActiveChatId] = useState(initialId)
    const [isProcessing, setIsProcessing] = useState(false)
    const [messagesByChat, setMessagesByChat] = useState({
        ch_1: [],
    })
    const [model] = useState('granite3-moe')
    const [currentTaskId, setCurrentTaskId] = useState(null)
    const unlistenRefs = useRef({ stream: null, done: null })

    const recentChats = useMemo(() => (
        Object.keys(messagesByChat).map((id, idx) => ({
            id,
            title: messagesByChat[id][0]?.content?.slice(0, 24) || `Chat ${idx + 1}`,
            updatedAt: 'just now',
        }))
    ), [messagesByChat])

    const currentMessages = messagesByChat[activeChatId] || []

    function buildOllamaMessagesFrom(list) {
        return (list || []).map(m => ({ role: m.role, content: m.content }))
    }

    async function startAssistantStream(chatId, historyOverride = null) {
        // Stop any previous running stream to avoid mixing outputs
        if (currentTaskId) {
            try { await invoke('cmd_force_stop', { taskId: currentTaskId }) } catch { }
            if (unlistenRefs.current.stream) { unlistenRefs.current.stream(); unlistenRefs.current.stream = null }
            if (unlistenRefs.current.done) { unlistenRefs.current.done(); unlistenRefs.current.done = null }
        }

        const history = historyOverride || buildOllamaMessagesFrom(messagesByChat[chatId])
        try {
            const taskId = await invoke('cmd_stream_chat_start', {
                model,
                messages: history,
            })
            setCurrentTaskId(taskId)
            const replyId = Date.now() + 1
            setMessagesByChat(prev => ({
                ...prev,
                [chatId]: [...(prev[chatId] || []), { id: replyId, role: 'assistant', content: '', streaming: true, createdAt: new Date().toISOString() }]
            }))

            // Cleanup any previous listeners
            if (unlistenRefs.current.stream) { unlistenRefs.current.stream(); unlistenRefs.current.stream = null }
            if (unlistenRefs.current.done) { unlistenRefs.current.done(); unlistenRefs.current.done = null }

            unlistenRefs.current.stream = await listen('ollama:stream', (event) => {
                const payload = event?.payload || {}
                if (payload.taskId !== taskId) return
                const token = payload.token || ''
                setMessagesByChat(prev => ({
                    ...prev,
                    [chatId]: (prev[chatId] || []).map(m => m.id === replyId ? { ...m, content: (m.content || '') + token } : m)
                }))
            })

            unlistenRefs.current.done = await listen('ollama:stream_done', (event) => {
                const payload = event?.payload || {}
                if (payload.taskId !== taskId) return
                setMessagesByChat(prev => ({
                    ...prev,
                    [chatId]: (prev[chatId] || []).map(m => m.id === replyId ? { ...m, streaming: false } : m)
                }))
                setIsProcessing(false)
                setCurrentTaskId(null)
                if (unlistenRefs.current.stream) { unlistenRefs.current.stream(); unlistenRefs.current.stream = null }
                if (unlistenRefs.current.done) { unlistenRefs.current.done(); unlistenRefs.current.done = null }
            })
        } catch (e) {
            console.error('Failed to start stream:', e)
            setIsProcessing(false)
            setCurrentTaskId(null)
        }
    }

    useEffect(() => {
        if (id && id !== activeChatId) setActiveChatId(id)
        const state = location.state || {}
        const initialMsg = state && state.initialMsg
        if (initialMsg && id) {
            // Prevent duplicate seeding if user reloads or navigates back
            const seededKey = `seeded:${id}`
            if (!sessionStorage.getItem(seededKey)) {
                sessionStorage.setItem(seededKey, '1')
                setMessagesByChat(prev => ({
                    ...prev,
                    [id]: [...(prev[id] || []), initialMsg]
                }))
                setIsProcessing(true)
                const history = buildOllamaMessagesFrom([...(messagesByChat[id] || []), initialMsg])
                startAssistantStream(id, history)
            }
            navigate(location.pathname, { replace: true, state: {} })
        }
    }, [id])

    const handleNewChat = () => {
        const newId = `ch_${Date.now()}`
        setMessagesByChat((prev) => ({
            ...prev,
            [newId]: [
                { id: Date.now(), role: 'assistant', content: 'New chat started. What would you like to do?' },
            ],
        }))
        setActiveChatId(newId)
        navigate(`/chat/${newId}`)
    }

    const handleSelectChat = (id) => {
        setActiveChatId(id)
        navigate(`/chat/${id}`)
    }

    const handleSend = async (text, files) => {
        const userMsg = { id: Date.now(), role: 'user', content: text, files, createdAt: new Date().toISOString() }
        setMessagesByChat((prev) => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), userMsg],
        }))
        setIsProcessing(true)
        const history = buildOllamaMessagesFrom([...(messagesByChat[activeChatId] || []), userMsg])
        startAssistantStream(activeChatId, history)
    }

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            if (unlistenRefs.current.stream) { unlistenRefs.current.stream(); unlistenRefs.current.stream = null }
            if (unlistenRefs.current.done) { unlistenRefs.current.done(); unlistenRefs.current.done = null }
            if (currentTaskId) {
                invoke('cmd_force_stop', { taskId: currentTaskId }).catch(() => { })
            }
        }
    }, [])

    return (
        <div className="h-screen">
            <div className="flex h-full">
                <ChatSidebar
                    recentChats={recentChats}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    activeChatId={activeChatId}
                />

                <main className="flex-1 h-full flex flex-col min-h-0">
                    <ChatHeader onOpenSettings={() => { }} />
                    <ChatArea
                        messages={currentMessages}
                        onSend={handleSend}
                        isProcessing={isProcessing}
                    />
                </main>
            </div>
        </div>
    )
}

export default Chat


