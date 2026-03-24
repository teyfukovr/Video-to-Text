import { useState, useRef, useEffect } from 'react';

const API_BASE = 'https://gentle-masks-wear.loca.lt/api/transcribe';

export function useTranscription() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    
    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const pollStatus = async (taskId) => {
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        try {
            while (!signal.aborted) {
                const response = await fetch(`${API_BASE}/status/${taskId}`, { signal });
                
                if (!response.ok) throw new Error("Ошибка связи с сервером");
                
                const data = await response.json();
                setProgress(data.progress || 0);
                
                const status = data.status;
                if (status === "queued" || status === "uploaded") setStatusText("В очереди...");
                else if (status === "downloading" || status === "extracting_audio" || status === "transcribing") setStatusText("Обработка...");
                else if (status === "completed") setStatusText("Готово!");

                if (data.result) return data;
                if (data.error) throw new Error(data.error);

                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (error) {
            if (error.name === 'AbortError') return null;
            throw error;
        }
    };

    const startTranscription = async (type, payload) => {
        setIsProcessing(true);
        setProgress(0);
        setStatusText(type === 'file' ? "Загрузка файла..." : "Отправка ссылки...");

        try {
            let response;
            if (type === 'file') {
                const formData = new FormData();
                formData.append('SelectedFile', payload);
                response = await fetch(`${API_BASE}/file`, {
                    method: 'POST',
                    body: formData,
                });
            } else if (type === 'link') {
                response = await fetch(`${API_BASE}/url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ url: payload })
                });
            }

            if (!response.ok) throw new Error("Ошибка при отправке данных на сервер");
            
            const { task_id } = await response.json();
            
            const finalData = await pollStatus(task_id);
            return finalData;

        } finally {
            setIsProcessing(false);
            setTimeout(() => { setProgress(0); setStatusText(""); }, 1000);
        }
    };

    return { startTranscription, isProcessing, progress, statusText };
}