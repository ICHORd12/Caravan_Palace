const app = require("./app");
const { PORT } = require("./config/env");

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});