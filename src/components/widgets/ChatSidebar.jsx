import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { cn } from '../../lib/utils'
import { Plus, Search, BookOpen, Folder, Cpu, Settings, ChevronLeft, ChevronRight } from 'lucide-react'

const NavItem = ({ icon: Icon, label, onClick, active = false, collapsed = false }) => (
    <motion.button
        onClick={onClick}
        className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800/60 transition-colors',
            active && 'bg-gray-800/80 text-gray-100',
            collapsed && 'justify-center'
        )}
        title={collapsed ? label : undefined}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
    >
        <Icon className="w-4 h-4" />
        {!collapsed && <span className="truncate">{label}</span>}
    </motion.button>
)

const ChatSidebar = ({
    recentChats = [],
    onNewChat,
    onSelectChat,
    activeChatId,
}) => {
    const [query, setQuery] = useState('')
    const [collapsed, setCollapsed] = useState(false)
    const [headerHover, setHeaderHover] = useState(false)

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

    const isExpanded = !collapsed
    const widthPx = isExpanded ? 288 : 64

    return (
        <motion.aside
            className={cn('hidden md:flex shrink-0 h-screen sticky top-0 flex-col bg-gray-950/70 border-r border-gray-900/80 backdrop-blur-sm')}
            animate={{ width: widthPx }}
            initial={false}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
            {/* Header */}
            <div
                className={cn('h-12 px-3 flex items-center justify-between border-b border-gray-900/70 shrink-0', !isExpanded && 'px-2')}
                onMouseEnter={() => setHeaderHover(true)}
                onMouseLeave={() => setHeaderHover(false)}
            >
                <div className={cn('flex items-center gap-3 min-w-0', !isExpanded && 'justify-center w-full')}>
                    {collapsed ? (
                        headerHover ? (
                            <motion.button
                                key="toggle-left"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800"
                                onClick={() => setCollapsed(v => !v)}
                                title="Expand"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.12 }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        ) : (
                            <picture>
                                <source srcSet="/brand/DeepResearcherAdvanceBeta.webp" type="image/webp" />
                                <img src="/brand/DeepResearcherAdvanceBeta.png" alt="Deep Researcher" className={cn('select-none', 'h-6 w-6')} draggable={false} />
                            </picture>
                        )
                    ) : (
                        <>
                            <picture>
                                <source srcSet="/brand/DeepResearcherAdvanceBeta.webp" type="image/webp" />
                                <img src="/brand/DeepResearcherAdvanceBeta.png" alt="Deep Researcher" className={cn('select-none', 'h-6 w-auto')} draggable={false} />
                            </picture>
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        key="brand-title"
                                        className="truncate"
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="text-sm font-semibold text-gray-100 leading-tight">Deep Researcher</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500">Research OS</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                key="newbtn"
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={onNewChat} title="New chat">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <AnimatePresence initial={false}>
                        {!collapsed && headerHover && (
                            <motion.button
                                key="togglebtn"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800"
                                onClick={() => setCollapsed(v => !v)}
                                title={collapsed ? 'Expand' : 'Collapse'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.12 }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Quick nav */}
            <div className={cn('px-3 py-2 border-b border-gray-900/70 relative', !isExpanded && 'px-2')}>
                <AnimatePresence initial={false}>
                    {isExpanded ? (
                        <motion.div
                            key="search"
                            className="relative"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search chats"
                                className="w-full pl-8 pr-3 py-2 rounded-md bg-gray-900/60 border border-gray-800 text-sm text-gray-200 placeholder:text-gray-500 outline-none focus:border-gray-700"
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="icons-stacked"
                            className="flex flex-col items-center gap-4 py-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <button className="p-2 text-gray-400 hover:text-gray-200" title="New chat" onClick={onNewChat}><Plus className="w-4 h-4" /></button>
                            <button className="p-2 text-gray-400 hover:text-gray-200" title="Library"><BookOpen className="w-4 h-4" /></button>
                            <button className="p-2 text-gray-400 hover:text-gray-200" title="Files"><Folder className="w-4 h-4" /></button>
                            <button className="p-2 text-gray-400 hover:text-gray-200" title="Models"><Cpu className="w-4 h-4" /></button>
                            <button className="p-2 text-gray-400 hover:text-gray-200" title="Settings"><Settings className="w-4 h-4" /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                    {isExpanded && (
                        <motion.div
                            key="nav-items"
                            className={cn('mt-2 grid gap-1')}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            <NavItem icon={Plus} label="New chat" onClick={onNewChat} />
                            <NavItem icon={BookOpen} label="Library" onClick={() => { }} />
                            <NavItem icon={Folder} label="Files" onClick={() => { }} />
                            <NavItem icon={Cpu} label="Models" onClick={() => { }} />
                            <NavItem icon={Settings} label="Settings" onClick={() => { }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recent Chats */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="recent"
                        className="px-3 py-3"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                    >
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recent</p>
                        <div className="space-y-1 max-h-[48vh] overflow-y-auto custom-scrollbar pr-1">
                            {filtered.length === 0 && (
                                <div className="text-sm text-gray-500 px-2 py-3">No chats found</div>
                            )}
                            <AnimatePresence initial={false}>
                                {filtered.map((chat) => (
                                    <motion.button
                                        key={chat.id}
                                        onClick={() => onSelectChat?.(chat.id)}
                                        className={cn(
                                            'w-full text-left px-2 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-900/60 transition-colors',
                                            activeChatId === chat.id && 'bg-gray-900/80 text-gray-100 border border-gray-800'
                                        )}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.14 }}
                                    >
                                        <div className="truncate">{chat.title}</div>
                                        <div className="text-[11px] text-gray-500">{chat.updatedAt}</div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Profile */}
            <div className={cn('mt-auto p-3 border-t border-gray-900/70', !isExpanded && 'flex items-center justify-center')}>
                <div className={cn('flex items-center gap-3', !isExpanded && 'gap-0')}>
                    <Avatar>
                        <AvatarFallback className="bg-gray-800 text-gray-200">U</AvatarFallback>
                    </Avatar>
                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <motion.div
                                key="profiletxt"
                                className="leading-tight min-w-0"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="text-sm text-gray-100 truncate">Boss</div>
                                <div className="text-xs text-gray-500 truncate">boss@example.com</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    )
}

export default ChatSidebar


