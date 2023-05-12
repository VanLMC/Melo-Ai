import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={darkTheme}>
    <App />
  </ThemeProvider>
);
