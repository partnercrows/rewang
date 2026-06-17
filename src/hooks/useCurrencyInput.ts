import { useState, useCallback, useRef } from "react";

/**
 * Hook untuk input nominal Rupiah dengan pemisah ribuan (ID: titik).
 * Menampilkan "10.000" untuk 10000, sementara value asli tetap number.
 */
export function useCurrencyInput(
  initialValue: number | string = 0,
  onChange?: (value: number) => void
) {
  const initial = typeof initialValue === "string" ? parseFloat(initialValue) : initialValue;
  const [value, setValue] = useState<number>(initial || 0);
  const [displayValue, setDisplayValue] = useState<string>(
    initial > 0 ? formatDisplay(initial) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function formatDisplay(v: number): string {
    return v.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  }

  function parseDisplay(s: string): number {
    // Hapus semua non-digit
    const digits = s.replace(/\D/g, "");
    return parseInt(digits, 10) || 0;
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Simpan posisi kursor sebelum diformat
      const cursorPos = e.target.selectionStart ?? 0;
      const oldLen = raw.length;

      const num = parseDisplay(raw);
      const formatted = num > 0 ? formatDisplay(num) : "";

      setValue(num);
      setDisplayValue(formatted);

      // Kembalikan posisi kursor setelah React render
      const newLen = formatted.length;
      const delta = newLen - oldLen;
      // Sesuaikan posisi kursor relatif terhadap titik pemisah yang ditambahkan
      const rawBeforeCursor = raw.slice(0, cursorPos);
      const rawDigitsBeforeCursor = rawBeforeCursor.replace(/\D/g, "").length;
      // Di formatted, cari posisi setelah sebanyak itu digit
      let newCursorPos = 0;
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ".") {
          digitCount++;
        }
        newCursorPos = i + 1;
        if (digitCount >= rawDigitsBeforeCursor) break;
      }

      if (onChange) onChange(num);

      // Gunakan setTimeout untuk memastikan DOM terupdate sebelum set cursor
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    // Pastikan display selalu terformat saat blur
    if (value > 0) {
      setDisplayValue(formatDisplay(value));
    }
  }, [value]);

  const setCurrencyValue = useCallback(
    (v: number) => {
      setValue(v);
      setDisplayValue(v > 0 ? formatDisplay(v) : "");
    },
    []
  );

  return {
    value,
    displayValue,
    handleChange,
    handleBlur,
    setValue: setCurrencyValue,
    inputRef,
  };
}