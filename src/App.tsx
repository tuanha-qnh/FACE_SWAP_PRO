/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, RefreshCw, CheckCircle2, AlertCircle, Info, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'original' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'original') setOriginalImage(reader.result as string);
        else setFaceImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const performFaceSwap = async () => {
    if (!originalImage || !faceImage) {
      setError("Vui lòng tải lên cả ảnh gốc và ảnh khuôn mặt.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const originalBase64 = originalImage.split(',')[1];
      const faceBase64 = faceImage.split(',')[1];

      // Using a more explicit prompt for image editing
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: originalBase64,
                mimeType: 'image/png',
              },
            },
            {
              inlineData: {
                data: faceBase64,
                mimeType: 'image/png',
              },
            },
            {
              text: `TASK: FACE SWAP EDITING.
1. Target Image (Image 1): This is the base image. KEEP everything (background, body, clothes, hair, environment) exactly as it is.
2. Source Face (Image 2): Extract the face from this image.
3. ACTION: Generate a NEW image where you replace the face of the person in Image 1 with the face from Image 2.
4. QUALITY: The blend must be 100% seamless. Match skin tone, lighting, and shadows perfectly.
5. RESTRICTION: Do NOT change anything else in Image 1. Only the facial features should be swapped.
OUTPUT: Return the resulting edited image.`,
            },
          ],
        },
      });

      let foundImage = false;
      const candidates = response.candidates;
      
      if (candidates && candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            setResultImage(`data:image/png;base64,${part.inlineData.data}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        // If no image was returned, it might have returned text explaining why
        const textResponse = response.text;
        console.warn("AI Response Text:", textResponse);
        throw new Error("AI không trả về hình ảnh kết quả. Vui lòng thử lại với ảnh rõ nét hơn.");
      }
    } catch (err: any) {
      console.error("Face Swap Error:", err);
      setError(err.message || "Đã xảy ra lỗi trong quá trình ghép mặt. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setFaceImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center">
              <RefreshCw className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">AI Face Swap Pro</h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-60">
            <span>Công nghệ AI</span>
            <span>Chất lượng 4K</span>
            <span>Bảo mật 100%</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight"
          >
            Ghép mặt AI <span className="italic font-serif">hoàn hảo</span> trong giây lát
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#141414]/60"
          >
            Sử dụng công nghệ Gemini 2.5 mới nhất để tạo ra những bức ảnh ghép mặt chân thực đến mức không thể nhận ra.
          </motion.p>
        </div>

        {/* Instructions */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ImageIcon, title: "1. Chọn ảnh gốc", desc: "Tải lên bức ảnh bạn muốn giữ lại bối cảnh." },
            { icon: RefreshCw, title: "2. Chọn khuôn mặt", desc: "Tải lên bức ảnh có khuôn mặt bạn muốn ghép vào." },
            { icon: CheckCircle2, title: "3. Nhận kết quả", desc: "AI sẽ xử lý và trả về kết quả chân thực nhất." }
          ].map((step, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm">
              <step.icon className="w-8 h-8 mb-4 text-[#5A5A40]" />
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-[#141414]/60">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Original Image */}
          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider opacity-50 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Ảnh gốc (Giữ nguyên bối cảnh)
            </label>
            <div 
              onClick={() => originalInputRef.current?.click()}
              className={cn(
                "relative aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white group",
                originalImage ? "border-transparent" : "border-[#141414]/10 hover:border-[#5A5A40]/40 hover:bg-[#5A5A40]/5"
              )}
            >
              {originalImage ? (
                <>
                  <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" /> Thay đổi ảnh
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#141414]/40" />
                  </div>
                  <p className="font-medium">Tải ảnh gốc lên</p>
                  <p className="text-xs text-[#141414]/40 mt-2">Kéo thả hoặc click để chọn file</p>
                </div>
              )}
              <input 
                type="file" 
                ref={originalInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'original')} 
              />
            </div>
          </div>

          {/* Face Image */}
          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase tracking-wider opacity-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Ảnh khuôn mặt (Để lấy mặt)
            </label>
            <div 
              onClick={() => faceInputRef.current?.click()}
              className={cn(
                "relative aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white group",
                faceImage ? "border-transparent" : "border-[#141414]/10 hover:border-[#5A5A40]/40 hover:bg-[#5A5A40]/5"
              )}
            >
              {faceImage ? (
                <>
                  <img src={faceImage} alt="Face" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" /> Thay đổi ảnh
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-[#141414]/40" />
                  </div>
                  <p className="font-medium">Tải ảnh khuôn mặt lên</p>
                  <p className="text-xs text-[#141414]/40 mt-2">Kéo thả hoặc click để chọn file</p>
                </div>
              )}
              <input 
                type="file" 
                ref={faceInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'face')} 
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={performFaceSwap}
            disabled={isProcessing || !originalImage || !faceImage}
            className={cn(
              "px-12 py-5 rounded-full font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-[#5A5A40]/20",
              isProcessing || !originalImage || !faceImage
                ? "bg-[#141414]/10 text-[#141414]/30 cursor-not-allowed shadow-none"
                : "bg-[#141414] text-white hover:scale-105 active:scale-95"
            )}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                Ghép mặt ngay <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{error}</span>
            </motion.div>
          )}
        </div>

        {/* Result Area */}
        <AnimatePresence>
          {resultImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-20 space-y-8"
            >
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-2">Kết quả hoàn hảo</h3>
                <p className="text-[#141414]/60 italic font-serif">Chỉ thay đổi khuôn mặt, giữ nguyên mọi chi tiết khác.</p>
              </div>
              
              <div className="relative max-w-4xl mx-auto rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                <img src={resultImage} alt="Result" className="w-full h-auto" />
                <div className="absolute top-6 right-6">
                  <a 
                    href={resultImage} 
                    download="faceswap-result.png"
                    className="bg-white/90 backdrop-blur px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-white transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 rotate-180" /> Tải ảnh về
                  </a>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={reset}
                  className="text-sm font-semibold text-[#141414]/40 hover:text-[#141414] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Làm mới và thực hiện lại
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-32 pt-12 border-t border-[#141414]/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[#141414]/40 text-sm">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Ảnh của bạn sẽ được xử lý bảo mật và không được lưu trữ.</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#141414]">Điều khoản</a>
            <a href="#" className="hover:text-[#141414]">Bảo mật</a>
            <a href="#" className="hover:text-[#141414]">Hỗ trợ</a>
          </div>
        </div>
      </main>
    </div>
  );
}
