import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

      const plantingRef = doc(db, 'projects', 'planting-trees');
      const maiaRef = doc(db, 'projects', 'maia');
      const colegioRef = doc(db, 'projects', 'colegio');
      const hunchouenRef = doc(db, 'projects', 'hunchouen');
      const othersRef = doc(db, 'projects', 'othercoffees');

      try {
        const [plantingSnap, maiaSnap, colegioSnap, hunchouenSnap, othersSnap] = await Promise.all([
          getDoc(plantingRef),
          getDoc(maiaRef),
          getDoc(colegioRef),
          getDoc(hunchouenRef),
          getDoc(othersRef),
        ]);

        const loadedProjects: Project[] = [];

        if (plantingSnap.exists()) {
          const data = plantingSnap.data();
          loadedProjects.push({
            id: 'planting-trees',
            name: 'Trees-for-file',
            fields: { trees: Number(data.trees) || 0 },
          });
        }

        if (maiaSnap.exists()) {
          const data = maiaSnap.data();
          loadedProjects.push({
            id: 'maia',
            name: 'MAIA',
            fields: { donations: Number(data.donations) || 0 },
          });
        }

        if (colegioSnap.exists()) {
          const data = colegioSnap.data();
          loadedProjects.push({
            id: 'colegio',
            name: 'El Colegio',
            fields: {
              donations: Number(data.donations) || 0,
              kilograms: Number(data.kilograms) || 0,
            },
          });
        }

        if (hunchouenSnap.exists()) {
          const data = hunchouenSnap.data();
          loadedProjects.push({
            id: 'hunchouen',
            name: 'Hunchouen',
            fields: {
              donations: Number(data.donations) || 0,
              kilograms: Number(data.kilograms) || 0,
            },
          });
        }

        if (othersSnap.exists()) {
          const data = othersSnap.data();
          loadedProjects.push({
            id: 'othercoffees',
            name: 'Other coffees',
            fields: { donations: Number(data.donations) || 0 },
          });
        }

        setProjects(loadedProjects);
      } catch (error) {
        console.error('Error loading project data:', error);
      }
    };

    fetchProjects();
  }, []);

  const toggleMenu = (projectId: string) => {
    setMenuOpen((prev) => (prev === projectId ? null : projectId));
  };

  const handleValueChange = async (projectId: string, field: string, newValue: number) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_FULL_ENDPOINT}/api/projects/${projectId}/${field}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newValue }),
      });

      if (response.ok) {
        setProjects((prev) =>
          prev.map((project) =>
            project.id === projectId
              ? { ...project, fields: { ...project.fields, [field]: newValue } }
              : project
          )
        );
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
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between gap-3 mb-4 border-b pb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">Update counters shown across impact projects.</p>
        </div>
        <span className="text-xs text-gray-500">{projects.length} project(s)</span>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No projects found.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {projects.map((project) => {
            const expanded = menuOpen === project.id;

            return (
              <div key={project.id}>
                <button
                  type="button"
                  className="w-full text-left flex items-center justify-between gap-3 py-3"
                  onClick={() => toggleMenu(project.id)}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {Object.keys(project.fields).length} editable field(s)
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 hidden lg:inline">
                      {expanded ? 'Close' : 'Manage'}
                    </span>
                    <FontAwesomeIcon
                      icon={expanded ? faChevronUp : faChevronDown}
                      className="text-gray-500"
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="space-y-2">
                      {Object.entries(project.fields).map(([field, value]) => (
                        <div
                          key={field}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md bg-white border border-gray-200 px-3 py-2"
                        >
                          <label className="text-sm font-semibold capitalize text-gray-800">{field}</label>
                          <div className="flex items-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDecrement(project.id, field, value);
                              }}
                              className="h-9 w-9 rounded-l-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                              title={`Decrease ${field}`}
                            >
                              <FontAwesomeIcon icon={faMinus} className="text-gray-600" />
                            </button>
                            <input
                              type="number"
                              className="h-9 w-28 text-center border-y border-gray-300 px-2 text-sm no-arrows"
                              value={value}
                              onChange={(e) => handleValueChange(project.id, field, Number(e.target.value))}
                              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIncrement(project.id, field, value);
                              }}
                              className="h-9 w-9 rounded-r-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center justify-center"
                              title={`Increase ${field}`}
                            >
                              <FontAwesomeIcon icon={faPlus} className="text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
