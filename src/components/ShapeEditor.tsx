import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Rect, Circle, Line, Triangle, Polygon, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Square, Circle as CircleIcon, Triangle as TriangleIcon, Minus, Star, Trash2, Palette, RotateCcw, RotateCw, MoveUp, MoveDown, X, ImagePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ShapeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

const colors = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#008000", "#800000", "#008080", "#000080", "#808080"
];

export const ShapeEditor = ({ isOpen, onClose, onSave }: ShapeEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [activeFill, setActiveFill] = useState("transparent");

  // Add image to canvas
  const addImageToCanvas = useCallback(async (imageSrc: string) => {
    if (!fabricCanvas) return;
    try {
      const img = await FabricImage.fromURL(imageSrc);
      // Scale image to fit canvas
      const maxWidth = 300;
      const maxHeight = 200;
      const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!, 1);
      img.scale(scale);
      img.set({ left: 100, top: 100 });
      fabricCanvas.add(img);
      fabricCanvas.setActiveObject(img);
      fabricCanvas.requestRenderAll();
    } catch (error) {
      console.error("Error adding image:", error);
    }
  }, [fabricCanvas]);

  // Handle paste event
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!fabricCanvas || !isOpen) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            addImageToCanvas(dataUrl);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, [fabricCanvas, isOpen, addImageToCanvas]);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        addImageToCanvas(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !isOpen) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 700,
      height: 400,
      backgroundColor: "#ffffff",
      selection: true,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [isOpen]);

  // Add paste event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("paste", handlePaste);
      return () => {
        document.removeEventListener("paste", handlePaste);
      };
    }
  }, [isOpen, handlePaste]);

  const addRect = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: activeFill === "transparent" ? "#3b82f6" : activeFill,
      stroke: activeColor,
      strokeWidth: 2,
      width: 100,
      height: 80,
    });
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.requestRenderAll();
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: activeFill === "transparent" ? "#22c55e" : activeFill,
      stroke: activeColor,
      strokeWidth: 2,
      radius: 50,
    });
    fabricCanvas.add(circle);
    fabricCanvas.setActiveObject(circle);
    fabricCanvas.requestRenderAll();
  };

  const addTriangle = () => {
    if (!fabricCanvas) return;
    const triangle = new Triangle({
      left: 100,
      top: 100,
      fill: activeFill === "transparent" ? "#eab308" : activeFill,
      stroke: activeColor,
      strokeWidth: 2,
      width: 100,
      height: 87,
    });
    fabricCanvas.add(triangle);
    fabricCanvas.setActiveObject(triangle);
    fabricCanvas.requestRenderAll();
  };

  const addLine = () => {
    if (!fabricCanvas) return;
    const line = new Line([50, 100, 200, 100], {
      stroke: activeColor,
      strokeWidth: 4,
    });
    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);
    fabricCanvas.requestRenderAll();
  };

  const addArrow = () => {
    if (!fabricCanvas) return;
    const arrow = new Polygon([
      { x: 0, y: 20 },
      { x: 100, y: 20 },
      { x: 100, y: 0 },
      { x: 140, y: 30 },
      { x: 100, y: 60 },
      { x: 100, y: 40 },
      { x: 0, y: 40 },
    ], {
      left: 100,
      top: 100,
      fill: activeFill === "transparent" ? "#ef4444" : activeFill,
      stroke: activeColor,
      strokeWidth: 1,
    });
    fabricCanvas.add(arrow);
    fabricCanvas.setActiveObject(arrow);
    fabricCanvas.requestRenderAll();
  };

  const addStar = () => {
    if (!fabricCanvas) return;
    const points = [];
    const outerRadius = 50;
    const innerRadius = 25;
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      points.push({
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
    }
    const star = new Polygon(points, {
      left: 100,
      top: 100,
      fill: activeFill === "transparent" ? "#f59e0b" : activeFill,
      stroke: activeColor,
      strokeWidth: 2,
    });
    fabricCanvas.add(star);
    fabricCanvas.setActiveObject(star);
    fabricCanvas.requestRenderAll();
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    activeObjects.forEach((obj) => fabricCanvas.remove(obj));
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  };

  const rotateSelected = (angle: number) => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + angle);
      fabricCanvas.requestRenderAll();
    }
  };

  const bringForward = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.bringObjectForward(activeObject);
    }
  };

  const sendBackward = () => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      fabricCanvas.sendObjectBackwards(activeObject);
    }
  };

  const applyColorToSelected = (color: string, type: "stroke" | "fill") => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      if (type === "stroke") {
        activeObject.set("stroke", color);
      } else {
        activeObject.set("fill", color);
      }
      fabricCanvas.requestRenderAll();
    }
    if (type === "stroke") {
      setActiveColor(color);
    } else {
      setActiveFill(color);
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.requestRenderAll();
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
          <h2 className="font-bold">محرر الأشكال</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-primary/80">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b flex flex-wrap gap-2 items-center bg-muted">
          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="outline" size="icon" onClick={addRect} title="مربع">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={addCircle} title="دائرة">
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={addTriangle} title="مثلث">
              <TriangleIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={addLine} title="خط">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={addArrow} title="سهم">
              <span className="text-lg">→</span>
            </Button>
            <Button variant="outline" size="icon" onClick={addStar} title="نجمة">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="إضافة صورة">
              <ImagePlus className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex gap-1 border-l pl-2 ml-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="لون الحد">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: activeColor }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm mb-2 font-medium">لون الحد</p>
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => applyColorToSelected(color, "stroke")}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="لون التعبئة">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <p className="text-sm mb-2 font-medium">لون التعبئة</p>
                <div className="grid grid-cols-5 gap-1">
                  <button
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white relative"
                    onClick={() => applyColorToSelected("transparent", "fill")}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">✕</span>
                  </button>
                  {colors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => applyColorToSelected(color, "fill")}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="outline" size="icon" onClick={() => rotateSelected(-15)} title="تدوير يسار">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => rotateSelected(15)} title="تدوير يمين">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={bringForward} title="تقديم">
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={sendBackward} title="تأخير">
              <MoveDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1">
            <Button variant="destructive" size="icon" onClick={deleteSelected} title="حذف">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              مسح الكل
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="p-4 bg-gray-100 flex flex-col items-center overflow-auto">
          <p className="text-xs text-muted-foreground mb-2">يمكنك لصق صورة (Ctrl+V) أو رفعها من الجهاز</p>
          <div className="border border-gray-300 shadow-md">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end gap-2 bg-muted">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave}>
            إدراج في التحضير
          </Button>
        </div>
      </div>
    </div>
  );
};
