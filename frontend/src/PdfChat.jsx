
import './App.css'
import React, { useState, useRef, useEffect } from 'react'
import { Send, Upload, FileText, X, Loader2 } from 'lucide-react'

export default function PDFChatApp() {
	const [messages, setMessages] = useState([])
	const [input, setInput] = useState('')
	const [uploadedPDFs, setUploadedPDFs] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [sessionId, setSessionId] = useState(null)
	const [error, setError] = useState(null)

	const messagesEndRef = useRef(null)
	const fileInputRef = useRef(null)

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const handleFileUpload = async (e) => {
		const files = Array.from(e.target.files)
		const pdfFiles = files.filter(file => file.type === 'application/pdf')

		if (pdfFiles.length === 0) return

		setError(null)

		// Track successful uploads
		let successCount = 0
		let failCount = 0

		// Process all selected PDF files
		for (const selectedFile of pdfFiles) {
			// Add to uploaded PDFs list
			const newPDF = {
				id: Date.now() + Math.random(),
				name: selectedFile.name,
				size: (selectedFile.size / 1024).toFixed(2) + ' KB'
			}
			setUploadedPDFs(prev => [...prev, newPDF])

			// Inform user
			setMessages(prev => [...prev, {
				role: 'system',
				content: `Uploading PDF: ${selectedFile.name}...`
			}])

			// Send the file to backend with existing session_id as query parameter
			const form = new FormData()
			form.append('file', selectedFile)
			
			// Build URL with session_id as query parameter if it exists
			const url = sessionId ? `/api/upload?session_id=${sessionId}` : '/api/upload'
			
			try {
				const res = await fetch(url, {
					method: 'POST',
					body: form
				})
				if (!res.ok) {
					const err = await res.json().catch(() => ({}))
					throw new Error(err.detail || `Upload failed (${res.status})`)
				}
				const data = await res.json()
				setSessionId(data.session_id) // Store session_id for subsequent uploads
				
				setMessages(prev => [...prev, { 
					role: 'system', 
					content: `✓ ${selectedFile.name} uploaded successfully` 
				}])
				successCount++
			} catch (err) {
				setError(err.message)
				setMessages(prev => [...prev, { 
					role: 'system', 
					content: `Upload error for ${selectedFile.name}: ${err.message}` 
				}])
				// Remove the PDF from state if upload failed
				setUploadedPDFs(prev => prev.filter(pdf => pdf.id !== newPDF.id))
				failCount++
			}
		}
		
		// Clear file input to allow re-selecting the same files
		if (fileInputRef.current) fileInputRef.current.value = ''
		
		// Show summary message only if at least one upload succeeded
		if (successCount > 0) {
			setMessages(prev => [...prev, { 
				role: 'system', 
				content: `${successCount} PDF(s) uploaded successfully. ${failCount > 0 ? `${failCount} failed.` : 'You can now chat with your documents.'}` 
			}])
		}
	}

	const removePDF = (id) => {
		setUploadedPDFs(uploadedPDFs.filter(pdf => pdf.id !== id))
	}

	const handleSendMessage = async () => {
		if (!input.trim()) return
		if (!sessionId) {
			setMessages(prev => [...prev, { role: 'system', content: 'Please upload at least one PDF first.' }])
			return
		}

		const currentInput = input
		const userMessage = { role: 'user', content: currentInput }
		setMessages(prev => [...prev, userMessage])
		setInput('')
		setIsLoading(true)
		setError(null)

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query: currentInput, session_id: sessionId })
			})
			if (!res.ok) {
				const err = await res.json().catch(() => ({}))
				throw new Error(err.detail || `Chat failed (${res.status})`)
			}
			const data = await res.json()
			const botMessage = { role: 'assistant', content: `${data.answer}` }
			setMessages(prev => [...prev, botMessage])
		} catch (err) {
			setError(err.message)
			setMessages(prev => [...prev, { role: 'system', content: `Error: ${err.message}` }])
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			<div className="bg-white border-b border-gray-200 px-6 py-4">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-2xl font-bold text-gray-800">Chat with PDF</h1>
					<p className="text-sm text-gray-500 mt-1">Upload documents and ask questions</p>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto px-6 py-6">
				<div className="max-w-4xl mx-auto space-y-6">
					{messages.length === 0 ? (
						<div className="h-full flex items-center justify-center text-center py-20">
							<div className="max-w-md">
								<div className="text-6xl mb-4">📄</div>
								<h3 className="text-2xl font-semibold text-gray-700 mb-3">Start chatting with your PDFs</h3>
								<p className="text-gray-500 mb-6">Upload PDF documents below and ask questions to get instant insights</p>
								{uploadedPDFs.length > 0 && (
									<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
										<p className="text-sm font-medium text-blue-800 mb-2">Ready to chat with:</p>
										<div className="space-y-1">
											{uploadedPDFs.map(pdf => (
												<div key={pdf.id} className="text-sm text-blue-600">{pdf.name}</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					) : (
						<>
							{messages.map((msg, idx) => (
								<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
									<div className={`max-w-3xl ${
										msg.role === 'user' 
											? 'bg-blue-600 text-white' 
											: msg.role === 'system'
											? 'bg-green-50 text-green-800 border border-green-200'
											: 'bg-white text-gray-800 border border-gray-200'
										} rounded-2xl px-5 py-3 shadow-sm`}>
										{msg.role === 'system' && (
											<div className="flex items-center gap-2 mb-1">
												<Upload size={14} />
												<span className="text-xs font-semibold">System</span>
											</div>
										)}
										<p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
									</div>
								</div>
							))}

							{isLoading && (
								<div className="flex justify-start">
									<div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
										<Loader2 className="animate-spin text-gray-500" size={20} />
									</div>
								</div>
							)}
						</>
					)}

					{error && (
						<div className="text-sm text-red-600">{error}</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input Area - Fixed at Bottom */}
			<div className="bg-white border-t border-gray-200 px-6 py-4">
				<div className="max-w-4xl mx-auto space-y-4">
					{/* Uploaded PDFs Display */}
					{uploadedPDFs.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{uploadedPDFs.map(pdf => (
								<div key={pdf.id} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
									<FileText className="text-red-500" size={16} />
									<span className="text-gray-700 font-medium">{pdf.name}</span>
									<span className="text-gray-500 text-xs">({pdf.size})</span>
									{/* <button
										onClick={() => removePDF(pdf.id)}
										className="text-gray-400 hover:text-red-500 transition-colors ml-1"
									>
										<X size={16} />
									</button> */}
								</div>
							))}
						</div>
					)}

					{/* Upload Button */}
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept=".pdf"
							onChange={handleFileUpload}
							className="hidden"
							multiple={true}
							/>
						<button
							onClick={() => fileInputRef.current?.click()}
							className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
						>
							<Upload size={18} />
							Upload PDF(s)
						</button>
					</div>

					{/* Message Input */}
					<div className="flex gap-3">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
							placeholder={!sessionId ? "Upload PDF(s) first..." : "Ask a question about your PDFs..."}
							className="flex-1 px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
							disabled={!sessionId}
						/>
						<button
							onClick={handleSendMessage}
							disabled={!input.trim() || !sessionId || isLoading}
							className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2 font-medium shadow-sm"
						>
							<Send size={18} />
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
