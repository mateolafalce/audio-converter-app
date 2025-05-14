import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";

const thBase = "px-2 py-2 sm:px-6 sm:py-3 border-b border-gray-200 text-center text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdBase = "px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-center align-middle";

function getMenuCoords(anchor) {
  if (!anchor) return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  return {
    top: rect.bottom + window.scrollY - 16,
    left: rect.left + window.scrollX - 60
  };
}

function MobileMenuPortal({ open, anchorRef, onClose, onPlay, downloadUrl, downloadName }) {
  const coords = useMemo(() => getMenuCoords(anchorRef?.current), [open, anchorRef]);

  if (!open) return null;

  // Función para descargar manualmente el archivo (para máxima compatibilidad móvil)
  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="absolute z-50 w-28 bg-white border border-gray-200 rounded shadow-lg animate-fade-in"
      style={{
        top: coords.top,
        left: coords.left,
        minWidth: "6.5rem"
      }}
    >
      <button
        onMouseDown={e => {
          e.preventDefault();
          e.stopPropagation();
          onPlay();
          onClose();
        }}
        className="block w-full text-left px-3 py-2 text-green-600 hover:bg-gray-50 hover:text-green-800 text-sm"
      >
        Reproducir
      </button>
      <button
        onMouseDown={handleDownload}
        className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-gray-50 hover:text-blue-800 text-sm"
      >
        Descargar
      </button>
    </div>,
    document.body
  );
}

function Table({ headers, rows, menuOpenIdx, setMenuOpenIdx, anchorRefs, onPlayAudio }) {
  return (
    <div className="responsive-table-wrapper w-full">
      <table className="responsive-table bg-white min-w-[480px] w-full">
        <thead className="bg-gray-50">
          <tr>{headers.map(h => <th key={h.key} className={thBase}>{h.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={menuOpenIdx === idx ? "sm:bg-transparent bg-gray-100 transition-colors" : "hover:bg-gray-50 transition-colors"}>
              {headers.map(h => (
                <td key={h.key} className={tdBase}>
                  {h.key !== "url"
                    ? (h.render ? h.render(row[h.key], row, idx) : row[h.key])
                    : (
                      <>
                        <div className="hidden sm:flex items-center gap-2">
                          <a href={row.url} download={`audio_${row.bitDepth}bits.${row.format}`} className="text-blue-600 hover:text-blue-800 hover:underline">Descargar</a>
                          <button onClick={() => onPlayAudio({ format: row.format, bitDepth: row.bitDepth }, row.url)} className="text-green-600 hover:text-green-800 hover:underline">Reproducir</button>
                        </div>
                        <div className="relative flex sm:hidden justify-center">
                          <button
                            ref={el => anchorRefs.current[idx] = el}
                            className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none"
                            onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
                            aria-label="Acciones"
                          >
                            <span className="text-xl">⋮</span>
                          </button>
                        </div>
                      </>
                    )
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultTable({ files, onPlayAudio }) {
  const [menuOpenIdx, setMenuOpenIdx] = useState(null);
  const anchorRefs = useRef([]);

  // Limpia refs si cambia el número de archivos
  useEffect(() => {
    anchorRefs.current = anchorRefs.current.slice(0, files.length);
  }, [files.length]);

  const headers = useMemo(() => [
    { label: "Formato", key: "format", render: v => v.toUpperCase() },
    { label: "Bits", key: "bitDepth" },
    { label: "Tamaño (KB)", key: "sizeKB" },
    { label: "Acción", key: "url" }
  ], []);

  const handleCloseMenu = useCallback(() => setMenuOpenIdx(null), []);
  const handlePlay = useCallback(() => {
    if (menuOpenIdx !== null) {
      const row = files[menuOpenIdx];
      onPlayAudio({ format: row.format, bitDepth: row.bitDepth }, row.url);
    }
  }, [menuOpenIdx, files, onPlayAudio]);

  useEffect(() => {
    if (menuOpenIdx === null) return;
    const closeMenu = e => {
      if (anchorRefs.current[menuOpenIdx]?.contains(e.target)) return;
      setMenuOpenIdx(null);
    };
    const closeOnScroll = () => setMenuOpenIdx(null);
    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [menuOpenIdx]);

  if (!files.length) return null;

  return (
    <div className="mt-6 relative">
      <h2 className="text-lg font-semibold mb-2">Comparativa de formatos</h2>
      <Table
        headers={headers}
        rows={files}
        menuOpenIdx={menuOpenIdx}
        setMenuOpenIdx={setMenuOpenIdx}
        anchorRefs={anchorRefs}
        onPlayAudio={onPlayAudio}
      />
      <MobileMenuPortal
        open={menuOpenIdx !== null}
        anchorRef={menuOpenIdx !== null ? { current: anchorRefs.current[menuOpenIdx] } : null}
        onClose={handleCloseMenu}
        onPlay={handlePlay}
        downloadUrl={menuOpenIdx !== null ? files[menuOpenIdx].url : ""}
        downloadName={menuOpenIdx !== null ? `audio_${files[menuOpenIdx].bitDepth}bits.${files[menuOpenIdx].format}` : ""}
      />
    </div>
  );
}

export default ResultTable;
