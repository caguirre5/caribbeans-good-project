
import { motion } from 'framer-motion';

interface ImageCardProps {
  title: string;
  description: string;
  imageUrl: string;
  logoUrl:string;
  url:string;
}

const ImageCard: React.FC<ImageCardProps> = ({ title, description, imageUrl, logoUrl, url }) => {
  return (
    <div className="relative group w-[320px] m-4 flex flex-col items-center">
      <motion.div 
        className="relative rounded-t-full overflow-hidden"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <img src={imageUrl} alt={title} className="w-full h-[460px] object-cover rounded-t-full" />
        <div className="absolute inset-0 bg-[#044421]  opacity-10 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 flex items-center justify-center p-8 pt-[70px] rounded-t-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-xs lg:block">{description}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4 pt-[70px] rounded-t-full text-white group-hover:opacity-0 transition-opacity duration-300">
          <p className="text-5xl text-center block px-10" style={{ fontFamily: "KingsThing" }}>{title}</p>
        </div>
      </motion.div>
      <a href={url} target='_blank'>
        <div className='h-[100px] w-[200px] mt-4 flex justify-center items-center'>
          <img src={logoUrl} alt="" className=" opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </a>
    </div>

  );
}

export default ImageCard;
