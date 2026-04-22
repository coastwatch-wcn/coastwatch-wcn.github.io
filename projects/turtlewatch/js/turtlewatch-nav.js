document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll(".project-tab");

  // Get current page filename
  let current = window.location.pathname.split("/").pop();

  // Handle empty path (homepage)
  if (!current) {
    current = "turtlewatch.html";
  }

  links.forEach(link => {
    let href = link.getAttribute("href");

    // Convert .qmd → .html
    href = href.replace(".qmd", ".html");

    // Match current page
    if (current === href) {
      link.classList.add("active");
    }
  });
});