import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2_j8tVpt2DJHlyEKtz5ZbqOzHlos3zK8",
  authDomain: "moviemagic-227ea.firebaseapp.com",
  projectId: "moviemagic-227ea",
  storageBucket: "moviemagic-227ea.firebasestorage.app",
  messagingSenderId: "319884226445",
  appId: "1:319884226445:web:6db7bb60a7c38db7e497c4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
