import { googleAuthUrl } from '../api/auth';
import styles from './google-auth-button.module.css';

type GoogleAuthButtonProps = {
  intent?: 'signin' | 'signup' | 'continue';
};

const labels = {
  signin: 'Sign in with Google',
  signup: 'Sign up with Google',
  continue: 'Continue with Google',
};

export function GoogleAuthButton({ intent = 'continue' }: GoogleAuthButtonProps) {
  return (
    <a className={styles.button} href={googleAuthUrl()}>
      <img
        className={styles.logo}
        src={`${import.meta.env.BASE_URL}assets/google-g.png`}
        alt=""
        aria-hidden="true"
        width={20}
        height={20}
      />
      <span>{labels[intent]}</span>
    </a>
  );
}
