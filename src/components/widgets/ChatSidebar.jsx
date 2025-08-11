import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '../../lib/utils'
import { Plus, Search, BookOpen, Folder, Cpu, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

const NavItem = ({ icon: Icon, label, onClick, active = false, collapsed = false }) => (
    <button
        onClick={onClick}
        className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800/60 transition-colors',
            active && 'bg-gray-800/80 text-gray-100',
            collapsed && 'justify-center'
        )}
        title={collapsed ? label : undefined}
    >
        <Icon className="w-4 h-4" />
        {!collapsed && <span className="truncate">{label}</span>}
    </button>
)

const ChatSidebar = ({
    recentChats = [],
    onNewChat,
    onSelectChat,
    activeChatId,
}) => {
    const [query, setQuery] = useState('')
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        try {
            const saved = localStorage.getItem('dr.sidebar.collapsed')
            if (saved === '1') setCollapsed(true)
        } catch { }
    }, [])

    useEffect(() => {
        try { localStorage.setItem('dr.sidebar.collapsed', collapsed ? '1' : '0') } catch { }
    }, [collapsed])

    const filtered = useMemo(() => {
        if (!query) return recentChats
        const q = query.toLowerCase()
        return recentChats.filter(c => (c.title || '').toLowerCase().includes(q))
    }, [recentChats, query])

    return (
        <aside className={cn(
            'hidden md:flex shrink-0 h-screen sticky top-0 flex-col bg-gray-950/70 border-r border-gray-900/80 backdrop-blur-sm',
            collapsed ? 'w-16' : 'md:w-72 lg:w-80'
        )}>
            {/* Header */}
            <div className={cn('px-3 py-3 flex items-center justify-between border-b border-gray-900/70', collapsed && 'px-2')}>
                <div className={cn('flex items-center gap-3 min-w-0', collapsed && 'justify-center w-full')}>
                    <picture>
                        <source srcSet="/brand/DeepResearcherAdvanceBeta.webp" type="image/webp" />
                        <img src="/brand/DeepResearcherAdvanceBeta.png" alt="Deep Researcher" className={cn('select-none', collapsed ? 'h-6 w-6' : 'h-6 w-auto')} draggable={false} />
                    </picture>
                    {!collapsed && (
                        <div className="truncate">
                            <div className="text-sm font-semibold text-gray-100 leading-tight">Deep Researcher</div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500">Research OS</div>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!collapsed && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={onNewChat} title="New chat">
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                    <button
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800"
                        onClick={() => setCollapsed(v => !v)}
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Quick nav */}
            <div className={cn('px-3 py-2 border-b border-gray-900/70', collapsed && 'px-2')}>
                {!collapsed && (
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search chats"
                            className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-900/60 border border-gray-800 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-gray-700"
                        />
                    </div>
                )}
                <div className={cn('mt-2 grid gap-1', collapsed && 'gap-2')}>
                    <NavItem icon={Plus} label="New chat" onClick={onNewChat} collapsed={collapsed} />
                    <NavItem icon={BookOpen} label="Library" onClick={() => { }} collapsed={collapsed} />
                    <NavItem icon={Folder} label="Files" onClick={() => { }} collapsed={collapsed} />
                    <NavItem icon={Cpu} label="Models" onClick={() => { }} collapsed={collapsed} />
                    <NavItem icon={Settings} label="Settings" onClick={() => { }} collapsed={collapsed} />
                </div>
            </div>

            {/* Recent Chats */}
            {!collapsed && (
                <div className="px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recent</p>
                    <div className="space-y-1 max-h-[48vh] overflow-y-auto custom-scrollbar pr-1">
                        {filtered.length === 0 && (
                            <div className="text-sm text-gray-500 px-2 py-3">No chats found</div>
                        )}
                        {filtered.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => onSelectChat?.(chat.id)}
                                className={cn(
                                    'w-full text-left px-2 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-900/60 transition-colors',
                                    activeChatId === chat.id && 'bg-gray-900/80 text-gray-100 border border-gray-800'
                                )}
                            >
                                <div className="truncate">{chat.title}</div>
                                <div className="text-[11px] text-gray-500">{chat.updatedAt}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Profile */}
            <div className={cn('mt-auto p-3 border-t border-gray-900/70', collapsed && 'flex items-center justify-center')}>
                <div className={cn('flex items-center gap-3', collapsed && 'gap-0')}>
                    <Avatar>
                        <AvatarFallback className="bg-gray-800 text-gray-200">U</AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="leading-tight min-w-0">
                            <div className="text-sm text-gray-100 truncate">Boss</div>
                            <div className="text-xs text-gray-500 truncate">boss@example.com</div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}

export default ChatSidebar


