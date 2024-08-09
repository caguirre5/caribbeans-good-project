// DataContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface DataContextType {
  data: SheetData[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SheetData[]>([]);
  const SHEET_ID = '1ee9mykWz7RPDuerdYphfTqNRmDaJQ6sNomhyppCt2mE';
  const API_KEY = 'AIzaSyCFEBX2kLtYtyCBFrcCY4YN_uutqqQPC-k';
  const RANGE = 'Sheet1!A:G';

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
    <DataContext.Provider value={{ data }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
