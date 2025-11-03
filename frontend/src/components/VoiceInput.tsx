import React, { useState } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
}

/**
 * 语音输入组件
 * 注意：由于科大讯飞WebSocket需要复杂的签名和配置，
 * 这里提供一个简化版本，实际项目中需要实现完整的WebSocket连接
 */
const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, className = '' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleStartRecording = () => {
    setIsRecording(true);
    
    // 使用浏览器的Web Speech API作为替代方案
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        setTranscript(text);
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      alert('您的浏览器不支持语音识别功能');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={`p-4 rounded-full ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-primary-500 hover:bg-primary-600'
        } text-white transition-colors`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isRecording ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          )}
        </svg>
      </button>
      
      {transcript && (
        <div className="flex-1 p-3 bg-gray-100 rounded-lg">
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
      
      {!isRecording && !transcript && (
        <p className="text-gray-500">点击麦克风开始语音输入</p>
      )}
    </div>
  );
};

export default VoiceInput;

