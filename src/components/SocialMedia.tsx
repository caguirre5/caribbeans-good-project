import { faInstagram, faFacebookF, faLinkedin, faYoutube } from '@fortawesome/free-brands-svg-icons'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './SocialMedia.css'

interface SocialMediaProps {
  instagramLink?: string;
  facebookLink?: string;
  linkedinLink?: string;
  youtubeLink?: string;
}

function SocialMedia(props: SocialMediaProps) {
  const { instagramLink, facebookLink, linkedinLink, youtubeLink } = props;

  return (
    <div className='icon-container'>
      {facebookLink && <a href={facebookLink}><FontAwesomeIcon icon={faFacebookF} className='icon' /></a>}
      {instagramLink && <a href={instagramLink}><FontAwesomeIcon icon={faInstagram} className='icon' /></a>}
      {linkedinLink && <a href={linkedinLink}><FontAwesomeIcon icon={faLinkedin} className='icon' /></a>}
      {youtubeLink && <a href={youtubeLink}><FontAwesomeIcon icon={faYoutube} className='icon' /></a>}
    </div>
  );
}

export default SocialMedia;
