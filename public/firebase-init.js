async function loadFirebaseConfig() {
  try {
    const module = await import("./firebase-config.js");
    return module.firebaseConfig ?? null;
  } catch {
    return null;
  }
}

async function initializeFirebase() {
  const firebaseConfig = await loadFirebaseConfig();
  if (!firebaseConfig) return;

  try {
    const [{ initializeApp }, { getAnalytics, isSupported }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js")
    ]);

    const app = initializeApp(firebaseConfig);
    if (await isSupported()) getAnalytics(app);
  } catch (error) {
    console.info("Firebase Analytics was not initialized.", error);
  }
}

initializeFirebase();
