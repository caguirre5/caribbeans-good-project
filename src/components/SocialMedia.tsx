import { faInstagram, faFacebookF, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SocialMediaProps {
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  youtubeLink?: string;
  fontSize?:number;
  color?:string;
}

function SocialMedia(props: SocialMediaProps) {
  const { instagramLink, facebookLink, linkedinLink, youtubeLink, color  } = props;

  const iconStyle = {
    color: color || 'inherit'
  };

  return (
    <div className='w-auto flex justify-center items-center text-white'>
      {facebookLink && (
        <a href={facebookLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faFacebookF} style={iconStyle} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {instagramLink && (
        <a href={instagramLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faInstagram} style={iconStyle} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {linkedinLink && (
        <a href={linkedinLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faLinkedin} style={iconStyle} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {youtubeLink && (
        <a href={youtubeLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faYoutube} style={iconStyle} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
    </div>
  );
}

export default SocialMedia;
