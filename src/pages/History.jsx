import { BadgeCheck, Plus, AlertCircle, Upload, Search, Loader2, Clock, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSessionHistory } from '../useSessionHistory';
import { useTranscription } from "../useTranscription";
import '../App.css'
import './History.css'

function History() {
    const location = useLocation();
    const navigate = useNavigate();
    const { history, addResult, isLoaded } = useSessionHistory();
    const { startTranscription, isProcessing, progress, statusText } = useTranscription();

    const timersRef = useRef([]);
    const modalRef = useRef(null);
	const fileInputRef = useRef(null);

    const [currentFile, setCurrentFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const [isDragActive, setIsDragActive] = useState(false);
    const [videoLink, setVideoLink] = useState("");

    useEffect(() => {
        if (!isLoaded) return;

        if (location.state && location.state.id) {
            addResult(location.state);
        }

        const targetFile = history[0];

        if (targetFile) {
            setCurrentFile(targetFile);
        }

        if (isLoaded && history.length === 0 && !location.state) {
            navigate('/');
        }
    }, [isLoaded, history]);

	const clearAllTimers = () => {
        timersRef.current.forEach((timerId) => clearTimeout(timerId));
        timersRef.current = [];
	};

    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    };

    const handleFileSelection = async (file) => {
        if (!file) return;

        // const extension = file.name.split(".").pop()?.toLowerCase();
        // if (!SUPPORTED_VIDEO_FORMATS.includes(extension)) {
        //     handleError("Неподдерживаемый формат файла");
        //     return;
        // }
        await startProcessingFile(file);
    };

    const startProcessingFile = async (file) => {
        try {
            const statusData = await startTranscription('file', file);

            if (!statusData) return;

            const newFile = {
                id: statusData.task_id, 
                title: statusData.filename, 
                size: statusData.file_size_mb, 
                duration: statusData.duration_sec, 
                text: statusData.result,
                type: statusData.type,
            };
            
            addResult(newFile);
            setCurrentFile(newFile); 
            modalRef.current.close();
        } catch (error) {
            handleError(error.message || "Не удалось завершить обработку. Попробуйте снова.");
        }
    }

    const startProcessingLink = async () => {
        try {            
            const statusData = await startTranscription('link', videoLink);

            if (!statusData) return;

            const newFile = {
                id: statusData.task_id, 
                title: statusData.filename, 
                size: statusData.file_size_mb, 
                duration: statusData.duration_sec, 
                text: statusData.result
            };
            
            addResult(newFile);
            setCurrentFile(newFile); 
            modalRef.current.close();
            setVideoLink("");
        } catch (error) {
            handleError(error.message || "Не удалось завершить обработку. Попробуйте снова.");
        }
    }

    const handleError = (error) => {
        setErrorMessage(error);
        const timer = setTimeout(() => setErrorMessage(""), 3000)
        timersRef.current.push(timer);
    }


    return (<div className="app-root">
            {errorMessage && !modalRef.current.open && (
                <p className="error-message">
                    <AlertCircle size={16} />
                    {errorMessage}
                </p>
            )}
            <div className="history-page">
                <section className="history-page-section-1">
                    <div className="history-page-section-1-container">
                        <div className="history-page-section-1-header">
                            <h1 className="history-page-history-title">История</h1>
                            <button type="button" className="history-page-upload-btn btn" onClick={() => modalRef.current.showModal()}>
                                <Plus size={16} />
                                <p>Загрузить файл</p>
                            </button>
                        </div>
                        <div className="history-page-history-section">
                            <h1 className="history-page-history-section-header"><span>Имя</span> <span className="mobile-hidden">Длительность</span> <span className="mobile-hidden">Размер</span> <span>Статус</span></h1>
                            <div className="history-page-recent" role="tablist">
                                {history.map(({id, title, duration, size, type}) => {
                                    return (
                                        <button 
                                            key={id}
                                            className={`history-page-history-tab btn ${currentFile?.id === id ? "active" : ""}`} 
                                            role="tab" 
                                            aria-selected={currentFile?.id === id} 
                                            onClick={() => navigate('/files', { state: history.find(elem => elem.id === id) })}
                                        >
                                            <span>{title}</span> <span className="mobile-hidden"><Clock />{formatDuration(duration)}</span> {type === "file" ? (<span><FileText size={16} />{size.toFixed(2)}MB</span>) : ""} <span><BadgeCheck size={19} color="#00ff00" /></span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>
                <dialog 
                    id="result-modal" 
                    ref={modalRef}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                        modalRef.current?.close();
                        }
                    }}
                >
                    <form method="dialog">
                        {errorMessage && modalRef.current.open && (
                            <p className="error-message">
                            <AlertCircle size={16} />
                            {errorMessage}
                            </p>
                        )}
                        <section className="history-page-modal-section">
                            {isProcessing ? (
                                <div className="history-page-modal-dropzone-loader">
                                    <Loader2 size={80} color="#6473ff" className="spin" />
                                </div>
                            ) : (
                                <div>
                                    <div className="history-page-modal-dropzone-wrapper">
                                        <div
                                            className={`history-page-modal-dropzone ${isDragActive ? "active" : ""}`}
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                setIsDragActive(true);
                                            }}
                                            onDragLeave={(event) => {
                                                event.preventDefault();
                                                setIsDragActive(false);
                                            }}
                                            onDrop={e => {
                                                e.preventDefault(); 
                                                setIsDragActive(false); 
                                                const file = e.dataTransfer.files[0];
                                                handleFileSelection(file);
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <p className="history-page-modal-dropzone-title">
                                                <Upload size={32} />
                                                Перетащите файлы сюда для загрузки
                                            </p>

                                            <div className="history-page-or-divider">
                                                <span>ИЛИ</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="history-page-upload-file-btn"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {/* <Upload size={16} /> */}
                                                Загрузите файл
                                            </button>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".mp4,.mov,.avi,.mkv,.webm"
                                                onChange={(event) => handleFileSelection(event.target.files?.[0])}
                                            />
                                        </div>
                                    </div>
                                    <div className="history-page-modal-or-divider">
                                        <span>ИЛИ</span>
                                    </div>
                                    <div className="history-page-modal-link-input-container">
                                        <div className="history-page-modal-link-input-container-content">
                                            <input
                                                id="video-link"
                                                type="url"
                                                value={videoLink}
                                                onChange={(event) => setVideoLink(event.target.value)}
                                                placeholder="Вставьте ссылку на видео (https://...)"
                                            />
                                            <button
                                                type="button"
                                                className="history-page-modal-process-btn"
                                                onClick={startProcessingLink}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? <Loader2 size={17} className="spin" /> : <Search size={17} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="history-page-progress-container modal-progress">
                                    <div className="history-page-progress-header">
                                        <span>{statusText}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="history-page-progress-bar">
                                        <div className="history-page-progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </form>
                </dialog>
            </div>
        </div>
    )
}
export default History;