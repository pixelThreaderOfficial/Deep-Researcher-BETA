import React from 'react'
import { Bot, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const ChatHeader = ({ onOpenSettings }) => {
    return (
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/60">
            <div className="flex items-center gap-3 text-gray-100">
                <div className="p-2 rounded-lg bg-gray-800 border border-gray-700">
                    <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <div className="font-semibold">Research Assistant</div>
                    <div className="text-xs text-gray-400">Always-on, privacy-first</div>
                </div>
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-gray-100"
                onClick={onOpenSettings}
            >
                <Settings className="w-5 h-5" />
            </motion.button>
        </div>
    )
}

export default ChatHeader


