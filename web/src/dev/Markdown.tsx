"use client"

import { Component, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Se a formatação quebrar, mostra o texto bruto em vez de falhar (caso-limite da spec). */
class RawFallback extends Component<{ text: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (this.state.failed)
      return <pre className="whitespace-pre-wrap text-sm">{this.props.text}</pre>
    return this.props.children
  }
}

export function Markdown({ text }: { text: string }) {
  return (
    <RawFallback text={text}>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </RawFallback>
  )
}
