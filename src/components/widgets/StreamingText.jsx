import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// StreamingText: progressively animates new tokens as they appear
// Props:
// - text: full current text
// - tokenSeparator: regex/string for splitting (default: whitespace)
// - appearDelay: stagger delay between tokens (seconds)
// - className: optional
export default function StreamingText({
    text = '',
    tokenSeparator = /\s+/g,
    appearDelay = 0.02,
    className = ''
}) {
    const tokens = String(text).length ? String(text).split(/(\s+)/) : []

    return (
        <div className={className}>
            <AnimatePresence initial={false}>
                {tokens.map((tok, idx) => (
                    <motion.span
                        key={`t-${idx}-${tok.length}`}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.18, delay: idx * appearDelay }}
                    >
                        {tok}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    )
}


