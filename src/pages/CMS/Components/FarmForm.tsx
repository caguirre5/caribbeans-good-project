import React, { useState } from 'react';

interface CoffeeFarmFormState {
  name: string;
  description: string;
  region: string;
  altitude: string;
  owner: string;
  story: string;
  images: File[];
}

const CoffeeFarmCMSPage: React.FC = () => {
  const [formData, setFormData] = useState<CoffeeFarmFormState>({
    name: '',
    description: '',
    region: '',
    altitude: '',
    owner: '',
    story: '',
    images: []
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        images: Array.from(e.target.files)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);
    // Aquí puedes añadir la lógica para enviar los datos al servidor
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-5">
      <div className="mb-6">
        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">Name of the Farm:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange}
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
      </div>
      <div className="mb-6">
        <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">Description:</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-24" />
      </div>
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
        <label htmlFor="owner" className="block mb-2 text-sm font-medium text-gray-900">Owner:</label>
        <input type="text" id="owner" name="owner" value={formData.owner} onChange={handleInputChange}
               className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" />
      </div>
      <div className="mb-6">
        <label htmlFor="story" className="block mb-2 text-sm font-medium text-gray-900">Story:</label>
        <textarea id="story" name="story" value={formData.story} onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-24" />
      </div>
      <div className="mb-6">
        <label htmlFor="images" className="block mb-2 text-sm font-medium text-gray-900">Gallery Images:</label>
        <input type="file" id="images" name="images" multiple onChange={handleFileChange}
               className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none p-2.5" />
      </div>
      <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
    </form>
  );
};

export default CoffeeFarmCMSPage;
