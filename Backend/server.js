require("dotenv").config();
// IMPORT your configured app, don't create a new one!
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ AI Vision Service running on http://localhost:${PORT}`);
  console.log(`🚀 Route active: POST http://localhost:${PORT}/api/image`);
});
