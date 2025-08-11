import React, { useMemo, useState } from 'react'
import ChatSidebar from '../components/widgets/ChatSidebar'
import ChatHeader from '../components/widgets/ChatHeader'
import ChatArea from '../components/widgets/ChatArea'

const Chat = () => {
    const [activeChatId, setActiveChatId] = useState('ch_1')
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

    const handleNewChat = () => {
        const newId = `ch_${Date.now()}`
        setMessagesByChat((prev) => ({
            ...prev,
            [newId]: [
                { id: Date.now(), role: 'assistant', content: 'New chat started. What would you like to do?' },
            ],
        }))
        setActiveChatId(newId)
    }

    const handleSelectChat = (id) => setActiveChatId(id)

    const handleSend = async (text, files) => {
        const userMsg = { id: Date.now(), role: 'user', content: text, files, createdAt: new Date().toISOString() }
        setMessagesByChat((prev) => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), userMsg],
        }))
        setIsProcessing(true)

        await new Promise((r) => setTimeout(r, 700))
        const reply = { id: Date.now() + 1, role: 'assistant', content: 'Here is a first-pass response. Want me to go deeper?', createdAt: new Date().toISOString() }
        setMessagesByChat((prev) => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), reply],
        }))
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


