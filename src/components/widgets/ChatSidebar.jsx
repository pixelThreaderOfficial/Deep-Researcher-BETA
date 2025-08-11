import React from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '../../lib/utils'
import {
    Plus,
    Search,
    BookOpen,
    Folder,
    Cpu,
    Menu,
} from 'lucide-react'

const NavButton = ({ icon: Icon, label, onClick, active = false }) => (
    <Button
        variant="outline"
        className={cn(
            'w-full justify-start gap-2 bg-transparent hover:bg-gray-700/50 border-gray-700 text-gray-200',
            active && 'bg-gray-700/60'
        )}
        onClick={onClick}
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </Button>
)

const ChatSidebar = ({
    recentChats = [],
    onNewChat,
    onSelectChat,
    activeChatId,
}) => {
    return (
        <aside className="hidden md:flex md:w-72 lg:w-80 shrink-0 h-screen sticky top-0 flex-col bg-gray-900/70 border-r border-gray-800">
            {/* Top */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                        <Menu className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-100">Deep Researcher</span>
                </div>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={onNewChat}>
                    <Plus className="w-4 h-4" />
                    New
                </Button>
            </div>

            {/* Nav */}
            <div className="p-3 grid gap-2">
                <NavButton icon={Plus} label="New chat" onClick={onNewChat} />
                <NavButton icon={Search} label="Search chats" onClick={() => { }} />
                <NavButton icon={BookOpen} label="Library" onClick={() => { }} />
                <NavButton icon={Folder} label="Files" onClick={() => { }} />
                <NavButton icon={Cpu} label="Models" onClick={() => { }} />
            </div>

            {/* Recent Chats */}
            <div className="px-3 mt-2">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Recent</p>
                <div className="space-y-1 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
                    {recentChats.length === 0 && (
                        <div className="text-sm text-gray-500 px-2 py-3">No recent chats</div>
                    )}
                    {recentChats.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => onSelectChat?.(chat.id)}
                            className={cn(
                                'w-full text-left px-2 py-2 rounded-md text-gray-300 hover:bg-gray-800 transition',
                                activeChatId === chat.id && 'bg-gray-800 text-gray-100'
                            )}
                        >
                            <div className="truncate text-sm">{chat.title}</div>
                            <div className="text-xs text-gray-500">{chat.updatedAt}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Profile */}
            <div className="mt-auto p-3 border-t border-gray-800">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback className="bg-gray-700 text-gray-200">U</AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                        <div className="text-sm text-gray-100">Boss</div>
                        <div className="text-xs text-gray-500">boss@example.com</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default ChatSidebar


