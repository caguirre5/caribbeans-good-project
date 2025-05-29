import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface SheetData {
  Farm: string;
  Variety: string;
  Process: string;
  'Our Tasting Notes': string;
  '30 KG Sacks': string;
  Price: string;
  '12 bags Bundle + 1 Free': string;
}

const GoogleSheetTable: React.FC = () => {
  const [data, setData] = useState<SheetData[]>([]);
  const SHEET_ID = '1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE'; // Reemplaza con el ID de tu hoja de cálculo
  const API_KEY = 'AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k'; // Reemplaza con tu clave de API
  const RANGE = 'Sheet1!A:G'; // Asegúrate de que el rango cubra todas las columnas

  useEffect(() => {
    const fetchData = async () => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
      try {
        const response = await axios.get(url);
        const rows = response.data.values;
        const formattedData = rows.slice(1).map((row: string[]) => ({
          Farm: row[0],
          Variety: row[1],
          Process: row[2],
          'Our Tasting Notes': row[3],
          '30 KG Sacks': row[4],
          Price: row[5],
          '12 bags Bundle + 1 Free': row[6],
        }));
        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="text-xs">
          <tr>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Farm</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Variety</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Process</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">Our Tasting Notes</th>
            <th className="py-2 px-4 border-b bg-[#9da793] text-center">24 KG Sacks</th>
            <th className="py-2 px-8 border-b bg-[#9da793] text-center">Price / kg</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className={`${index % 2 === 0 ? "bg-[#c9d3c0]" : "bg-white"} hover:bg-[#e6a318] text-xs`}>
              <td className="py-2 px-4 border-b">{row.Farm}</td>
              <td className="py-2 px-4 border-b">{row.Variety}</td>
              <td className="py-2 px-4 border-b">{row.Process}</td>
              <td className="py-2 px-4 border-b">{row['Our Tasting Notes']}</td>
              <td className="py-2 px-4 border-b">{row['30 KG Sacks']}</td>
              <td className="py-2 px-4 border-b">{row.Price}</td>
              <td className="py-2 px-4 border-b">{row['12 bags Bundle + 1 Free']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GoogleSheetTable;
