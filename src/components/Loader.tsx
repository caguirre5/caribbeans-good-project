import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/green_logo_icon.png'; // Asegúrate de ajustar la ruta a tu logo

const Loader: React.FC<{ onExitComplete: () => void }> = ({ onExitComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  const containerVariants = {
    hidden: { scaleY: 1, originY: '50%' },
    visible: { scaleY: 1, originY: '50%', transition: { duration: 0.5 } },
    exit: { scaleY: 0, originY: '50%', transition: { duration: 1 } },
  };

  const logoVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(onExitComplete, 4000); // Duración de la animación de salida
      return () => clearTimeout(timer);
    }
  }, [isExiting, onExitComplete]);

  return (
    <AnimatePresence>
        {!isExiting && (
            <motion.div
            className="fixed inset-0 flex items-center justify-center bg-[#c9d3c0] z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            onAnimationComplete={() => setIsExiting(true)}
            >
            <motion.img
                src={logo}
                alt="Logo"
                className="w-32 h-32"
                variants={logoVariants}
            />
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default Loader;
