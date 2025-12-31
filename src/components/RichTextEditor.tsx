import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold, Italic, Underline, AlignRight, AlignCenter, AlignLeft,
    Image as ImageIcon, Shapes, Trash2, Type, ChevronDown,
    Baseline
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    onRequestShape?: () => void;
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

export const RichTextEditor = ({
    value,
    onChange,
    onRequestShape,
    className,
    placeholder,
    disabled = false
}: RichTextEditorProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

    const [resizeState, setResizeState] = useState<{
        startWidth: number;
        startHeight: number;
        startX: number;
        startY: number;
        direction: string;
    } | null>(null);

    const fonts = [
        { name: "العادي", value: "inherit" },
        { name: "خط اليد (رقعة)", value: "'Aref Ruqaa', serif" },
        { name: "خط فني (مرحي)", value: "'Marhey', sans-serif" },
        { name: "القاهرة (Cairo)", value: "'Cairo', sans-serif" },
        { name: "تاجوال (Tajawal)", value: "'Tajawal', sans-serif" },
        { name: "المراعي (Almarai)", value: "'Almarai', sans-serif" },
        { name: "الأميري (Amiri)", value: "'Amiri', serif" },
        { name: "خط نسخ (Naskh)", value: "'Noto Naskh Arabic', serif" },
        { name: "Arial", value: "Arial" },
        { name: "Times New Roman", value: "Times New Roman" },
    ];

    const fontSizes = [
        { name: "صغير جداً", value: "1" },
        { name: "صغير", value: "2" },
        { name: "عادي", value: "3" },
        { name: "متوسط", value: "4" },
        { name: "كبير", value: "5" },
        { name: "كبير جداً", value: "6" },
        { name: "ضخم", value: "7" },
    ];

    // Sync external value changes safely to avoid loop and cursor jumps
    useEffect(() => {
        if (!disabled && contentRef.current) {
            const currentHtml = contentRef.current.innerHTML;
            // Force update if empty or if value changed externally
            if (currentHtml !== value && document.activeElement !== contentRef.current) {
                contentRef.current.innerHTML = value;
            }
        }
    }, [value, disabled]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG' && contentRef.current?.contains(target)) {
                setSelectedImage(target as HTMLImageElement);
                setTick(t => t + 1);
            } else if (
                contentRef.current?.contains(target) &&
                target !== selectedImage &&
                !target.closest('.image-resize-handle')
            ) {
                setSelectedImage(null);
            }
        };

        const handleScroll = () => { if (selectedImage) setTick(t => t + 1); }

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [selectedImage, disabled]);

    // Force re-render for overlay positioning
    const [tick, setTick] = useState(0);

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedImage) return;

        setResizeState({
            startWidth: selectedImage.clientWidth,
            startHeight: selectedImage.clientHeight,
            startX: e.clientX,
            startY: e.clientY,
            direction
        });
    };

    useEffect(() => {
        if (!resizeState || !selectedImage) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeState || !selectedImage) return;

            const dx = e.clientX - resizeState.startX;
            const dy = e.clientY - resizeState.startY;

            let newWidth = resizeState.startWidth;
            let newHeight = resizeState.startHeight;

            // Horizontal
            if (resizeState.direction.includes('e')) {
                newWidth = resizeState.startWidth + dx;
            } else if (resizeState.direction.includes('w')) {
                newWidth = resizeState.startWidth - dx;
            }

            // Vertical
            if (resizeState.direction.includes('s')) {
                newHeight = resizeState.startHeight + dy;
            } else if (resizeState.direction.includes('n')) {
                newHeight = resizeState.startHeight - dy;
            }

            if (newWidth > 20) selectedImage.style.width = `${newWidth}px`;
            if (newHeight > 20) selectedImage.style.height = `${newHeight}px`;

            setTick(t => t + 1);
        };

        const handleMouseUp = () => {
            setResizeState(null);
            handleInput();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizeState, selectedImage]);

    const handleInput = () => {
        if (contentRef.current) {
            const newHtml = contentRef.current.innerHTML;
            if (newHtml !== value) {
                onChange(newHtml);
            }
        }
    };

    const exec = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        contentRef.current?.focus();
        handleInput();
    };

    const handleToolbarClick = (e: React.MouseEvent, command: string, arg?: string) => {
        e.preventDefault();
        exec(command, arg);
    };

    const handleImageClick = (e: React.MouseEvent) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const src = event.target?.result as string;
                contentRef.current?.focus();
                const imgHtml = `<img src="${src}" style="max-width: 100%; width: 200px; cursor: pointer;" />`;
                document.execCommand("insertHTML", false, imgHtml);
                handleInput();
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (disabled) {
        return (
            <div
                className={cn("prose max-w-none p-2", className)}
                dangerouslySetInnerHTML={{ __html: value }}
            />
        );
    }

    // Calculate overlay position
    let overlayStyle: React.CSSProperties | null = null;
    if (selectedImage && contentRef.current) {
        const editorRect = contentRef.current.getBoundingClientRect();
        const imgRect = selectedImage.getBoundingClientRect();

        // Check if image is still in document
        if (document.contains(selectedImage)) {
            overlayStyle = {
                position: 'absolute',
                top: imgRect.top - editorRect.top + contentRef.current.scrollTop,
                left: imgRect.left - editorRect.left + contentRef.current.scrollLeft,
                width: imgRect.width,
                height: imgRect.height,
                border: '1px solid #3b82f6',
                pointerEvents: 'none',
                zIndex: 50
            };
        }
    }

    return (
        <div className="border rounded-md shadow-sm bg-white overflow-hidden flex flex-col relative w-full">
            {/* Toolbar */}
            <div className="bg-muted p-1 border-b flex flex-wrap gap-1 items-center min-h-[42px]">
                {selectedImage ? (
                    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-top-1">
                        <span className="text-xs font-bold text-blue-600 mr-2 uppercase tracking-wider">تعديل الصورة</span>
                        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs font-semibold" onClick={() => setSelectedImage(null)}>إلغاء التحديد</Button>
                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => { selectedImage.remove(); setSelectedImage(null); handleInput(); }}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Font Family Selector */}
                        <div onMouseDown={(e) => e.preventDefault()}>
                            <Select onValueChange={(val) => exec('fontName', val)}>
                                <SelectTrigger className="h-8 w-[140px] bg-white border-gray-300">
                                    <SelectValue placeholder="نوع الخط" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fonts.map(font => (
                                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                                            {font.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Font Size Selector */}
                        <div onMouseDown={(e) => e.preventDefault()}>
                            <Select onValueChange={(val) => exec('fontSize', val)}>
                                <SelectTrigger className="h-8 w-[100px] bg-white border-gray-300">
                                    <SelectValue placeholder="حجم الخط" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fontSizes.map(size => (
                                        <SelectItem key={size.value} value={size.value}>
                                            {size.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Color Picker */}
                        <div
                            className="flex items-center gap-1 border border-gray-300 rounded-md bg-white px-1 h-8"
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            <Baseline className="h-4 w-4 text-gray-500" />
                            <input
                                type="color"
                                onInput={(e) => exec('foreColor', (e.target as HTMLInputElement).value)}
                                className="w-6 h-6 p-0 border-none cursor-pointer bg-transparent"
                                title="لون الخط"
                            />
                        </div>

                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'bold')} title="Bold">
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'italic')} title="Italic">
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'underline')} title="Underline">
                            <Underline className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'justifyRight')} title="Align Right">
                            <AlignRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'justifyCenter')} title="Align Center">
                            <AlignCenter className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => handleToolbarClick(e, 'justifyLeft')} title="Align Left">
                            <AlignLeft className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={handleImageClick} title="Insert Image">
                            <ImageIcon className="h-4 w-4" />
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                        {onRequestShape && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onMouseDown={(e) => { e.preventDefault(); onRequestShape(); }} title="Insert Shape">
                                <Shapes className="h-4 w-4" />
                            </Button>
                        )}

                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onMouseDown={(e) => { e.preventDefault(); onChange(''); }} title="Delete All">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>

            {/* Content Area Container */}
            <div className="relative flex-1 flex flex-col min-h-0 bg-white">
                <div
                    ref={contentRef}
                    contentEditable={!disabled}
                    onInput={handleInput}
                    className={cn(
                        "p-4 min-h-[200px] outline-none max-w-none prose prose-p:my-1 prose-headings:my-2 cursor-text overflow-auto relative",
                        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
                        className
                    )}
                    data-placeholder={placeholder}
                    suppressContentEditableWarning={true}
                    dir="rtl"
                    style={{ minHeight: '200px' }}
                />

                {/* Resize Overlay */}
                {overlayStyle && (
                    <div style={overlayStyle}>
                        {/* Corners */}
                        <div
                            className="image-resize-handle absolute -right-1 -top-1 w-2.5 h-2.5 bg-blue-500 border border-white cursor-ne-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'ne')}
                        />
                        <div
                            className="image-resize-handle absolute -left-1 -top-1 w-2.5 h-2.5 bg-blue-500 border border-white cursor-nw-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'nw')}
                        />
                        <div
                            className="image-resize-handle absolute -right-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 border border-white cursor-se-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'se')}
                        />
                        <div
                            className="image-resize-handle absolute -left-1 -bottom-1 w-2.5 h-2.5 bg-blue-500 border border-white cursor-sw-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'sw')}
                        />
                        {/* Edges */}
                        <div
                            className="image-resize-handle absolute top-1/2 -translate-y-1/2 -right-1 w-1.5 h-4 bg-blue-500 border border-white cursor-e-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'e')}
                        />
                        <div
                            className="image-resize-handle absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-4 bg-blue-500 border border-white cursor-w-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'w')}
                        />
                        <div
                            className="image-resize-handle absolute left-1/2 -translate-x-1/2 -bottom-1 h-1.5 w-4 bg-blue-500 border border-white cursor-s-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 's')}
                        />
                        <div
                            className="image-resize-handle absolute left-1/2 -translate-x-1/2 -top-1 h-1.5 w-4 bg-blue-500 border border-white cursor-n-resize pointer-events-auto rounded-full shadow-sm"
                            onMouseDown={(e) => handleResizeStart(e, 'n')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
