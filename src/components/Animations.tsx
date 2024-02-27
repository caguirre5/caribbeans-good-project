import {motion} from 'framer-motion'
import {ReactNode} from 'react'


interface BasicProps extends React.HTMLProps<HTMLDivElement>{
    children: ReactNode;
    className: string;
    onClick?: () => void;
    variantSide?: boolean;
}


export const PushDiv: React.FC<BasicProps> = ({children, className, onClick}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{
                delay: 0.3,
                duration: 0.5,
            }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}

export const SlideDiv: React.FC<BasicProps> = ({children, className, onClick, variantSide}) => {
    const Ix = variantSide ? 100 : -100;

    return (
        <motion.div
            initial={{ opacity: 0, x:Ix }}
            whileInView={{ opacity: 1, x:0 }}
            transition={{
                duration: 1,
            }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}


export const BouncingDiv: React.FC<BasicProps> = ({children, className, onClick}) => {
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
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}

export const RotatorDiv: React.FC<BasicProps> = ({children, className, onClick}) => {
    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ rotate: 180, scale: 1 }}
            transition={{
            type: "spring",
            stiffness: 200,
            damping: 20
            }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}

export const InfiniteRotation: React.FC<BasicProps> = ({children, className, onClick}) => {
    return (
        <motion.div
            whileInView={{ rotate: 360 }} // La propiedad "rotate" va de 0 a 360 grados
            transition={{ duration: 2, loop: Infinity }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}

export const ZoomedButton: React.FC<BasicProps> = ({children, className, onClick}) => {
    return (
        <motion.div
            whileHover={{ scale: 1.2 }}
            className={className}
            onClick={onClick}
        >
            {children}
        </motion.div>
    ) 
}
