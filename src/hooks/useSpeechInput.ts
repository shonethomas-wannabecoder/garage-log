import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeechInput() {
  const [isSupported] = useState(() => getSpeechRecognition() != null)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const start = useCallback(
    (onTranscript: (text: string, isFinal: boolean) => void) => {
      const Ctor = getSpeechRecognition()
      if (!Ctor) {
        setError('Voice input is not supported in this browser.')
        return
      }

      setError(null)
      recognitionRef.current?.abort()

      const recognition = new Ctor()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        const isFinal = event.results[event.results.length - 1]?.isFinal ?? false
        onTranscript(transcript.trim(), isFinal)
      }

      recognition.onerror = (event) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return
        setError(
          event.error === 'not-allowed'
            ? 'Microphone access denied. Allow mic permission in browser settings.'
            : 'Could not hear you. Try again.',
        )
        setIsListening(false)
      }

      recognition.onend = () => setIsListening(false)

      recognitionRef.current = recognition
      setIsListening(true)
      recognition.start()
    },
    [],
  )

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { isSupported, isListening, error, start, stop }
}
