"use client";

import { cn } from "@heroui/react";
import { Copy, Plus, Pipette } from "lucide-react";
import { useState } from "react";

interface ColorOption {
    id: string;
    name: string;
    hex: string;
}

export function ColorPicker() {
    const [colors, setColors] = useState<ColorOption[]>([
        { id: "1", name: "Midnight Black", hex: "#000000" },
        { id: "2", name: "Soft Beige", hex: "#F5F5DC" },
    ]);
    const [newColor, setNewColor] = useState("#FFFFFF");

    const addColor = () => {
        setColors([...colors, { id: Date.now().toString(), name: "New Color", hex: newColor }]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                    <label className="text-xs text-gray-500">Manual Hex / RGB</label>
                    <div className="flex items-center gap-2  bg-gray-50 p-2 border border-gray-100 focus-within:ring-1 focus-within:ring-black">
                        <div
                            className="h-8 w-8 rounded-xl border border-gray-200 shadow-sm transition-colors"
                            style={{ backgroundColor: newColor }}
                        />
                        <input
                            type="text"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="flex-1 bg-transparent text-sm font-medium outline-none"
                            placeholder="#000000"
                        />
                        <button className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-all" title="Pick from screen (Mock)">
                            <Pipette size={16} />
                        </button>
                    </div>
                </div>
                <button
                    onClick={addColor}
                    className="flex h-12 w-12 items-center justify-center  bg-black text-white transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {colors.map((color) => (
                    <div
                        key={color.id}
                        className="group relative flex cursor-pointer flex-col items-center gap-2  border border-gray-100 bg-white p-3 transition-all hover:border-black hover:shadow-md"
                    >
                        <div
                            className="h-12 w-full  border border-gray-100 shadow-inner"
                            style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs font-medium">{color.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{color.hex}</span>

                        <button className="absolute right-2 top-2  rounded-full bg-white/80 p-1.5 opacity-0 backdrop-blur-sm transition-all hover:bg-white group-hover:opacity-100">
                            <Copy size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
