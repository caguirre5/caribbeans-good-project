import {motion} from 'framer-motion'
import {ReactNode} from 'react'

interface BasicProps {
    children: ReactNode;
    className: string;
}


export const PushDiv: React.FC<BasicProps> = ({children, className}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
                delay: 0.3,
                duration: 0.5,
            }}
            className={className}
        >
            {children}
        </motion.div>
    ) 
}


export const BouncingDiv: React.FC<BasicProps> = ({children, className}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.3,
                ease: [0, 0.71, 0.2, 1.01],
                scale: {
                type: "spring",
                damping: 5,
                stiffness: 100,
                restDelta: 0.001
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    ) 
}

export const RotatorDiv: React.FC<BasicProps> = ({children, className}) => {
    return (
        <motion.div
            initial={{ scale: 0 }}
            whileInView={{ rotate: 180, scale: 1 }}
            transition={{
            type: "spring",
            stiffness: 200,
            damping: 20
            }}
            className={className}
        >
            {children}
        </motion.div>
    ) 
}

