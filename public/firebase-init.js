const firebaseConfig = {
  apiKey: "AIzaSyDQoL061AmvnAF6dr88sbcGUmfA3Ww_uuo",
  authDomain: "summer-school-kinuta.firebaseapp.com",
  projectId: "summer-school-kinuta",
  storageBucket: "summer-school-kinuta.firebasestorage.app",
  messagingSenderId: "184201924575",
  appId: "1:184201924575:web:231b1608cf903303b83e6a",
  measurementId: "G-2QSZBCH0QF"
};

async function initializeFirebase() {
  try {
    const [{ initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js")
    ]);

    const app = initializeApp(firebaseConfig);
    if (await isSupported()) {
      getAnalytics(app);
    }
  } catch (error) {
    console.info("Firebase Analytics was not initialized.", error);
  }
}

initializeFirebase();
