import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { useTranscription } from "../useTranscription";
import '../App.css'
import './HomePage.css';

const questions = [
    { id:1, title: "Могу ли я экспортировать готовый текст?", content: "Да, доступны несколько форматов, которые можно использовать для экспорта текста, например, TXT и DOCX." },
    { id:2, title: "Можно ли отредактировать текст, после преобразования?", content: "Да, в инструмент встроен редактор для правки текста" },
    { id:3, title: "Есть ли ограничения на размер или длительность файла?", content: "Ограничений на размер и длительность аудиозаписей или видео нет. Вы можете загружать аудио файлы или видеофайлы любого размера или длительности." },
    { id:4, title: "Позволяет ли сервис расшифровывать запись с диктофона?", content: "Расшифровка записи с диктофона производится также и с любым другим аудио в текст." },
    { id:5, title: "Могу ли я перевести аудио сообщения из мессенджеров в текст?", content: "Конечно! Скачайте необходимые вам файлы и загрузите в наш сервис. Аудио сообщения из телеграмм или ватсап в текст превратятся за считанные секунды. " },
]

function HomePage() {
	const fileInputRef = useRef(null);
	const timersRef = useRef([]);
	const navigate = useNavigate();
	const { startTranscription, isProcessing, progress, statusText } = useTranscription();
	
	const [activeTab, setActiveTab] = useState("file");
	const [isDragActive, setIsDragActive] = useState(false);
	const [selectedFile, setSelectedFile] = useState(null);
	const [videoLink, setVideoLink] = useState("");

	const [errorMessage, setErrorMessage] = useState("");

	const clearAllTimers = () => {
		timersRef.current.forEach((timerId) => clearTimeout(timerId));
		timersRef.current = [];
	};

	useEffect(() => {
		return () => clearAllTimers();
	}, []);

	// const validateFile = (file) => {
	// 	const extension = file?.name.split(".").pop()?.toLowerCase() || "";
	// 	return SUPPORTED_VIDEO_FORMATS.includes(extension);
	// };

	const handleFileSelection = (file) => {
		if (!file) return;

		// if (!validateFile(file)) {
		// 	setSelectedFile(null);
		// 	handleError("Этот формат не поддерживается. Загрузите видео из списка поддерживаемых форматов.");
		// 	return;
		// }

		setSelectedFile(file);
	};

	const handleDrop = (event) => {
		event.preventDefault();
		setIsDragActive(false);
		handleFileSelection(event.dataTransfer.files?.[0]);
	};

	const handleStartTranscription = async () => {
		if (isProcessing) return;

		if (activeTab === "file" && !selectedFile) {
			handleError("Сначала выберите видеофайл для обработки.");
			return;
		}

		if (activeTab === "link" && !videoLink.trim()) {
			handleError("Вставьте ссылку на видео перед запуском преобразования.");
			return;
		}

		try {
			if(activeTab === 'file') {
				const statusData = startTranscription('file', selectedFile);

				const newFileData = {
					id: statusData.task_id,
					title: statusData.filename,
					size: statusData.file_size_mb, 
					duration: statusData.duration_sec,
					text: statusData.result,
					type: statusData.type,
				};

				navigate('/files', {state: newFileData});
			}

			if(activeTab === 'link') {
				const statusData = startTranscription('link', videoLink);
				
				const newFileData = {
					id: statusData.task_id,
					title: statusData.filename,
					size: statusData.file_size_mb, 
					duration: statusData.duration_sec,
					text: statusData.result,
					type: statusData.type,
				};

				navigate('/files', {state: newFileData});
			}
		} catch (error) {
			handleError(error.message || "Не удалось завершить обработку. Попробуйте снова.");
			setSelectedFile(null);
		}
	};

	const handleError = (error) => {
		setErrorMessage(error);
		const timer = setTimeout(() => setErrorMessage(""), 3000)
		timersRef.current.push(timer);
	}

	return (
		<div className="app-root">
			{errorMessage && (
				<p className="error-message">
				<AlertCircle size={16} />
				{errorMessage}
				</p>
			)}

			<main className="page">
				<header className="hero">
					<h1>Преобразуйте аудио и видео в текст</h1>
					<p>
						Быстро превращайте медиа в аккуратный текст с экспортом в популярные
						форматы.
					</p>
				</header>

				<section className="upload-container">
					<div className="tab-row" role="tablist" aria-label="Источник данных">
						<button
							type="button"
							className={`tab-btn ${activeTab === "file" ? "active" : ""}`}
							role="tab"
							aria-selected={activeTab === "file"}
							onClick={() => {
								setActiveTab("file");
								setErrorMessage("");
							}}
						>
							Загрузить файл
						</button>

						<button
							type="button"
							className={`tab-btn ${activeTab === "link" ? "active" : ""}`}
							role="tab"
							aria-selected={activeTab === "link"}
							onClick={() => {
								setActiveTab("link");
								setErrorMessage("");
							}}
						>
							Вставить ссылку
						</button>
					</div>

					{activeTab === "file" ? (
						<div className="dropzone-wrapper">
							<div
								className={`dropzone ${isDragActive ? "active" : ""}`}
								onDragOver={(event) => {
									event.preventDefault();
									setIsDragActive(true);
								}}
								onDragLeave={(event) => {
									event.preventDefault();
									setIsDragActive(false);
								}}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
							>
								<p className="dropzone-title">
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

								{selectedFile && (
									<p className="selected-file">
										Выбран файл: {selectedFile.name}
									</p>
								)}

								<p className="formats-footer">
									Поддерживаемые видеоформаты: mp4, mov, avi, mkv, webm. <br/>
									Поддерживаемые аудиоформаты: aac, mka, mp2, mp3, weba, webm, wma
								</p>
							</div>
						</div>
					) : (
						<div className="link-input-container">
							<label htmlFor="video-link">Ссылка на видео</label>
							<input
								id="video-link"
								type="url"
								value={videoLink}
								onChange={(event) => setVideoLink(event.target.value)}
								placeholder="Вставьте ссылку на видео (https://...)"
							/>
						</div>
					)}

					<button
						type="button"
						className="process-btn"
						onClick={handleStartTranscription}
						disabled={isProcessing}
					>
						{isProcessing ? <Loader2 size={17} className="spin" /> : ""}
						{isProcessing ? "Преобразование..."	: "Преобразовать в текст"}
					</button>

					{(isProcessing) && (
						<div className="progress-container">
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

				<section className="tutorial-section">
					<h2 className="tutorial-title">Как это работает?</h2>
					<div className="tutorial-container">
						<div className="tutorial-desc">
							<h3 className="tutorial-desc-title"><div>1</div>Загрузите аудио или видео</h3>
							<p className="tutorial-desc-text">Перетащите файл в указанную область или нажмите на кнопку «Загрузить файл». Также можно загрузить видео, вставив ссылку.</p>
						</div>
						<div className="tutorial-desc">
							<h3 className="tutorial-desc-title"><div>2</div>Преобразуйте в текст</h3>
							<p className="tutorial-desc-text">Нажмите «Преобразовать в текст», и сервис расшифрует аудио или видео файл в текст.</p>
						</div>
						<div className="tutorial-desc">
							<h3 className="tutorial-desc-title"><div>3</div>Скачайте текст</h3>
							<p className="tutorial-desc-text">Вы можете скачать транскрипцию на своё устройство в формате docx, pdf или txt. Выберите нужный формат и нажмите кнопку «Скачать».</p>
						</div>
					</div>
				</section>

				<section className="questions-section">
                    <div className="questions-header">
                        <h3 className="questions-title">Часто задаваемые вопросы</h3>
                        <p className="questions-header-text">Сервис преобразует видео в текст, предварительно извлекая из него аудиодорожку для максимальной скорости обработки. Все загруженные файлы надежно защищены: видео удаляется сразу после конвертации, а аудио хранится не более суток.</p>
                    </div>
                    <div>
                        {questions.map(({id, title, content}) => {
                            return (
                                <details key={id}>
                                    <summary><span>{title}</span></summary>
                                    <span className="accordion-content">{content}</span>
                                </details>
                            )
                        })}

                    </div>
				</section>
			</main>
		</div>
	)
};

export default HomePage;