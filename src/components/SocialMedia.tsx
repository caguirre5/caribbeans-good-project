import { faInstagram, faFacebookF, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SocialMediaProps {
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  youtubeLink?: string;
  fontSize?:number;
}

function SocialMedia(props: SocialMediaProps) {
  const { instagramLink, facebookLink, linkedinLink, youtubeLink } = props;

  return (
    <div className='w-auto flex justify-center items-center'>
      {facebookLink && (
        <a href={facebookLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faFacebookF} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {instagramLink && (
        <a href={instagramLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faInstagram} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {linkedinLink && (
        <a href={linkedinLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faLinkedin} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
      {youtubeLink && (
        <a href={youtubeLink} target='a_blank' className='mx-2 w-auto text-current no-underline'>
          <FontAwesomeIcon icon={faYoutube} className='w-6 h-6 m-1 cursor-pointer' />
        </a>
      )}
    </div>
  );
}

export default SocialMedia;
