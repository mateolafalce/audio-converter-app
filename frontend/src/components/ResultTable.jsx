import React from "react";

const tableBase = "min-w-full bg-white";
const thBase = "px-2 py-2 sm:px-6 sm:py-3 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tdBase = "px-2 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900";

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto w-full">
      <table className={tableBase}>
        <thead className="bg-gray-50">
          <tr>
            {headers.map(h => (
              <th key={h.key} className={thBase}>{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {headers.map(h => (
                <td key={h.key} className={tdBase}>
                  {h.render ? h.render(row[h.key], row) : row[h.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultTable({ files }) {
  if (!files.length) return null;
  const headers = [
    { label: "Formato", key: "format", render: v => v.toUpperCase() },
    { label: "Profundidad (bits)", key: "bitDepth" },
    { label: "Tamaño (KB)", key: "sizeKB" },
    { label: "Acción", key: "url", render: (v, f) =>
      <a href={v} download={`audio_${f.bitDepth}bits.${f.format}`} className="text-blue-600 hover:text-blue-800 hover:underline">Descargar</a>
    }
  ];
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Comparativa de formatos</h2>
      <Table headers={headers} rows={files} />
    </div>
  );
}

export default ResultTable;
