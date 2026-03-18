// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAuT-RlMl5g4m96V3DtUWGFV6ym7YnMXt8",
    authDomain: "tolexars-ac868.firebaseapp.com",
    databaseURL: "https://tolexars-ac868-default-rtdb.firebaseio.com",
    projectId: "tolexars-ac868",
    storageBucket: "tolexars-ac868.appspot.com",
    messagingSenderId: "148559800786"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make services globally available
window.auth = firebase.auth();
window.database = firebase.database();
window.storage = firebase.storage();

// Also create local constants for use in this file
const auth = window.auth;
const database = window.database;
const storage = window.storage;

console.log('Firebase initialized. Auth available:', !!auth);