import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

// https://jmperezperez.com/outline-focus-ring-a11y/
document.body.addEventListener("keyup", e => {
  if (e.which === 9) {
    /* tab */ document.documentElement.classList.remove("no-focus-outline");
  }
});
