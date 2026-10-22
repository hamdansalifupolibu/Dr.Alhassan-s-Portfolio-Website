import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../lib/api';

const defaultSettings = {
  fullName: 'Dr. Alhassan Osman',
  shortName: 'Dr. Alhassan Osman',
  academicTitle: 'Dr. Alhassan Osman, Ph.D.',
  position: 'Lecturer (2023 – Present)',
  tagline: 'Lecturer in Electrical & Electronic Engineering · Control Systems · Smart Grids · Machine Learning',
  institution: 'University of Mines and Technology (UMaT), Tarkwa',
  department: 'Department of Electrical and Electronic Engineering',
  email: 'aosman@umat.edu.gh',
  youtubeChannel: 'https://www.youtube.com/@AlhassanWielaPh.D',
  officeLocation: 'Department of Electrical and Electronic Engineering, UMaT, Tarkwa, Ghana',
  officeHours: 'Mon & Wed: 10:00 AM – 12:00 PM | Fri: 2:00 PM – 4:00 PM (or by appointment)',
  bio: "Dr. Alhassan Osman received both his Bachelor and Master's degrees in Electrical and Electronics Engineering from the University of Boumerdes, Algeria, and his Ph.D. degree in Control Engineering from Gaziantep University, Turkey. Since 2023, he serves as Lecturer in the Department of Electrical and Electronic Engineering at the University of Mines and Technology (UMaT), Tarkwa, Ghana. His research interest is in the area of Control Systems, Optimisation, and Machine Learning with applications in Smart Grids, Energy Storage Systems, Variable Renewable Energy Integration, as well as Motors and Capacitors.",
  teachingPhilosophy: 'Engineering education is about bridging rigorous mathematical control theory and real-world energy infrastructure. I empower students to build resilient smart grids, optimize renewable energy systems, and master control algorithms for contemporary technological and sustainable development.',
  researchInterests: 'Control systems, Optimisation and Machine Learning with applications in Smart grids, Energy Storage Systems, Variable Renewable Energy and Integration as well as motors and capacitors.',
  staffDirectoryLink: 'https://umat.edu.gh/staffinfo/staffDetailed.php?contactID=857',
  nonUmatPrice: '20',
};

const SettingsContext = createContext({
  settings: defaultSettings,
  loading: true,
  refreshSettings: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data } = await API.get('/settings');
      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('Failed to fetch site settings, using fallback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
