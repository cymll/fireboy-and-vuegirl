// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7DM6NVYSQhm0mYHbjsLqUB0oN0cSp8Kc",
  authDomain: "fireboy-vuegirl-34414.firebaseapp.com",
  projectId: "fireboy-vuegirl-34414",
  storageBucket: "fireboy-vuegirl-34414.firebasestorage.app",
  messagingSenderId: "490293308279",
  appId: "1:490293308279:web:dab44941861517fdbc8f72",
  measurementId: "G-7XNBX2E1NR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);