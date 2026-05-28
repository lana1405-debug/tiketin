"use client";

import { useEffect } from "react";
import { applyAccentColor, getStoredAccentColor } from "./AccentColorPicker";

/**
 * Komponen ini hanya bertugas membaca warna aksen dari localStorage
 * dan menerapkannya ke CSS variable --primary-color saat pertama render.
 * Diletakkan di root layout agar berlaku di seluruh halaman.
 */
export function AccentColorInit() {
  useEffect(() => {
    const color = getStoredAccentColor();
    applyAccentColor(color);
  }, []);

  return null;
}
