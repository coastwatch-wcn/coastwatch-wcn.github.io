window.addEventListener("load", () => {
  const el = document.getElementById("nino-status");
  if (el) {
    el.textContent = "SCRIPT FILE WORKED";
  } else {
    console.log("nino-status element not found");
  }
  console.log("turtlewatch-status.js loaded");
});