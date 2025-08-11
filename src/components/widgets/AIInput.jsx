import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import {
    Send,
    Paperclip,
    FileText,
    Image,
    File,
    Bot,
    Sparkles,
    Zap,
    Brain,
    Cpu,
    Lightbulb,
    ChevronDown,
    X,
    CheckCircle,
    Loader2,
    Plus,
    Settings,
    Mic,
    MicOff
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import Aurora from '../bits/Aurora/Aurora';
import GradientText from '../bits/GradientText/GradientText';
import ClickSpark from '../bits/ClickSpark/ClickSpark';
import AIInputSettingModal from './AIInputSettingModal';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const AIInput = () => {
    const [query, setQuery] = useState('');
    const [attachedFiles, setAttachedFiles] = useState([]); // Will store {file, importance} objects
    const [messageDisplayVisible, setMessageDisplayVisible] = useState(false);
    const [selectedFileType, setSelectedFileType] = useState('Images');
    const [selectedAgentType, setSelectedAgentType] = useState('Research Assistant');
    const [selectedModel, setSelectedModel] = useState('Claude Sonnet 4');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showTypingIndicator, setShowTypingIndicator] = useState(false);
    const [characterCount, setCharacterCount] = useState(0);
    const [isFileDropdownOpen, setIsFileDropdownOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showFileTypeDropdown, setShowFileTypeDropdown] = useState(false);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const microphoneRef = useRef(null);

    // Auto-resize textarea and character count
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
        setCharacterCount(query.length);

        // Show typing indicator when user is typing
        if (query.length > 0) {
            setShowTypingIndicator(true);
            const timer = setTimeout(() => setShowTypingIndicator(false), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowTypingIndicator(false);
        }
    }, [query]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, [isRecording]);

    // Memoize SplitText props to prevent unnecessary re-renders
    const splitTextProps = useMemo(() => ({
        text: "Deep Researcher AI",
        className: "",
        delay: 100,
        duration: 0.6,
        ease: "elastic.out(1,0.8)",
        splitType: "chars",
        from: { opacity: 0, y: 40 },
        to: { opacity: 1, y: 0 },
        threshold: 0.1,
        rootMargin: "-100px",
        textAlign: "center",
    }), []);

    const navigate = useNavigate();

    const handleSend = async () => {
        if (query.trim() || attachedFiles.length > 0) {
            setIsProcessing(true);

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log("Query sent:", query);
            console.log("Attached Files:", attachedFiles.map(f => ({
                name: f.file.name,
                type: f.file.type,
                importance: f.importance
            })));
            console.log("Agent Type:", selectedAgentType);
            console.log("Model:", selectedModel);

            setMessageDisplayVisible(true);
            setQuery('');
            setAttachedFiles([]);
            setIsProcessing(false);
            setShowSuccess(true);

            setTimeout(() => setShowSuccess(false), 3000);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Navigate to chat route with a new uuid and seed initial message
            const id = uuidv4();
            const initialMsg = {
                id: Date.now(),
                role: 'user',
                content: query.trim(),
                createdAt: new Date().toISOString(),
                // Pass lightweight file descriptors (names only) to avoid serializing File objects
                files: attachedFiles.map(f => ({ file: { name: f.file?.name || 'attachment' }, importance: f.importance }))
            };
            navigate(`/chat/${id}`, { state: { initialMsg } });
        } else {
            setMessageDisplayVisible(true);
            setQuery("Please enter a query or attach a file.");
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            const filesWithImportance = files.map(file => ({
                file,
                importance: 'medium' // Default importance level
            }));
            setAttachedFiles(prev => [...prev, ...filesWithImportance]);
            // Clear the input value to allow selecting the same file again
            event.target.value = '';
        }
    };

    const getAcceptedFileTypes = (fileType = selectedFileType) => {
        switch (fileType) {
            case 'Images':
                return 'image/*';
            case 'PDFs':
                return '.pdf';
            case 'Documents':
                return '.doc,.docx,.txt,.rtf,.odt';
            default:
                return 'image/*,.pdf,.doc,.docx,.txt,.rtf,.odt';
        }
    };

    const triggerFileInput = (fileType = null) => {
        if (fileInputRef.current) {
            // Update the accept attribute based on the selected file type
            if (fileType) {
                fileInputRef.current.accept = getAcceptedFileTypes(fileType);
            }
            fileInputRef.current.click();
        }
    };

    const removeFile = (index) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateFileImportance = (index, importance) => {
        setAttachedFiles(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, importance } : item
            )
        );
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphoneRef.current = stream;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        try {
            if (microphoneRef.current) {
                microphoneRef.current.getTracks().forEach(track => track.stop());
                microphoneRef.current = null;
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const agentTypes = [
        { id: 'research', name: 'Research Assistant', icon: Brain, description: 'Deep research and analysis' },
        { id: 'creative', name: 'Creative Writer', icon: Sparkles, description: 'Creative content generation' },
        { id: 'technical', name: 'Technical Expert', icon: Cpu, description: 'Technical problem solving' },
        { id: 'analyst', name: 'Data Analyst', icon: Lightbulb, description: 'Data analysis and insights' }
    ];

    const models = [
        { id: 'claude-sonnet', name: 'Claude Sonnet 4', description: 'Most advanced model' },
        { id: 'claude-haiku', name: 'Claude Haiku', description: 'Fast and efficient' },
        { id: 'gpt4', name: 'GPT-4', description: 'Creative and analytical' },
        { id: 'gemini', name: 'Gemini', description: 'Multimodal capabilities' }
    ];

    const fileTypes = [
        { id: 'images', name: 'Images', icon: Image, description: 'PNG, JPG, GIF' },
        { id: 'pdfs', name: 'PDFs', icon: FileText, description: 'PDF files' },
        { id: 'documents', name: 'Documents', icon: FileText, description: 'DOC, DOCX, TXT' }
    ];

    return (

        <div className="">
            <div className="fixed h-screen w-full top-0 left-0">
                <Aurora
                    colorStops={["#9933ff", "#ff00ff", "#3366ff", "#009900"]}
                    blend={0.5}
                    amplitude={1.0}
                    speed={0.5}
                />

            </div>
            <ClickSpark
                sparkColor='#fff'
                sparkSize={10}
                sparkRadius={15}
                sparkCount={8}
                duration={300}
            >
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl z-10">
                        {/* Header */}
                        <motion.div
                            className="text-center mb-8"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <GradientText
                                colors={[
                                    "#647eff", "#e83dff", "#8E43AD", "#33f5ff",
                                    "#bb00ff", "#8d47f5", "#ff66b8", "#8E43AD", "#ea9eff"
                                ]}
                                animationSpeed={3}
                                showBorder={false}
                                className="cursor-default"
                            >
                                <h1 className="text-7xl font-bold mb-10 merienda">
                                    Deep Researcher AI
                                </h1>
                            </GradientText>
                            <p className="text-gray-300 text-lg">Advanced AI-powered research and analysis</p>
                        </motion.div>

                        {/* Main Input Container */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div
                                className={`relative bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-6 transition-all duration-200 cursor-text ${isInputFocused ? 'border-gray-600 bg-gray-800/60' : 'hover:border-gray-600 hover:bg-gray-800/55'
                                    }`}
                                onClick={(e) => {
                                    // Only focus if clicking on the container itself, not on buttons or interactive elements
                                    if (e.target === e.currentTarget || e.target.closest('textarea')) {
                                        textareaRef.current?.focus();
                                        setIsInputFocused(true);
                                    }
                                }}
                            >
                                {/* Input Area */}
                                <div className="relative">
                                    <div className="relative rounded-xl p-1 transition-all duration-300">


                                        {/* Textarea */}
                                        <textarea
                                            ref={textareaRef}
                                            className="w-full bg-transparent text-gray-100 resize-none outline-none text-lg leading-relaxed"
                                            placeholder="How can I help you today? (Enter to send, Shift+Enter for new line)"
                                            value={query}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                if (newValue.length <= 2000) {
                                                    setQuery(newValue);
                                                }
                                            }}
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                            onKeyDown={(e) => {
                                                // Check if Enter is pressed
                                                if (e.key === 'Enter' || e.keyCode === 13) {
                                                    // Debug logging
                                                    console.log('Enter pressed:', {
                                                        key: e.key,
                                                        shiftKey: e.shiftKey,
                                                        ctrlKey: e.ctrlKey,
                                                        metaKey: e.metaKey,
                                                        keyCode: e.keyCode,
                                                        which: e.which
                                                    });

                                                    // Check for modifier keys (Shift, Ctrl, Cmd)
                                                    const hasModifier = e.shiftKey || e.ctrlKey || e.metaKey;

                                                    if (!hasModifier) {
                                                        // Plain Enter - send message
                                                        e.preventDefault();
                                                        if (query.trim() || attachedFiles.length > 0) {
                                                            handleSend();
                                                        }
                                                    } else {
                                                        // Shift+Enter, Ctrl+Enter, or Cmd+Enter - allow new line
                                                        // Don't prevent default, let it create a new line
                                                        return;
                                                    }
                                                }
                                            }}
                                            rows="2"
                                        />

                                        {/* Character count and typing indicator */}
                                        <div className="absolute bottom-2 right-4 flex items-center gap-2 text-xs text-gray-400">
                                            {showTypingIndicator && (
                                                <motion.div
                                                    className="flex items-center gap-1"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <motion.div
                                                        className="w-1 h-1 bg-blue-500 rounded-full"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 0.6, repeat: Infinity }}
                                                    />
                                                    <motion.div
                                                        className="w-1 h-1 bg-blue-500 rounded-full"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                    />
                                                    <motion.div
                                                        className="w-1 h-1 bg-blue-500 rounded-full"
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                    />
                                                </motion.div>
                                            )}
                                            <span className={
                                                characterCount >= 2000 ? 'text-red-500' :
                                                    characterCount >= 1900 ? 'text-red-400' :
                                                        characterCount > 1000 ? 'text-orange-500' :
                                                            'text-gray-400'
                                            }>
                                                {characterCount}/2000
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Row */}
                                <div className="flex items-center justify-between mt-4">
                                    {/* Left Controls */}
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu onOpenChange={setIsFileDropdownOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded-lg transition-all duration-200 border cursor-pointer focus:outline-none focus:ring-0 focus:border-transparent ${isFileDropdownOpen
                                                        ? 'border-gray-700/40 bg-gray-700/20'
                                                        : 'border-transparent'
                                                        }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Paperclip className="w-5 h-5" />
                                                </motion.button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50" sideOffset={8}>
                                                {fileTypes.map((type) => (
                                                    <DropdownMenuItem
                                                        key={type.id}
                                                        onClick={() => {
                                                            setSelectedFileType(type.name);
                                                            setTimeout(() => {
                                                                triggerFileInput(type.name);
                                                            }, 100);
                                                        }}
                                                        className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 hover:text-gray-200 focus:text-gray-200 cursor-pointer px-3 py-2"
                                                    >
                                                        <type.icon className="w-4 h-4 mr-2" />
                                                        <div>
                                                            <div className="font-medium">{type.name}</div>
                                                            <div className="text-xs text-gray-400">{type.description}</div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        <AIInputSettingModal
                                            selectedModel={selectedModel}
                                            setSelectedModel={setSelectedModel}
                                            selectedAgentType={selectedAgentType}
                                            setSelectedAgentType={setSelectedAgentType}
                                        >
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-600 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Settings className="w-5 h-5" />
                                            </motion.button>
                                        </AIInputSettingModal>
                                    </div>

                                    {/* Right Controls */}
                                    <div className="flex items-center gap-3">
                                        {/* Model Selector */}
                                        <DropdownMenu onOpenChange={setIsModelDropdownOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`flex items-center gap-2 text-gray-300 hover:text-gray-100 hover:bg-gray-600 transition-all duration-200 border rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-0 focus:border-transparent ${isModelDropdownOpen
                                                        ? 'border-gray-700/40 bg-gray-700/20'
                                                        : 'border-transparent'
                                                        }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="text-sm font-medium">{selectedModel}</span>
                                                    <ChevronDown className="w-4 h-4" />
                                                </motion.button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50" sideOffset={8}>
                                                {models.map((model) => (
                                                    <DropdownMenuItem
                                                        key={model.id}
                                                        onClick={() => setSelectedModel(model.name)}
                                                        className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 hover:text-gray-200 focus:text-gray-200 cursor-pointer px-3 py-2"
                                                    >
                                                        <div>
                                                            <div className="font-medium">{model.name}</div>
                                                            <div className="text-xs text-gray-400">{model.description}</div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Microphone Button */}
                                        <motion.button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!isRecording) {
                                                    setIsRecording(true);
                                                    startRecording();
                                                } else {
                                                    setIsRecording(false);
                                                    stopRecording();
                                                }
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-0 ${isRecording
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                                }`}
                                        >
                                            <AnimatePresence mode="wait">
                                                {isRecording ? (
                                                    <motion.div
                                                        key="recording"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <MicOff className="w-5 h-5" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="mic"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <Mic className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>

                                        {/* Send Button */}
                                        <motion.button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSend();
                                            }}
                                            disabled={isProcessing || (!query.trim() && attachedFiles.length === 0)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white p-3 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-0"
                                        >
                                            <AnimatePresence mode="wait">
                                                {isProcessing ? (
                                                    <motion.div
                                                        key="loading"
                                                        initial={{ opacity: 0, rotate: -90 }}
                                                        animate={{ opacity: 1, rotate: 0 }}
                                                        exit={{ opacity: 0, rotate: 90 }}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="send"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <Send className="w-5 h-5" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>


                                    </div>
                                </div>

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt,.rtf,.odt"
                                    onChange={handleFileChange}
                                />

                                {/* Attached Files Display */}
                                <AnimatePresence>
                                    {attachedFiles.length > 0 && (
                                        <motion.div
                                            className="mt-4 flex flex-wrap gap-2"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {attachedFiles.map((fileObj, index) => (
                                                <motion.div
                                                    key={index}
                                                    className="flex items-center gap-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <File className="w-4 h-4 text-blue-400" />
                                                    <span className="truncate max-w-32">{fileObj.file.name}</span>

                                                    {/* Importance Selector */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                className={`text-xs px-2 py-0.5 rounded cursor-pointer focus:outline-none focus:ring-0
                                                                    ${fileObj.importance === 'high' ? 'bg-red-500/30 text-red-300' :
                                                                        fileObj.importance === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                                                            'bg-blue-500/30 text-blue-300'}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {fileObj.importance}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                                                            <DropdownMenuItem
                                                                onClick={() => updateFileImportance(index, 'high')}
                                                                className="text-red-300 hover:bg-gray-700 cursor-pointer"
                                                            >
                                                                High
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => updateFileImportance(index, 'medium')}
                                                                className="text-yellow-300 hover:bg-gray-700 cursor-pointer"
                                                            >
                                                                Medium
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => updateFileImportance(index, 'low')}
                                                                className="text-blue-300 hover:bg-gray-700 cursor-pointer"
                                                            >
                                                                Low
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeFile(index);
                                                        }}
                                                        className="text-gray-400 hover:text-red-400 p-1 cursor-pointer focus:outline-none focus:ring-0"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Success Animation */}
                                <AnimatePresence>
                                    {showSuccess && (
                                        <motion.div
                                            className="absolute inset-0 bg-green-900/20 rounded-2xl flex items-center justify-center"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <motion.div
                                                className="bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -20, opacity: 0 }}
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                Query sent successfully!
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>



                        {/* Message Display */}
                        <AnimatePresence>
                            {messageDisplayVisible && (
                                <motion.div
                                    className="mt-6 bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <h3 className="text-lg font-semibold text-white">Query Submitted</h3>
                                    </div>
                                    <div className="space-y-2 text-gray-300">
                                        <p><span className="text-blue-400 font-medium">Query:</span> {query.trim() || "No text query"}</p>
                                        {attachedFiles.length > 0 && (
                                            <div>
                                                <p className="text-green-400 font-medium mb-1">Files:</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {attachedFiles.map((fileObj, idx) => (
                                                        <li key={idx} className="text-gray-300">
                                                            {fileObj.file.name}
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs
                                                                ${fileObj.importance === 'high' ? 'bg-red-500/30 text-red-300' :
                                                                    fileObj.importance === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                                                        'bg-blue-500/30 text-blue-300'}`}>
                                                                {fileObj.importance}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <p><span className="text-purple-400 font-medium">Agent:</span> {selectedAgentType}</p>
                                        <p><span className="text-pink-400 font-medium">Model:</span> {selectedModel}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                {/* Your content here */}
            </ClickSpark>
        </div>
    );
};

export default AIInput;