import React, { useState, useRef, useEffect } from "react";

const thBase = "px-2 py-2 sm:px-6 sm:py-3 border-b border-gray-200 text-center text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdBase = "px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900 text-center align-middle";

function Table({ headers, rows, menuOpenIdx, setMenuOpenIdx, menuRef, onPlayAudio }) {
  return (
    <div className="responsive-table-wrapper w-full overflow-x-auto">
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
                          <button className="px-2 py-1 rounded hover:bg-gray-100 focus:outline-none" onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)} aria-label="Acciones">
                            <span className="text-xl">⋮</span>
                          </button>
                          {menuOpenIdx === idx && (
                            <div ref={menuRef} className="absolute z-10 right-0 mt-1 w-28 bg-white border border-gray-200 rounded shadow-lg animate-fade-in" style={{ minWidth: "6.5rem" }}>
                              <button onClick={() => { setMenuOpenIdx(null); setTimeout(() => onPlayAudio({ format: row.format, bitDepth: row.bitDepth }, row.url), 100); }} className="block w-full text-left px-3 py-2 text-green-600 hover:bg-gray-50 hover:text-green-800 text-sm">Reproducir</button>
                              <a href={row.url} download={`audio_${row.bitDepth}bits.${row.format}`} className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-gray-50 hover:text-blue-800 text-sm" onClick={() => setMenuOpenIdx(null)}>Descargar</a>
                            </div>
                          )}
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
  const menuRef = useRef(null);

  useEffect(() => {
    if (menuOpenIdx === null) return;
    const closeMenu = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenIdx(null); };
    const closeOnScroll = () => setMenuOpenIdx(null);
    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [menuOpenIdx]);

  if (!files.length) return null;

  const headers = [
    { label: "Formato", key: "format", render: v => v.toUpperCase() },
    { label: "Bits", key: "bitDepth" },
    { label: "Tamaño (KB)", key: "sizeKB" },
    { label: "Acción", key: "url" }
  ];

  return (
    <div className="mt-6 relative">
      <h2 className="text-lg font-semibold mb-2">Comparativa de formatos</h2>
      <Table headers={headers} rows={files} menuOpenIdx={menuOpenIdx} setMenuOpenIdx={setMenuOpenIdx} menuRef={menuRef} onPlayAudio={onPlayAudio} />
    </div>
  );
}

export default ResultTable;
