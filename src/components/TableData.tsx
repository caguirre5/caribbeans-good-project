import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

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
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE/edit?usp=sharing'; // Reemplaza con el enlace de tu archivo CSV publicado

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(CSV_URL);
        console.log('Raw CSV Data:', response.data);
        const parsedData = Papa.parse(response.data, { header: true });
        console.log('Parsed Data:', parsedData.data);
        setData(parsedData.data as SheetData[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Google Sheets Data</h1>
      <table>
        <thead>
          <tr>
            <th>Farm</th>
            <th>Variety</th>
            <th>Process</th>
            <th>Our Tasting Notes</th>
            <th>30 KG Sacks</th>
            <th>Price</th>
            <th>12 bags Bundle + 1 Free</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              <td><span className='text-white'>{row.Farm}</span></td>
              <td>{row.Variety}</td>
              <td>{row.Process}</td>
              <td>{row['Our Tasting Notes']}</td>
              <td>{row['30 KG Sacks']}</td>
              <td>{row.Price}</td>
              <td>{row['12 bags Bundle + 1 Free']}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GoogleSheetTable;
