import React, { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ChatSidebar from '../components/widgets/ChatSidebar'
import ChatHeader from '../components/widgets/ChatHeader'
import ChatArea from '../components/widgets/ChatArea'

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

    const recentChats = useMemo(() => (
        Object.keys(messagesByChat).map((id, idx) => ({
            id,
            title: messagesByChat[id][0]?.content?.slice(0, 24) || `Chat ${idx + 1}`,
            updatedAt: 'just now',
        }))
    ), [messagesByChat])

    const currentMessages = messagesByChat[activeChatId] || []

    function generateSyntheticResponse(prompt = '', files = []) {
        const text = String(prompt || '').trim()
        const words = (text.match(/[A-Za-z0-9_-]+/g) || []).map(w => w.toLowerCase())
        const longWords = Array.from(new Set(words.filter(w => w.length > 4)))
        const top = longWords.slice(0, 5)
        const attachNote = files && files.length > 0 ? `\n\nAttachments noted (${files.length}).` : ''
        if (!text) return 'I received your message. Provide more details and I will draft an actionable plan.'
        const summary = text.length > 180 ? `${text.slice(0, 180)}…` : text
        return (
            `Summary\n- ${summary}\n\nKey points` +
            (top.length ? top.map(k => `\n- ${k}`).join('') : '\n- Clarify objectives\n- Desired outcome\n- Constraints') +
            `\n\nNext steps\n- Outline goals and success criteria\n- Identify data/resources needed\n- Propose a concise plan or draft` + attachNote
        )
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
                // Also synthesize an assistant reply for the seeded message
                setTimeout(() => {
                    setMessagesByChat(prev => {
                        const list = prev[id] || []
                        const last = list[list.length - 1]
                        if (last && last.role === 'assistant') return prev
                        const reply = {
                            id: Date.now() + 1,
                            role: 'assistant',
                            content: generateSyntheticResponse(initialMsg.content, initialMsg.files),
                            createdAt: new Date().toISOString()
                        }
                        return { ...prev, [id]: [...list, reply] }
                    })
                }, 550)
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

        // Synthetic AI behavior: add one generated reply after a brief delay
        await new Promise((r) => setTimeout(r, 550))
        setMessagesByChat((prev) => {
            const nowList = prev[activeChatId] || []
            // If the last message is already assistant (avoid duplicates), do not append
            const last = nowList[nowList.length - 1]
            if (last && last.role === 'assistant') return prev
            const reply = { id: Date.now() + 1, role: 'assistant', content: generateSyntheticResponse(text, files), createdAt: new Date().toISOString() }
            return {
                ...prev,
                [activeChatId]: [...nowList, reply],
            }
        })
        setIsProcessing(false)
    }

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


