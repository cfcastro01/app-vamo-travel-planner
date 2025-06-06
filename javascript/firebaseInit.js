// javascript/firebaseInit.js
const firebaseConfig = {
  apiKey: "AIzaSyCYjrLne_5WAVdrf632SgfKGC9mzVcuW-A",
  authDomain: "vamo-travel-planner.firebaseapp.com",
  projectId: "vamo-travel-planner",
  storageBucket: "vamo-travel-planner.firebasestorage.app",
  messagingSenderId: "322240259747",
  appId: "1:322240259747:web:af1db49bb3241174dbc116"
};

firebase.initializeApp(firebaseConfig);

// Inicialize o Firebase Authentication e o Firestore
const auth = firebase.auth();
const db = firebase.firestore();