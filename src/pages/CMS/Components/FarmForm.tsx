import React, { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar el icono de Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface CoffeeFarmFormState {
  id: string;
  title: string;
  medal: string | undefined;
  region: string;
  altitude: string;
  intro: string;
  description: string;
  details: { key: string, value: string }[];
  buttonText: string;
  color: string;
  coordinates: [number, number][]; // Cambiar a un array de tuplas
  prefix: string;
  images: File[];
  videoUrls: string[];
}

interface FarmData extends CoffeeFarmFormState {
  imageUrls: string[]; // URLs de las imágenes subidas
}

interface CoffeeFarmCMSPageProps {
  onAddFarm: (newFarm: FarmData) => void;
  onClose: () => void;
}

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Componente para manejar los eventos del mapa
const MapClickHandler: React.FC<{ onMapClick: (coordinates: [number, number]) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick([lat, lng]);
    },
  });
  return null;
};

const CoffeeFarmCMSPage: React.FC<CoffeeFarmCMSPageProps> = ({ onAddFarm }) => {
  const [formData, setFormData] = useState<CoffeeFarmFormState>({
    id: uuidv4(),
    title: '',
    medal: undefined,
    region: '',
    altitude: '',
    intro: '',
    description: '',
    details: [{ key: '', value: '' }],
    buttonText: 'Price & Availability',
    color: '#df9a87',
    coordinates: [], // Inicializar como un array vacío
    prefix: 'Finca',
    images: [],
    videoUrls: [],
  });
  

  const [showMedalInput, setShowMedalInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]); // Progreso de carga por imagen
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [markerPositions, setMarkerPositions] = useState<[number, number][]>([]);


  const maxImages = 20; // Variable para controlar el máximo de imágenes
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoUrlChange = (index: number, value: string) => {
    const updatedUrls = [...formData.videoUrls];
    updatedUrls[index] = value;
    setFormData({ ...formData, videoUrls: updatedUrls });
  };
  
  const handleAddVideoUrl = () => {
    setFormData({ ...formData, videoUrls: [...formData.videoUrls, ''] });
  };
  
  const handleRemoveVideoUrl = (index: number) => {
    const updatedUrls = formData.videoUrls.filter((_, i) => i !== index);
    setFormData({ ...formData, videoUrls: updatedUrls });
  };
  

  const handleMapClick = (coordinates: [number, number]) => {
    const updatedPositions = [...markerPositions, coordinates];
    setMarkerPositions(updatedPositions);
    setFormData({ ...formData, coordinates: updatedPositions }); // Actualizar formData
  };
  
  

  const handleToggleVideoUrl = () => {
    const newState = !showVideoUrlInput;
    setShowVideoUrlInput(newState);
  
    // Si se desactiva el toggle, limpia el array
    if (!newState) {
      setFormData((prev) => ({ ...prev, videoUrls: [] }));
    }
  };
  

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      // Verificar si se supera el límite de imágenes
      if (selectedFiles.length + formData.images.length > maxImages) {
        alert(`You can only upload a maximum of ${maxImages} images.`);
        
        // Limpiar el input de archivos usando la referencia
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setFormData({ ...formData, images: [...formData.images, ...selectedFiles] });
      }
    }
  };

  const handleAddDetail = () => {
    setFormData({
      ...formData,
      details: [...formData.details, { key: '', value: '' }],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
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

  const handleRemoveMarker = (index: number) => {
    const updatedPositions = markerPositions.filter((_, i) => i !== index);
    setMarkerPositions(updatedPositions);
    setFormData({ ...formData, coordinates: updatedPositions }); // Actualizar formData
  };  

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleAltitudeChange = (e: React.ChangeEvent<HTMLInputElement>, isRangeStart: boolean) => {
    const { value } = e.target;
  
    // Actualizar la altitud en formData dependiendo de si es un valor único o un rango
    if (isRangeStart) {
      setFormData({
        ...formData,
        altitude: value + (formData.altitude.includes('-') ? formData.altitude.split('-')[1] : ''),
      });
    } else {
      setFormData({
        ...formData,
        altitude: formData.altitude.split('-')[0] + (value ? ` - ${value}` : ''),
      });
    }
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validar campos requeridos
    if (!formData.title) {
      alert('Name is required.');
      return;
    }
  
    if (!formData.region) {
      alert('Region is required.');
      return;
    }
  
    const altitudeStart = parseFloat(
      formData.altitude.includes('-') ? formData.altitude.split('-')[0].trim() : formData.altitude
    );
    const altitudeEnd = parseFloat(
      formData.altitude.includes('-') ? formData.altitude.split('-')[1].trim() : ''
    );
  
    if (!altitudeStart) {
      alert('At least the minimum altitude is required.');
      return;
    }
  
    if (altitudeEnd && altitudeEnd <= altitudeStart) {
      alert('The maximum altitude must be greater than the minimum altitude.');
      return;
    }

    if (showVideoUrlInput && formData.videoUrls.some(url => url.trim() === '')) {
      alert('All video URLs must be filled or removed.');
      return;
    }
    
  
    setIsLoading(true); // Start the loading
    console.log('Form data submitted:', formData);
  
    try {
      // Subir imágenes a S3 antes de agregar la granja y obtener las URLs generadas
      const imageUrls = await uploadImagesToS3(formData.images, formData.id);
  
      const newFarm: FarmData = {
        ...formData,
        imageUrls, // Añadir las URLs de las imágenes al objeto de la granja
      };
  
      // Llamada a la API para obtener el JSON actual y agregar la nueva granja
      const response = await fetch(
        'https://9r9f3lx5u4.execute-api.eu-west-2.amazonaws.com/dev/caribbeangoods-content-s3/file1.json'
      );
      const data = await response.json();
  
      // Agrega la nueva granja con las URLs de las imágenes
      data.farms.push(newFarm);
  
      // Guardar el JSON actualizado en el servidor
      const putResponse = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/upload`, {
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
   

  // Función para subir imágenes con progreso
  const uploadImagesToS3 = async (images: File[], farmId: string): Promise<string[]> => {
    const imageUrls: string[] = [];
    const progressArray: number[] = new Array(images.length).fill(0);

    const updateProgress = (index: number, value: number) => {
      progressArray[index] = value;
      setUploadProgress([...progressArray]);
    };

    const uploadPromises = images.map((image, index) => {
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${import.meta.env.VITE_FULL_ENDPOINT}/resourcelibray/uploadimages`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded * 100) / event.total);
            updateProgress(index, percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const imageUrl = `https://caribbeangoods-content-s3.s3.eu-west-2.amazonaws.com/resourcelibrarygallery/${farmId}/${image.name}`;
            imageUrls.push(imageUrl);
            resolve(imageUrl);
          } else {
            reject(new Error('Failed to upload'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        const imgFormData = new FormData();
        imgFormData.append('files', image);
        imgFormData.append('farmId', farmId);
        xhr.send(imgFormData);
      });
    });

    await Promise.all(uploadPromises);
    return imageUrls;
  };

  const colorOptions = [
    "#df9a87", "#9ed1c4", "#eecc84", "#0084c1",
    "#f0af83", "#c9d3c0", "#8a341d",
    "#c9c8fb", "#eecc84", "#779d93", "#005f8a",
  ];

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="max-w-4xl mx-auto p-5">
      {isLoading ? (
        <div className="text-center">
          <div className="text-lg font-bold mb-4">Creating farm. Please do not close the tab!</div>
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Uploading images...</div>
            {formData.images.map((image, index) => (
              <div key={index} className="mb-4">
                <span>{image.name}</span>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-500 h-full rounded" style={{ width: `${uploadProgress[index] || 0}%` }}></div>
                </div>
                <span className="text-sm">{uploadProgress[index] || 0}%</span>
              </div>
            ))}
          </div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
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
            <label htmlFor="region" className="block mb-2 text-sm font-medium text-gray-900">Region (Department):</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleSelectChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            >
              <option value="">Select a department</option>
              <option value="Alta Verapaz">Alta Verapaz</option>
              <option value="Baja Verapaz">Baja Verapaz</option>
              <option value="Chimaltenango">Chimaltenango</option>
              <option value="Chiquimula">Chiquimula</option>
              <option value="El Progreso">El Progreso</option>
              <option value="Escuintla">Escuintla</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Huehuetenango">Huehuetenango</option>
              <option value="Izabal">Izabal</option>
              <option value="Jalapa">Jalapa</option>
              <option value="Jutiapa">Jutiapa</option>
              <option value="Petén">Petén</option>
              <option value="Quetzaltenango">Quetzaltenango</option>
              <option value="Quiché">Quiché</option>
              <option value="Retalhuleu">Retalhuleu</option>
              <option value="Sacatepéquez">Sacatepéquez</option>
              <option value="San Marcos">San Marcos</option>
              <option value="Santa Rosa">Santa Rosa</option>
              <option value="Sololá">Sololá</option>
              <option value="Suchitepéquez">Suchitepéquez</option>
              <option value="Totonicapán">Totonicapán</option>
              <option value="Zacapa">Zacapa</option>
              <option value="Acatenango">Acatenango</option>
              <option value="Palencia">Palencia</option>
              <option value="Antigua Guatemala">Antigua Guatemala</option>
              <option value="San Juan Sacatepequez">San Juan Sacatepequez</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="altitude" className="block mb-2 text-sm font-medium text-gray-900">Altitude:</label>
            <div className="flex gap-2">
              <input
                type="number"
                id="altitude-start"
                name="altitude-start"
                placeholder="Min Altitude"
                value={formData.altitude.includes('-') ? formData.altitude.split('-')[0].trim() : formData.altitude}
                onChange={(e) => handleAltitudeChange(e, true)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
              <span className="self-center text-sm text-gray-900">to</span>
              <input
                type="number"
                id="altitude-end"
                name="altitude-end"
                placeholder="Max Altitude"
                value={formData.altitude.includes('-') ? formData.altitude.split('-')[1].trim() : ''}
                onChange={(e) => handleAltitudeChange(e, false)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              />
            </div>
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

          <div>
            <MapContainer
              center={[15.877539, -90.368891]}
              zoom={7}
              style={{ height: '60vh', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {markerPositions.map((position, index) => (
                <Marker key={index} position={position}>
                  <Popup>
                    <div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que el clic se propague al mapa
                          handleRemoveMarker(index);
                        }}
                        className="bg-red-500 font-bold hover:bg-red-600 text-white py-1 px-3 rounded-lg"
                      >
                        Remove Marker
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          
          <div className="my-6">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={showVideoUrlInput} 
                onChange={handleToggleVideoUrl} 
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#eecc84] rounded-full peer-checked:bg-[#e6a318]">
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    showVideoUrlInput ? 'transform translate-x-5' : ''
                  }`}
                />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">Do you want to add a video?</span>
            </label>
          </div>

          {showVideoUrlInput && (
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-900">Video URLs:</label>
              {formData.videoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveVideoUrl(index)}
                    className="text-red-500 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddVideoUrl}
                className="text-blue-500 text-sm font-semibold"
              >
                + Add another video
              </button>
            </div>
          )}



          <div className="mb-6">
            <label htmlFor="images" className="block mb-2 text-sm font-medium text-gray-900">
              Upload Images (Max {maxImages}):
            </label>
            <input
              ref={fileInputRef} // Asigna la referencia al input
              type="file"
              id="images"
              name="images"
              accept=".jpg, .jpeg, .png"
              multiple
              onChange={handleFileChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              disabled={formData.images.length >= maxImages}
            />
            {formData.images.length >= maxImages && (
              <p className="text-red-500 text-sm">
                You have reached the maximum number of images allowed.
              </p>
            )}
          </div>

          <button type="submit" className="text-white bg-[#e6a318] hover:bg-[#c98d15] focus:ring-4 focus:ring-white font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center">Submit</button>
        </>
      )}
    </form>
  );
};

export default CoffeeFarmCMSPage;
