import { BadgeCheck, Plus, AlertCircle, Download, Check, Copy, Edit, FileText, Clock, XIcon, Upload, Search, Loader2, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { downloadBlob, generateFile } from "../fileGenerators"; 
import { useSessionHistory } from '../useSessionHistory';
import { useTranscription } from "../useTranscription";
import '../App.css'
import './Files.css'

function Files() {
    const location = useLocation();
	const navigate = useNavigate();
    const { history, addResult, isLoaded } = useSessionHistory();
    const { startTranscription, isProcessing, progress, statusText } = useTranscription();

    const timersRef = useRef([]);
    const textareaRef = useRef(null);
    const modalRef = useRef(null);
	const fileInputRef = useRef(null);

    const [currentFile, setCurrentFile] = useState(null);
    const [fileFormat, setFileFormat] = useState("txt");
    const [errorMessage, setErrorMessage] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [editable, setEditable] = useState(false);
    const [content, setContent] = useState("");

    const [isDragActive, setIsDragActive] = useState(false);
    const [videoLink, setVideoLink] = useState("");

    useEffect(() => {
        if (!isLoaded) return;

        if (location.state && location.state.id) {
            addResult(location.state);
        }

        const targetFile = location.state || history[0];

        if (targetFile) {
            setCurrentFile(targetFile);
            setContent(targetFile.text);
        }

        if (isLoaded && history.length === 0 && !location.state) {
            navigate('/');
        }
    }, [isLoaded, history]);

    useEffect(() => {
        if (editable && textareaRef.current) {
            const scrollPos = window.scrollY;
            const el = textareaRef.current;

            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
            window.scrollTo(0, scrollPos);
        }
    }, [content, editable]);

    
	const clearAllTimers = () => {
        timersRef.current.forEach((timerId) => clearTimeout(timerId));
        timersRef.current = [];
	};

    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    const EXPORT_OPTIONS = [
        { value: "txt", label: ".txt" },
        { value: "pdf", label: ".pdf" },
        { value: "docx", label: ".docx" },
        { value: "doc", label: ".doc" },
    ];

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
            setContent(newFile.text);
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
            setContent(newFile.text);
            modalRef.current.close();
            setVideoLink("");
        } catch (error) {
            handleError(error.message || "Не удалось завершить обработку. Попробуйте снова.");
        }
    }

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentFile.text);
            setIsCopied(true);
            const timer = setTimeout(() => setIsCopied(false), 1800);
            timersRef.current.push(timer);
        } catch {
            handleError("Не удалось скопировать текст. Попробуйте снова.");
        }
    };

    const handleError = (error) => {
        setErrorMessage(error);
        const timer = setTimeout(() => setErrorMessage(""), 3000)
        timersRef.current.push(timer);
    }

    const handleDownload = async () => {
        try {
            const { blob } = await generateFile(content, fileFormat);
            downloadBlob(blob, currentFile.title.split('.').shift());
        } catch (error) {
            console.error("Ошибка экспорта:", error);
            handleError("Не удалось сформировать файл выбранного формата.");
        }
    };

    const switchTab = (id) => {
        const newFile = history.find(elem => elem.id === id);
        setCurrentFile(newFile);
        setContent(newFile.text);
    }

    return (<div className="app-root">
        {errorMessage && !modalRef.current.open && (
			<p className="error-message">
				<AlertCircle size={16} />
				{errorMessage}
			</p>
		)}
        <div className="page2">
            <section className="section-1">
                <div className="section-1-container">
                    <h1 className="history-title">История</h1>
                    <div className="history-section">
                        <button type="button" className="upload-btn btn" onClick={() => modalRef.current.showModal()}>
                            <Plus size={16} />
                            <p>Загрузить файл</p>
                        </button>
                        <hr />
                        <div className="recent" role="tablist">
                            {history.map(({id, title}) => {
                                return (
                                    <button 
                                        key={id}
                                        className={`history-tab btn ${currentFile?.id === id ? "active" : ""}`} 
                                        role="tab" 
                                        aria-selected={currentFile?.id === id} 
                                        onClick={() => switchTab(id)}
                                    >
                                        <BadgeCheck size={19} color="#00ff00" /><span>{title}</span> 
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="section-1-mobile-container">
                    <button type="button" className="go-to-history btn" onClick={() => navigate('/history', {state: currentFile})}>
                        <ArrowLeft size={24} />
                    </button>
                    <button type="button" className="upload-btn btn" onClick={() => modalRef.current.showModal()}>
                        <Plus size={16} />
                        <p>Загрузить файл</p>
                    </button>
                </div>
            </section>
            <section className="section-2">
                <div className="section-2-header">
                    <div className="file-info">
                        <h4 className="file-name">{currentFile?.title}</h4>
                        <p>
                            {currentFile?.type === "file" ? (<span><FileText size={16} />{(currentFile?.size).toFixed(2)}MB</span>) : ""}
                            <span><Clock size={16} />{formatDuration(currentFile?.duration)}</span>
                        </p>
                    </div>
                    <div className="export-row">
                        <label className="format-select">
                            <span>Формат</span>
                            <select
                            value={fileFormat}
                            onChange={(event) => setFileFormat(event.target.value)}
                            >
                            {EXPORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                {option.label}
                                </option>
                            ))}
                            </select>
                        </label>

                        <button type="button" className="download-btn btn" onClick={handleDownload}>
                            <Download size={16} />
                            <p>Скачать</p>
                        </button>
                    </div>
                </div>

                <section className="sub-header">
                    <span>
                        <button type="button" onClick={handleCopy} className="sub-header-btn">
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            <p>{isCopied ? "Скопировано" : "Копировать"}</p>
                        </button>
                        <button type="button" className="sub-header-btn" onClick={() => setEditable(!editable)}>
                            <Edit size={16} />
                            <p>{editable ? "Закончить редактирование" : "Редактировать"}</p>
                        </button>
                    </span>
                    {editable ? (
                        <button type="button" onClick={() => {setContent(currentFile?.text); setEditable(false)}} className="sub-header-btn">
                            <XIcon size={16} />
                            Отменить изменения
                        </button>
                    ) : "" }
                </section>

                <section className="textarea-section">
                    {editable ? (
                        <textarea
                            className="textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            ref={textareaRef}
                        />
                    ) : (
                        <div className="textarea" role="textbox" aria-multiline="true">
                            {content.split('\n').map((line, i) => (
                                <span key={i}>
                                    {line}
                                    {i < content.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </div>
                    )}
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
                        <section className="modal-section">
                            {isProcessing ? (
                                <div className="modal-dropzone-loader">
                                    <Loader2 size={80} color="#6473ff" className="spin" />
                                </div>
                            ) : (
                                <div>
                                    <div className="modal-dropzone-wrapper">
                                        <div
                                            className={`modal-dropzone ${isDragActive ? "active" : ""}`}
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
                                            <p className="modal-dropzone-title">
                                                <Upload size={32} />
                                                Перетащите файлы сюда для загрузки
                                            </p>

                                            <div className="or-divider">
                                                <span>ИЛИ</span>
                                            </div>

                                            <button
                                                type="button"
                                                className="upload-file-btn"
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
                                    <div className="modal-or-divider">
                                        <span>ИЛИ</span>
                                    </div>
                                    <div className="modal-link-input-container">
                                        <div className="modal-link-input-container-content">
                                            <input
                                                id="video-link"
                                                type="url"
                                                value={videoLink}
                                                onChange={(event) => setVideoLink(event.target.value)}
                                                placeholder="Вставьте ссылку на видео (https://...)"
                                            />
                                            <button
                                                type="button"
                                                className="modal-process-btn"
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
                                <div className="progress-container modal-progress">
                                    <div className="progress-header">
                                        <span>{statusText}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </form>
                </dialog>
            </section>
        </div>
    </div>);
}

export default Files;