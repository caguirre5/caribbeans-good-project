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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data submitted:', formData);

    // Aquí conviertes los datos del formulario en el formato JSON requerido.
    const newFarm = {
      title: formData.name,
      region: formData.region,
      altitude: formData.altitude,
      description: formData.description,
      details: [
        `Owner: ${formData.owner}`,
        formData.story
      ],
      buttonText: "Contact Us",
      buttonIcon: "path/to/defaultIcon.png", // puedes modificarlo según necesites
      mapImage: "path/to/defaultMap.png", // puedes modificarlo según necesites
      finca: true,
      coordenates: [0, 0], // puedes modificarlo según necesites
      color: "#000000" // puedes modificarlo según necesites
    };

    try {
      // Aquí haces una solicitud fetch para obtener los datos existentes.
      const response = await fetch('https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json');
      const data = await response.json();

      console.log("Fetch succesfully")

      // Añades la nueva granja a la lista existente.
      data.farms.push(newFarm);

      // Aquí haces una solicitud PUT para actualizar el archivo JSON en el servidor.
      const putResponse = await fetch('https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // O 'http://localhost:5173' para mayor seguridad
          'Access-Control-Allow-Methods': 'PUT',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(data)
      });

      if (putResponse.ok) {
        console.log('Farm added successfully!');
        // Aquí puedes manejar la respuesta exitosa, como mostrar una notificación.
      } else {
        console.error('Failed to add the farm.');
        // Aquí puedes manejar el error, como mostrar un mensaje de error.
      }
    } catch (error) {
      console.error('Error haciendo fetch:', error);
      // Aquí puedes manejar el error, como mostrar un mensaje de error.
    }
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
      <button type="submit" className="text-white bg-[#e6a318] hover:bg-[#c98d15] focus:ring-4 focus:ring-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
    </form>
  );
};

export default CoffeeFarmCMSPage;
