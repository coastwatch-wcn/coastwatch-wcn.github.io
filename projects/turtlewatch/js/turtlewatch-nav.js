document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll(".project-tab");
  let current = window.location.pathname.split("/").pop();

  if (!current) {
    current = "turtlewatch.html";
  }

  links.forEach(link => {
    let href = link.getAttribute("href");
    href = href.replace(".qmd", ".html");

    if (href === current) {
      link.classList.add("active");
    }
  });
});