import Cookies from 'js-cookie';

if (!Cookies.get('locale')) {
    Cookies.set('locale', 'pl', { expires: 365 });
}

if (!Cookies.get('userId')) {
    Cookies.set('userId', '1', { expires: 1 });
}

console.log('Version:', __APP_VERSION__);

