import GoogleLogin, { GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';
import './Login.css';

function Login() {
    const onFailure = (error) => {
        console.log('Invalid account entered');
    };
    const onSuccess = (googleData: GoogleLoginResponse | GoogleLoginResponseOffline) => {
        console.log(googleData);
    };
    return (
        <div className="loginPage">
            <header className="loginPageHeader">
                <h1>Welcome to AEYB</h1>
                <GoogleLogin
                    className="loginBox"
                    clientId="931818604859-0jd0r03np411c0v0pp89daplg1eansep.apps.googleusercontent.com"
                    onSuccess={onSuccess}
                    onFailure={onFailure}
                    cookiePolicy={'single_host_origin'}
                >
                    Sign in with Google
                </GoogleLogin>
            </header>
        </div>
    );
}

export default Login;
