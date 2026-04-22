document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll(".project-tab");
  const current = window.location.pathname.split("/").pop();

  links.forEach(link => {
    let href = link.getAttribute("href");
    href = href.replace(".qmd", ".html");

    if (href === current || (current === "" && href === "turtlewatch.html")) {
      link.classList.add("active");
    }
  });
});