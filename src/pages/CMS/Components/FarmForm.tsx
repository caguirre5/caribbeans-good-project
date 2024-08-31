import React, { useState } from 'react';

interface CoffeeFarmFormState {
  title: string;
  medal: string | undefined;
  region: string;
  altitude: string;
  intro: string;
  description: string;
  details: { key: string, value: string }[];
  buttonText: string;
  color: string;
  coordinates: [number, number];
  prefix: string;
}

interface FarmData extends CoffeeFarmFormState {}

interface CoffeeFarmCMSPageProps {
  onAddFarm: (newFarm: FarmData) => void;
  onClose: () => void;
}

const CoffeeFarmCMSPage: React.FC<CoffeeFarmCMSPageProps> = ({ onAddFarm }) => {
  const [formData, setFormData] = useState<CoffeeFarmFormState>({
    title: '',
    medal: undefined,
    region: '',
    altitude: '',
    intro: '',
    description: '',
    details: [{ key: '', value: '' }],
    buttonText: 'Price & Availability',
    color: '',
    coordinates: [0, 0],
    prefix: 'Finca',
  });

  const [showMedalInput, setShowMedalInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    const { name, value } = e.target;
    if (name.startsWith('details')) {
      const newDetails = [...formData.details];
      if (index !== undefined) {
        const detailKey = name.split('-')[1];
        if (detailKey === 'key') {
          newDetails[index].key = value;
        } else {
          newDetails[index].value = value;
        }
      }
      setFormData({ ...formData, details: newDetails });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddDetail = () => {
    setFormData({
      ...formData,
      details: [...formData.details, { key: '', value: '' }],
    });
  };

  const handleRemoveDetail = (index: number) => {
    const newDetails = formData.details.filter((_, i) => i !== index);
    setFormData({ ...formData, details: newDetails });
  };

  const handleColorChange = (color: string) => {
    setFormData({
      ...formData,
      color,
    });
  };

  const handleToggleChange = () => {
    setShowMedalInput(!showMedalInput);
    if (!showMedalInput) {
      setFormData({ ...formData, medal: '' });
    } else {
      setFormData({ ...formData, medal: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Start the loading
    console.log('Form data submitted:', formData);

    const newFarm: FarmData = {
      ...formData,
    };

    try {
      const response = await fetch('https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json');
      const data = await response.json();

      data.farms.push(newFarm);

      const putResponse = await fetch('http://localhost:3000/resourcelibray/upload', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'file1.json',
          fileContent: JSON.stringify(data),
        }),
      });

      if (putResponse.ok) {
        console.log('Farm added successfully!');
        onAddFarm(newFarm);
        setSuccessMessage('Farm added successfully!');
      } else {
        console.error('Failed to add the farm.');
      }
    } catch (error) {
      console.error('Error adding farm:', error);
    } finally {
      setIsLoading(false); // Stop the loading
    }
  };

  const colorOptions = [
    "#df9a87", "#9ed1c4", "#eecc84", "#0084c1",
    "#f0af83", "#c9d3c0", "#8a341d",
    "#c9c8fb", "#eecc84", "#779d93", "#005f8a",
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-5">
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : successMessage ? (
        <div className="text-green-500 mb-4">{successMessage}</div>
      ) : (
        <>
          <div className='flex gap-4'>
            <div className="mb-6 flex-1">
              <label htmlFor="prefix" className="block mb-2 text-sm font-medium text-gray-900">Prefix:</label>
              <input type="text" id="prefix" name="prefix" value={formData.prefix} onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
            <div className="mb-6 flex-1">
              <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900">Name:</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
          </div>
          <div className="mb-6">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showMedalInput} 
                onChange={handleToggleChange} 
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Do you want to add an achievement?</span>
            </label>
          </div>
          {showMedalInput && (
            <div className="mb-6">
              <label htmlFor="medal" className="block mb-2 text-sm font-medium text-gray-900">Achievement:</label>
              <input type="text" id="medal" name="medal" value={formData.medal} onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
            </div>
          )}
          <div className="mb-6">
            <label htmlFor="region" className="block mb-2 text-sm font-medium text-gray-900">Region:</label>
            <input type="text" id="region" name="region" value={formData.region} onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
          </div>
          <div className="mb-6">
            <label htmlFor="altitude" className="block mb-2 text-sm font-medium text-gray-900">Altitude:</label>
            <input type="text" id="altitude" name="altitude" value={formData.altitude} onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
          </div>
          <div className="mb-6">
            <label htmlFor="intro" className="block mb-2 text-sm font-medium text-gray-900">Intro:</label>
            <textarea id="intro" name="intro" value={formData.intro} onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-24" />
          </div>
          <div className="mb-6">
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">Description:</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-24" />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-900">Details:</label>
            {formData.details.map((detail, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  name={`details-key-${index}`} 
                  value={detail.key} 
                  onChange={(e) => handleInputChange(e, index)} 
                  placeholder="Detail title" 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                />
                <input 
                  type="text" 
                  name={`details-value-${index}`} 
                  value={detail.value} 
                  onChange={(e) => handleInputChange(e, index)} 
                  placeholder="Detail description" 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" 
                />
                <button type="button" onClick={() => handleRemoveDetail(index)} className="text-red-500">Remove</button>
              </div>
            ))}
            <button type="button" onClick={handleAddDetail} className="text-blue-500">Add Detail</button>
          </div>
          <div className="mb-6">
            <label htmlFor="color" className="block mb-2 text-sm font-medium text-gray-900">Select a Color:</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-black' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="coordinates" className="block mb-2 text-sm font-medium text-gray-900">Coordinates:</label>
            <input type="text" id="coordinates" name="coordinates" value={formData.coordinates.join(',')} onChange={(e) => {
              const coords = e.target.value.split(',').map(Number) as [number, number];
              setFormData({ ...formData, coordinates: coords });
            }} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
          </div>
          <button type="submit" className="text-white bg-[#e6a318] hover:bg-[#c98d15] focus:ring-4 focus:ring-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
        </>
      )}
    </form>
  );
};

export default CoffeeFarmCMSPage;
