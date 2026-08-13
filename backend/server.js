const allowedOrigins = [
  process.env.CLIENT_ORIGIN, // Aapki website ka URL
  "http://localhost",        // Android local server
  "capacitor://localhost",    // iOS/Android webview
  "file://"                  // File protocol local fallback
];

app.use(cors({
  origin: function (origin, callback) {
    // 1. Agar request mobile app se hai, toh origin ya toh undefined hoga ya file:// ya localhost
    // 2. Kuch devices me localhost ke aage port (jaise http://localhost:80) bhi aa sakta hai
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('capacitor://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
