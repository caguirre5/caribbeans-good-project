import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, getDoc } from "firebase/firestore";

interface Project {
  id: string;
  name: string;
  fields: Record<string, number>;
}

const ProjectsList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      const db = getFirestore();
  
      const plantingRef = doc(db, "projects", "planting-trees");
      const maiaRef = doc(db, "projects", "maia");
  
      try {
        const [plantingSnap, maiaSnap] = await Promise.all([
          getDoc(plantingRef),
          getDoc(maiaRef)
        ]);
  
        const loadedProjects: Project[] = [];
  
        if (plantingSnap.exists()) {
          const data = plantingSnap.data();
          loadedProjects.push({
            id: "planting-trees",
            name: "Trees-for-file",
            fields: {
              trees: Number(data.trees) || 0
            }
          });
        }
  
        if (maiaSnap.exists()) {
          const data = maiaSnap.data();
          loadedProjects.push({
            id: "maia",
            name: "MAIA",
            fields: {
              donations: Number(data.donations) || 0
            }
          });
        }
  
        setProjects(loadedProjects);
      } catch (error) {
        console.error("Error loading project data:", error);
      }
    };
  
    fetchProjects();
  }, []);
  

  // Desplegar solo un proyecto a la vez
  const toggleMenu = (projectId: string) => {
    setMenuOpen(prev => (prev === projectId ? null : projectId));
  };

  const handleValueChange = async (projectId: string, field: string, newValue: number) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/projects/${projectId}/${field}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newValue })
      });

      if (response.ok) {
        const updatedProjects = projects.map(project =>
          project.id === projectId
            ? { ...project, fields: { ...project.fields, [field]: newValue } }
            : project
        );
        setProjects(updatedProjects);
      } else {
        console.error('Failed to update project field');
      }
    } catch (error) {
      console.error('Error updating project field:', error);
    }
  };

  const handleIncrement = (projectId: string, field: string, currentValue: number) => {
    handleValueChange(projectId, field, currentValue + 1);
  };

  const handleDecrement = (projectId: string, field: string, currentValue: number) => {
    if (currentValue > 0) {
      handleValueChange(projectId, field, currentValue - 1);
    }
  };

  return (
    <div>
      {projects.map(project => (
        <div
          key={project.id}
          className="bg-white p-4 rounded-lg shadow-md mb-4 cursor-pointer"
          onClick={() => toggleMenu(project.id)} // Mueve la funcionalidad de despliegue aquí
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{project.name}</h2>
          </div>
          {menuOpen === project.id && (
            <div className="mt-4">
              {Object.entries(project.fields).map(([field, value]) => (
                <div key={field} className="flex justify-between items-center mt-2">
                  <label className="text-lg font-medium capitalize">{field}</label>
                  <div className="flex items-center">
                    <button
                      onClick={e => {
                        e.stopPropagation(); // Evita que el clic en el botón cierre el menú
                        handleDecrement(project.id, field, value);
                      }}
                      className="bg-gray-200 p-2 rounded-l focus:outline-none"
                    >
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <input
                      type="number"
                      className="w-28 text-center border-t border-b border-gray-300 p-2 no-arrows"
                      value={value}
                      onChange={e => handleValueChange(project.id, field, Number(e.target.value))}
                      style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }} // Desactivar controles nativos
                      onClick={e => e.stopPropagation()} // Evita cerrar el menú al hacer clic en el input
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation(); // Evita que el clic en el botón cierre el menú
                        handleIncrement(project.id, field, value);
                      }}
                      className="bg-gray-200 p-2 rounded-r focus:outline-none"
                    >
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectsList;
