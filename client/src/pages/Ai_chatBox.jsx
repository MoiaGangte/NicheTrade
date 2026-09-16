import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const starterPrompts = [
  'Help me choose a healthy snack',
  'What can I cook for dinner tonight?',
  'Find something under Rs. 500',
]

const Ai_chatBox = () => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { axios } = useAppContext()

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading) return

    const nextMessages = [...messages, { role: 'user', text: trimmedMessage }]
    setMessages(nextMessages)
    setMessage('')

    try {
      setIsLoading(true)
      const { data } = await axios.post('/api/ai/chat', {
        message: trimmedMessage,
        history: messages,
      })

      if (!data.success) throw new Error(data.message)

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: data.reply, products: data.products || [] },
      ])
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: error.response?.data?.message || 'I could not reach the assistant right now. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const submitPrompt = (prompt) => {
    setMessage(prompt)
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:min-h-[620px] md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-5 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">E</div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Eimi Assistant</p>
            <p className="text-xs text-slate-500">Shopping made simpler</p>
          </div>
        </div>
        <button type="button" onClick={() => setMessages([])} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950">
          <span className="text-lg leading-none">+</span> New chat
        </button>
        <div className="mt-auto rounded-xl bg-white p-4 text-xs leading-5 text-slate-500">
          Your shopping companion for quick product ideas and everyday inspiration.
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 md:px-8">
          <div>
            <p className="text-lg font-semibold text-slate-900">Eimi AI</p>
            <p className="text-xs text-slate-500">Ask anything about your next shop</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Online</span>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-8 md:px-14">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-[330px] max-w-2xl flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">✦</div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">How can I help you shop?</h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Get quick ideas for products, recipes, and thoughtful choices from EimiCart.</p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                {starterPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => submitPrompt(prompt)} className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
              {messages.map((item, index) => (
                <div key={`${item.role}-${index}`} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {item.role === 'assistant' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">✦</div>}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'rounded-br-md bg-slate-900 text-white' : 'rounded-bl-md bg-slate-100 text-slate-700'}`}>
                    <p>{item.text}</p>
                    {item.products?.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
                        {item.products.map((product) => (
                          <Link key={product.id} to={product.url} className="flex items-center justify-between gap-4 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                            <span>{product.name}</span>
                            <span className="shrink-0 text-[var(--color-primary)]">View product</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && <div className="flex gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm text-white">✦</div><p className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">Thinking...</p></div>}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4 md:px-14">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-500">
            <input type="text" placeholder="Message Eimi AI..." value={message} onChange={(event) => setMessage(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            <button type="submit" aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={!message.trim() || isLoading}>↑</button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-400">Eimi AI can make mistakes. Check product details before ordering.</p>
        </div>
      </section>
    </main>
  )
}

export default Ai_chatBox