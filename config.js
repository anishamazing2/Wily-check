import * as firebase from 'firebase'
require('@firebase/firestore')

var firebaseConfig = {
  apiKey: "AIzaSyDuq86D3sQaoamrX5EpIsj5H41rd_c6JUw",
  authDomain: "wily-c8217.firebaseapp.com",
  databaseURL: "https://wily-c8217-default-rtdb.firebaseio.com",
  projectId: "wily-c8217",
  storageBucket: "wily-c8217.appspot.com",
  messagingSenderId: "628109759353",
  appId: "1:628109759353:web:df4c9b4be64a8f9c9215a8"
};
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();
